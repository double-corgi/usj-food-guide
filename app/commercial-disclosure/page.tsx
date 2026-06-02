export default function CommercialDisclosurePage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Commercial Disclosure</p>
      <h1 className="mt-2 text-3xl font-black text-ink">商業的表示・収益化方針</h1>
      <div className="mt-6 space-y-4 text-sm font-bold leading-7 text-slate-600">
        <p>本アプリでは、将来的に広告、アフィリエイトリンク、PR掲載、有料機能を導入する可能性があります。</p>
        <p>広告、PR、スポンサー、アフィリエイトを掲載する場合は、ユーザーが広告・PRであることを認識できるよう明確に表示します。</p>
        <p>掲載内容がランキングや攻略スコアに影響する場合は、影響範囲を明記します。広告であることを隠した推薦は行いません。</p>
        <section className="rounded-2xl bg-amber-50 p-4 text-amber-950">
          <h2 className="font-black">公開前TODO</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>事業者名、所在地、連絡先、責任者名を公開前に入力する。</li>
            <li>有料機能を導入する場合は、価格、支払方法、解約方法、返金条件を追記する。</li>
            <li>広告SDKを導入する場合は、プライバシーポリシーとストア申告を更新する。</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
