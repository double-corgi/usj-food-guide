import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Forbidden</p>
      <h1 className="mt-2 text-3xl font-black text-ink">管理者権限がありません</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-rose-950">
        ログイン済みでも、admin_users に登録されていないメールアドレス、または必要なロールを持たないユーザーは管理画面を利用できません。
      </p>
      <Link href="/admin/login" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white">
        ログインへ戻る
      </Link>
    </div>
  );
}
