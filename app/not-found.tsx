import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl rounded-[1.6rem] border border-white/80 bg-white p-6 text-center shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">404</p>
      <h1 className="mt-2 text-2xl font-black text-ink">ページが見つかりません</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
        URLが変わったか、公開前の管理ページの可能性があります。
      </p>
      <Link href="/" className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-ink px-6 text-sm font-black text-white">
        ホームへ戻る
      </Link>
    </section>
  );
}
