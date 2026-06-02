export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Disclaimer</p>
      <h1 className="mt-2 text-3xl font-black text-ink">免責事項</h1>
      <div className="mt-6 grid gap-4 text-sm font-bold leading-7 text-slate-600">
        <section className="rounded-2xl bg-slate-50 p-4">
          <h2 className="text-lg font-black text-ink">掲載情報について</h2>
          <p className="mt-2">価格、販売場所、販売期間、在庫、メニュー内容、画像、エリア情報は変更される可能性があります。情報は確認時点のものであり、最新性を保証しません。</p>
        </section>
        <section className="rounded-2xl bg-slate-50 p-4">
          <h2 className="text-lg font-black text-ink">公式確認のお願い</h2>
          <p className="mt-2">来園前と現地では、必ずUSJ公式サイト、公式アプリ、現地メニュー表示、店舗スタッフの案内を確認してください。</p>
        </section>
        <section className="rounded-2xl bg-slate-50 p-4">
          <h2 className="text-lg font-black text-ink">非公式アプリです</h2>
          <p className="mt-2">本アプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。各商標、作品、キャラクター、商品画像等の権利は各権利者に帰属します。</p>
        </section>
      </div>
    </article>
  );
}
