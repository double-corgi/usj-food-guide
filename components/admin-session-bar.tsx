"use client";

import Link from "next/link";
import { ExternalLink, PencilLine, Plus, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/admin-auth";

export function AdminSessionBar({
  role,
  email
}: {
  role: AdminRole;
  email: string;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const canEdit = role === "owner" || role === "editor";
  const currentFoodId = getCurrentFoodId(pathname);
  const canOpenFoodEditPreview = canEdit && Boolean(currentFoodId);

  return (
    <aside className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+8.2rem)] z-[60] rounded-2xl border border-park/20 bg-white/95 p-2 shadow-[0_10px_32px_rgba(0,0,0,0.18)] backdrop-blur md:bottom-5 md:left-auto md:right-5 md:w-auto md:min-w-[360px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-mint px-3 text-[11px] font-black text-park">
          <ShieldCheck size={14} aria-hidden />
          管理中
        </span>
        <Link href="/admin" className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full bg-ink px-3 text-xs font-black text-white md:flex-none">
          管理画面へ
        </Link>
        {canEdit ? (
          <Link href="/admin/foods/new" className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-full bg-park px-3 text-xs font-black text-white md:flex-none">
            <Plus size={14} aria-hidden />
            商品を追加
          </Link>
        ) : null}
        {canOpenFoodEditPreview ? (
          <Link href={`/admin/foods/${currentFoodId}/edit`} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-full border border-park/30 bg-mint px-3 text-xs font-black text-park md:flex-none">
            <PencilLine size={14} aria-hidden />
            {currentFoodId?.startsWith("food-manual-") ? "この商品を編集" : "この商品を確認"}
          </Link>
        ) : null}
        <Link href="/foods" className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-ink md:flex-none">
          <ExternalLink size={14} aria-hidden />
          公開ページを見る
        </Link>
      </div>
      <p className="mt-1 truncate px-2 text-[10px] font-bold text-slate-500">
        {role} / {email}
      </p>
    </aside>
  );
}

function getCurrentFoodId(pathname: string) {
  const match = pathname.match(/^\/foods\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
