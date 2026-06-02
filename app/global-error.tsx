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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">System Error</p>
            <h1 className="mt-2 text-2xl font-black text-ink">アプリを表示できませんでした</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              ページを再読み込みしてください。問題が続く場合はお問い合わせから状況を送ってください。
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
