export default function AboutPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">About</p>
      <h1 className="mt-2 text-3xl font-black text-ink">このアプリについて</h1>
      <div className="mt-6 space-y-4 text-sm font-bold leading-7 text-slate-600">
        <p>ユニバフード制覇は、USJで「今日何を食べるか」を決め、食べた記録を残し、フード制覇を楽しむための非公式ファン向けアプリです。</p>
        <p>公式情報、公開メニュー、信頼できる補助情報をもとに、商品画像、価格、販売場所、エリア、攻略スコアを整理しています。</p>
        <p>このアプリは公式アプリではありません。掲載内容は来園前の計画と記録の補助として利用し、最終確認は公式サイト・公式アプリ・現地表示を優先してください。</p>
      </div>
    </article>
  );
}
