import Link from "next/link";
import { disableAdminOperator, inviteAdminOperator, updateAdminOperatorRole } from "./actions";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type AdminUserRow = Database["public"]["Tables"]["admin_users"]["Row"];

type OperatorsPageProps = {
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminOperatorsPage({ searchParams }: OperatorsPageProps) {
  const [admin, params] = await Promise.all([requireAdmin("owner"), searchParams ?? Promise.resolve({} as { saved?: string; error?: string })]);
  const supabase = createServiceSupabaseClient();
  const operators = supabase ? await listOperators(supabase) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">運営者管理</p>
          <h1 className="mt-1 text-3xl font-black text-ink">家族・運営者の管理</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
            登録済みのメールアドレスだけが管理画面へ入れます。パスワードは保存せず、既存のログインリンク方式を使います。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">管理トップ</Link>
          <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">商品管理</Link>
        </div>
      </div>

      {params.saved ? <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900">保存しました。</p> : null}
      {params.error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">操作できませんでした: {params.error}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-lg font-black text-ink">運営者を追加</h2>
        <form action={inviteAdminOperator} className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_auto] lg:items-end">
          <label className="block">
            <span className="text-xs font-black text-slate-500">メールアドレス</span>
            <input required name="email" type="email" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink" placeholder="family@example.com" />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-500">権限</span>
            <select name="role" defaultValue="editor" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink">
              <option value="editor">運営者</option>
              <option value="viewer">見るだけ</option>
              <option value="owner">管理者</option>
            </select>
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white">追加する</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-lg font-black text-ink">登録済み運営者</h2>
        <div className="mt-4 space-y-3">
          {operators.map((operator) => (
            <article key={operator.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="break-all text-sm font-black text-ink">{operator.email}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">表示名: 未設定 / 最終ログイン: Supabase Authで確認</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">有効: はい / 現在の権限: {formatRole(operator.role)}</p>
                </div>
                <form action={updateAdminOperatorRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={operator.id} />
                  <select name="role" defaultValue={operator.role} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-ink">
                    <option value="owner">管理者</option>
                    <option value="editor">運営者</option>
                    <option value="viewer">見るだけ</option>
                  </select>
                  <button type="submit" className="h-10 rounded-full bg-ink px-4 text-xs font-black text-white">変更</button>
                </form>
                <form action={disableAdminOperator}>
                  <input type="hidden" name="userId" value={operator.id} />
                  <button type="submit" disabled={operator.id === admin.userId} className="h-10 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                    無効化
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

async function listOperators(supabase: NonNullable<ReturnType<typeof createServiceSupabaseClient>>) {
  const { data, error } = await supabase.from("admin_users").select("*").order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as AdminUserRow[];
}

function formatRole(role: string) {
  if (role === "owner") return "管理者";
  if (role === "editor") return "運営者";
  if (role === "viewer") return "見るだけ";
  return role;
}
