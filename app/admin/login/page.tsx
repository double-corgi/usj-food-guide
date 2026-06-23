import Link from "next/link";
import { hasSupabaseAdminEnv } from "@/lib/admin-auth";
import { sendAdminMagicLink } from "./actions";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = sanitizeNextPath(params.next ?? "/admin/foods");
  const supabaseConfigured = hasSupabaseAdminEnv();

  return (
    <div className="mx-auto max-w-xl space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Admin login</p>
        <h1 className="mt-2 text-3xl font-black text-ink">管理者ログイン</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
          登録済みの管理者メールアドレスへログインリンクを送信します。商品追加・編集・画像アップロードはこの Phase では提供しません。
        </p>
      </div>

      {!supabaseConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          Supabase Auth は未設定です。現在は既存の ADMIN_ACCESS_TOKEN 方式で /admin を保護しています。
        </div>
      ) : (
        <form action={sendAdminMagicLink} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="text-sm font-black text-ink">メールアドレス</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-ink outline-none ring-park/20 focus:border-park focus:ring-4"
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
            ログインリンクを送信
          </button>
        </form>
      )}

      {params.sent ? <p className="rounded-lg bg-mint p-4 text-sm font-black text-park">ログインリンクを送信しました。メールを確認してください。</p> : null}
      {params.error ? <p className="rounded-lg bg-rose-50 p-4 text-sm font-black text-rose-700">{params.error}</p> : null}

      <div className="border-t border-slate-100 pt-4">
        <Link href="/" className="text-sm font-black text-park underline underline-offset-4">
          公開ページへ戻る
        </Link>
      </div>
    </div>
  );
}

function sanitizeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("/admin/login") ? value : "/admin/foods";
}
