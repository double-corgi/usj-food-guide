"use client";

import { useEffect } from "react";
import { captureAppError } from "@/lib/observability";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureAppError(error, {
      boundary: "global-error",
      digest: error.digest ?? null,
      route: typeof window !== "undefined" ? window.location.pathname : "unknown"
    });
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
          <section className="max-w-xl rounded-[1.6rem] border border-rose-100 bg-white p-6 text-center shadow-soft">
            <p className="text-xs font-black tracking-[0.18em] text-rose-500">読み込みエラー</p>
            <h1 className="mt-2 text-2xl font-black text-ink">読み込めませんでした</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              通信が不安定な可能性があります。ページを再読み込みしてください。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-6 text-sm font-black text-white"
            >
              再読み込み
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
