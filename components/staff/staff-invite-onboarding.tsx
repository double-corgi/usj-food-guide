"use client";

/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createStaffSupabaseClientAsync, readJwtAalClaim, syncVerifiedStaffMfaSession } from "@/lib/staff-auth-client";
import type { Database } from "@/types/database";

type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];
type Step = "checking" | "invalid" | "password" | "mfa" | "complete";

type InviteSessionInfo = {
  email: string;
  displayName: string;
  role: string;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "管理者",
  editor: "編集できる人"
};

export function StaffInviteOnboarding() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null | undefined>(undefined);
  const [step, setStep] = useState<Step>("checking");
  const [info, setInfo] = useState<InviteSessionInfo | null>(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void createStaffSupabaseClientAsync().then((client) => {
      if (!cancelled) setSupabase(client);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function establishInviteSession() {
    if (!supabase) {
      setMessage("初期設定に接続できませんでした。時間を置いてもう一度お試しください。");
      setStep("invalid");
      return;
    }

    setStep("checking");
    setMessage("");

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (code) {
      const exchanged = await supabase.auth.exchangeCodeForSession(code);
      if (exchanged.error) {
        showInviteError(exchanged.error);
        return;
      }
      clearSensitiveUrl();
    } else if (accessToken && refreshToken) {
      const setResult = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (setResult.error) {
        showInviteError(setResult.error);
        return;
      }
      clearSensitiveUrl();
    }

    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;
    if (!session) {
      setMessage("この招待リンクは無効です。管理者に新しいリンクを作ってもらってください。");
      setStep("invalid");
      return;
    }

    const userResult = await supabase.auth.getUser();
    const user = userResult.data.user;
    if (userResult.error || !user?.id) {
      setMessage("この招待リンクは無効です。管理者に新しいリンクを作ってもらってください。");
      setStep("invalid");
      return;
    }

    const staffResult = await supabase
      .from("staff_members")
      .select("user_id,email,display_name,role,is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffResult.error) {
      setMessage("初期設定に接続できませんでした。時間を置いてもう一度お試しください。");
      setStep("invalid");
      return;
    }

    const staff = staffResult.data as Pick<StaffMember, "user_id" | "email" | "display_name" | "role" | "is_active"> | null;
    if (!staff) {
      setMessage("招待されたアカウントと一致しません。");
      setStep("invalid");
      return;
    }
    if (!staff.is_active) {
      setMessage("この招待は現在利用できません。管理者に確認してください。");
      setStep("invalid");
      return;
    }
    if (staff.role !== "editor") {
      setMessage("初期設定は完了しています。ログイン画面からお進みください。");
      setStep("invalid");
      return;
    }

    const userEmail = normalizeEmail(user.email);
    const staffEmail = normalizeEmail(staff.email);
    if (!userEmail || !staffEmail || userEmail !== staffEmail) {
      setMessage("招待されたアカウントと一致しません。");
      setStep("invalid");
      return;
    }

    setInfo({
      email: staff.email ?? user.email ?? "",
      displayName: staff.display_name ?? "",
      role: staff.role
    });

    const factors = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = (factors.data?.totp ?? []).some((factor) => factor.status === "verified");
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session.access_token);
    if (hasVerifiedTotp && assurance.data?.currentLevel === "aal2" && readJwtAalClaim(session.access_token) === "aal2") {
      setStep("complete");
      return;
    }

    setStep("password");
  }

  useEffect(() => {
    if (supabase === undefined) return;
    void establishInviteSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setMessage("");
    if (password.length < 8) {
      setMessage("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setMessage("確認用のパスワードが一致しません。");
      return;
    }

    setBusy(true);
    const updated = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updated.error) {
      setMessage("パスワードを設定できませんでした。もう一度お試しください。");
      return;
    }
    setPassword("");
    setPasswordConfirm("");
    await startTotpEnrollment();
  }

  async function startTotpEnrollment() {
    if (!supabase) return;
    setMessage("");
    setBusy(true);
    const factors = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factors.data?.totp?.find((factor) => factor.status === "verified");
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id);
      setStep("mfa");
      setBusy(false);
      return;
    }

    const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (enrolled.error) {
      setMessage("認証アプリの登録を開始できません。もう一度お試しください。");
      return;
    }
    setFactorId(enrolled.data.id);
    setQrCode(enrolled.data.totp.qr_code);
    setTotpSecret(enrolled.data.totp.secret ?? null);
    setTotpUri(enrolled.data.totp.uri ?? null);
    setStep("mfa");
  }

  async function verifyTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !factorId) return;
    setMessage("");
    setBusy(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setBusy(false);
      setMessage("認証コードの確認を開始できません。もう一度お試しください。");
      return;
    }
    const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: totpCode.trim() });
    if (verified.error) {
      setBusy(false);
      setMessage("認証アプリの6桁コードを確認できませんでした。もう一度入力してください。");
      return;
    }
    const synced = await syncVerifiedStaffMfaSession(supabase, verified.data);
    setBusy(false);
    if (!synced.ok) {
      setMessage("本人確認は完了しましたが、最新の状態を保存できませんでした。もう一度6桁コードを入力してください。");
      return;
    }
    setTotpCode("");
    setQrCode(null);
    setTotpSecret(null);
    setTotpUri(null);
    setStep("complete");
    window.setTimeout(() => router.replace("/staff"), 700);
  }

  function showInviteError(error: unknown) {
    const text = error instanceof Error ? error.message.toLowerCase() : "";
    if (text.includes("expired")) {
      setMessage("この招待リンクの期限が切れています。管理者に新しいリンクを作ってもらってください。");
    } else {
      setMessage("この招待リンクは無効です。管理者に新しいリンクを作ってもらってください。");
    }
    setStep("invalid");
  }

  function clearSensitiveUrl() {
    window.history.replaceState(null, "", "/auth/invite");
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 text-ink" style={{ paddingTop: "calc(env(safe-area-inset-top) + 32px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-xs font-black text-park">ユニコレ</p>
        <h1 className="mt-2 text-2xl font-black text-ink">運営メンバーの初期設定</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">招待された家族だけが使える設定画面です。メール送信は使わず、この画面で設定します。</p>

        {info ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <p>メールアドレス: <span className="break-all text-ink">{info.email}</span></p>
            <p className="mt-1">名前: <span className="text-ink">{info.displayName || "未設定"}</span></p>
            <p className="mt-1">権限: <span className="text-ink">{ROLE_LABEL[info.role] ?? "編集できる人"}</span></p>
          </div>
        ) : null}

        {message ? <p className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-black leading-6 text-sky-950">{message}</p> : null}

        {step === "checking" ? <p className="mt-6 text-sm font-black text-slate-600">招待情報を確認しています。</p> : null}

        {step === "password" ? (
          <form onSubmit={submitPassword} className="mt-6 space-y-4">
            <label className="block text-sm font-black text-ink">
              新しいパスワード
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-base font-bold" autoComplete="new-password" />
            </label>
            <label className="block text-sm font-black text-ink">
              パスワード確認
              <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-base font-bold" autoComplete="new-password" />
            </label>
            <button type="submit" disabled={busy} className="min-h-12 w-full rounded-full bg-park px-5 text-sm font-black text-white disabled:opacity-60">
              {busy ? "設定しています" : "パスワードを設定して次へ"}
            </button>
          </form>
        ) : null}

        {step === "mfa" ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-black text-ink">認証アプリを登録してください</h2>
            <p className="text-sm font-bold leading-6 text-slate-600">認証アプリでQRコードを読み取り、表示された6桁コードを入力してください。</p>
            {qrCode ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3" dangerouslySetInnerHTML={{ __html: qrCode }} /> : null}
            {totpSecret ? (
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-500">手動登録キー</p>
                <code className="mt-1 block break-all text-sm font-black text-ink">{totpSecret}</code>
              </div>
            ) : null}
            {totpUri ? (
              <details className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                <summary className="cursor-pointer font-black text-ink">読み取り用の文字列を表示</summary>
                <code className="mt-2 block break-all">{totpUri}</code>
              </details>
            ) : null}
            <form onSubmit={verifyTotp} className="flex gap-2">
              <input value={totpCode} onChange={(event) => setTotpCode(event.target.value)} inputMode="numeric" placeholder="6桁コード" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-black" />
              <button type="submit" disabled={busy} className="h-12 rounded-full bg-park px-5 text-sm font-black text-white disabled:opacity-60">
                確認
              </button>
            </form>
          </div>
        ) : null}

        {step === "complete" ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-2xl bg-mint p-4 text-sm font-black leading-6 text-park">設定が完了しました。運営管理画面へ移動します。</p>
            <button type="button" onClick={() => router.replace("/staff")} className="min-h-12 w-full rounded-full bg-park px-5 text-sm font-black text-white">運営管理画面へ</button>
          </div>
        ) : null}

        {step === "invalid" ? (
          <div className="mt-6">
            <button type="button" onClick={() => router.replace("/staff")} className="min-h-12 w-full rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink">ログイン画面へ</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}
