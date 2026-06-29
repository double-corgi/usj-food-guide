"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureAppError } from "@/lib/observability";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureAppError(error, {
      boundary: "app-error",
      digest: error.digest ?? null,
      route: window.location.pathname
    });
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl rounded-[1.6rem] border border-rose-100 bg-white p-6 text-center shadow-soft">
      <p className="text-xs font-black tracking-[0.18em] text-rose-500">読み込みエラー</p>
      <h1 className="mt-2 text-2xl font-black text-ink">読み込めませんでした</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
        通信が不安定な可能性があります。少し時間を置いてからもう一度お試しください。
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-6 text-sm font-black text-white">
          再読み込み
        </button>
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700">
          ホームへ戻る
        </Link>
      </div>
    </section>
  );
}
