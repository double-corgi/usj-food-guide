import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { SkeletonCard } from "@/components/skeleton-card";

type PublicStateAction = {
  href: string;
  label: string;
};

export function PublicStateCard({
  eyebrow,
  title,
  description,
  action,
  secondaryAction,
  onRetry
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: PublicStateAction;
  secondaryAction?: PublicStateAction;
  onRetry?: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-[1.6rem] border border-slate-200 bg-white p-6 text-center shadow-soft">
      {eyebrow ? <p className="text-xs font-black tracking-[0.16em] text-park/70">{eyebrow}</p> : null}
      <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{description}</p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        {onRetry ? (
          <button type="button" onClick={onRetry} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-black text-white">
            <RefreshCw size={16} aria-hidden />
            再読み込み
          </button>
        ) : null}
        {action ? (
          <Link href={action.href} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 text-sm font-black text-white">
            {action.label}
          </Link>
        ) : null}
        {secondaryAction ? (
          <Link href={secondaryAction.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
            <ArrowLeft size={16} aria-hidden />
            {secondaryAction.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function FoodGridLoadingState({ title = "フードを読み込んでいます" }: { title?: string }) {
  return (
    <section className="min-w-0 space-y-5 overflow-x-hidden">
      <div>
        <p className="text-xs font-black tracking-[0.16em] text-park/70">LOADING</p>
        <h1 className="mt-2 text-[1.85rem] font-black tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">画像や価格が入る位置を保ったまま表示を準備しています。</p>
      </div>
      <div className="mobile-page-section space-y-3 px-3 py-3 sm:px-4">
        <div className="h-9 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <div className="h-11 animate-pulse rounded-full bg-slate-100" />
          <div className="h-11 animate-pulse rounded-full bg-slate-100 md:w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </section>
  );
}

export function DetailLoadingState({ title = "詳細を読み込んでいます" }: { title?: string }) {
  return (
    <section className="space-y-5 pb-20">
      <div className="h-[300px] animate-pulse rounded-[1.35rem] bg-slate-100 sm:h-[420px]" />
      <div className="mobile-page-section space-y-4 px-4 py-4">
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-9 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-7 w-32 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
      <p className="text-center text-xs font-black text-slate-400">{title}</p>
    </section>
  );
}

