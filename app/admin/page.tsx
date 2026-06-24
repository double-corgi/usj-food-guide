import Link from "next/link";
import type { ReactNode } from "react";
import { Eye, ListChecks, Plus, ShieldCheck, SquareArrowOutUpRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllFoodCandidates } from "@/lib/repositories/foods";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [admin, foods] = await Promise.all([requireAdmin("viewer"), listAllFoodCandidates()]);
  const canEdit = admin.role === "owner" || admin.role === "editor";
  const manualCount = foods.filter((food) => food.manualOverride || food.sourceNames?.includes("manual_foods") || food.id.startsWith("food-manual-")).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-black text-park">
              <ShieldCheck size={14} aria-hidden />
              管理者メニュー
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">ユニコレ管理画面</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-600">
              商品追加、画像登録、編集、非表示運用はここから始めます。公開ページに戻る場合は「公開ページを見る」を使ってください。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            <p className="text-xs font-black text-slate-400">ログイン中</p>
            <p className="mt-1 break-all text-ink">{admin.email ?? "ADMIN_ACCESS_TOKEN fallback"}</p>
            <p className="mt-1 text-park">role: {admin.role}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminActionCard
          href="/admin/foods"
          icon={<ListChecks size={24} aria-hidden />}
          title="商品一覧へ"
          description={`全${foods.length}件、手動追加${manualCount}件を確認します。`}
          primary
        />
        {canEdit ? (
          <AdminActionCard
            href="/admin/foods/new"
            icon={<Plus size={24} aria-hidden />}
            title="商品を追加"
            description="新しい商品、価格、画像、カテゴリを登録します。"
            primary
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-500">
            <p className="text-lg font-black text-ink">商品を追加</p>
            <p className="mt-2">viewer は追加できません。商品を見るだけの権限です。</p>
          </div>
        )}
        <AdminActionCard
          href="/"
          icon={<SquareArrowOutUpRight size={24} aria-hidden />}
          title="公開ページを見る"
          description="一般ユーザーに見えるトップページを確認します。"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint text-park">
            <Eye size={20} aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-black text-ink">管理中の見え方</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
              管理者としてログイン中は、公開ページの下部に小さな管理バーが表示されます。通常ユーザーには表示されません。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-black text-ink">管理ツール</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <AdminSmallLink href="/admin/images" label="画像候補" />
          <AdminSmallLink href="/admin/prices" label="価格確認" />
          <AdminSmallLink href="/admin/data-quality" label="品質監査" />
          <AdminSmallLink href="/admin/reviews" label="レビュー管理" />
          <AdminSmallLink href="/admin/dashboard" label="ダッシュボード" />
        </div>
      </section>
    </div>
  );
}

function AdminActionCard({
  href,
  icon,
  title,
  description,
  primary = false
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-5 shadow-soft transition active:scale-[0.99] sm:min-h-44 ${
        primary ? "border-park/20 bg-mint text-park hover:border-park" : "border-slate-200 bg-white text-ink hover:border-park/40"
      }`}
    >
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${primary ? "bg-white text-park" : "bg-mint text-park"}`}>{icon}</span>
      <p className="mt-4 text-xl font-black">{title}</p>
      <p className={`mt-2 text-sm font-bold leading-6 ${primary ? "text-park/80" : "text-slate-600"}`}>{description}</p>
    </Link>
  );
}

function AdminSmallLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park hover:text-park">
      {label}
    </Link>
  );
}
