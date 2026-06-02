"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export function AuthPanel() {
  const supabase = createBrowserSupabaseClient();
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        Supabase未設定のため匿名モードです。閲覧と端末内チェックのみ利用できます。
      </div>
    );
  }

  if (userEmail) {
    return (
      <div className="rounded-lg border border-park/20 bg-mint p-4">
        <p className="text-sm font-bold text-park">ログイン中: {userEmail}</p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-ink"
        >
          <LogOut size={17} aria-hidden />
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        setMessage(error ? error.message : "確認メールを送信しました。");
        setLoading(false);
      }}
    >
      <label className="grid gap-2 text-sm font-bold text-slate-600">
        ログインすると食べた記録をSupabaseに保存できます
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-lg border border-slate-200 px-3 text-base"
          placeholder="you@example.com"
        />
      </label>
      <button type="submit" disabled={loading} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-black text-white disabled:opacity-60">
        <LogIn size={18} aria-hidden />
        {loading ? "送信中" : "メールでログイン"}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-park">{message}</p> : null}
    </form>
  );
}
