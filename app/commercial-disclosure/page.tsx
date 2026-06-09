export default function CommercialDisclosurePage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Commercial Disclosure</p>
      <h1 className="mt-2 text-3xl font-black text-ink">商業的表示・収益化方針</h1>
      <div className="mt-6 space-y-4 text-sm font-bold leading-7 text-slate-600">
        <p>現在、本アプリ内に広告表示、広告SDK、アフィリエイトリンク、PR掲載、有料機能は導入していません。</p>
        <p>将来それらを導入する場合は、広告・PRであること、掲載内容への影響、取得される情報を事前に明記します。</p>
        <p>広告であることを隠した推薦や、収益目的で通常の図鑑表示と区別できない掲載は行いません。</p>
        <section className="rounded-2xl bg-slate-50 p-4 text-slate-700">
          <h2 className="font-black text-ink">公開時に確認する項目</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>事業者情報が必要になる運用を開始する場合は、表示内容を更新します。</li>
            <li>有料機能を導入する場合は、価格、支払方法、解約方法、返金条件を追記します。</li>
            <li>広告SDKを導入する場合は、プライバシーポリシーとストア申告を更新します。</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
