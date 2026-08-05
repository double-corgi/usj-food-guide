const sections = [
  {
    title: "利用条件",
    items: [
      "本規約は、ユニバフードコレクション（ユニコレ）の利用条件を定めるものです。",
      "本アプリは非公式のUSJフード図鑑・検索・レビューアプリであり、ユニバーサル・スタジオ・ジャパン公式サービスではありません。"
    ]
  },
  {
    title: "禁止事項",
    items: [
      "虚偽情報、権利侵害のおそれがある画像URL、第三者の個人情報、悪意あるURLの投稿。",
      "自動送信、過度な連続送信、管理画面への不正アクセス、アプリの運営を妨げる行為。",
      "掲載情報を公式情報であるかのように誤認させる利用。"
    ]
  },
  {
    title: "免責と情報の正確性",
    items: [
      "掲載情報は確認時点の内容であり、正確性、完全性、最新性を保証しません。",
      "価格、販売状況、販売場所、販売期間は変更される場合があります。来園前と現地では公式情報を確認してください。",
      "本アプリの利用により生じた損害について、運営者は法令上認められる範囲で責任を負いません。"
    ]
  },
  {
    title: "記録データの保存",
    items: [
      "通常利用者の食べた記録、評価、メモ、金額、最近見た商品、最近の検索は、現在の実装では端末内のlocalStorage等へ保存されます。",
      "端末変更、ブラウザのデータ削除、アプリ削除により、端末内の記録が失われる場合があります。",
      "運営者向けの商品・店舗・エリア管理にはSupabase AuthとSupabaseデータベースを利用しますが、通常利用者の食べた記録を自動でクラウド同期する目的では利用しません。"
    ]
  },
  {
    title: "知的財産",
    items: [
      "USJ、各作品、キャラクター、商品名、画像等の権利は各権利者に帰属します。",
      "本アプリ内の独自編集データ、UI、コード、テキストは運営者または正当な権利者に帰属します。"
    ]
  },
  {
    title: "問い合わせ",
    items: [
      "情報提供、修正依頼、削除依頼、不具合報告、一般的な問い合わせは、情報提供・お問い合わせページから送信してください。",
      "問い合わせへの返信や反映を保証するものではありませんが、必要に応じて内容を確認します。"
    ]
  },
  {
    title: "変更、停止、終了",
    items: [
      "運営者は必要に応じて、本アプリの内容、仕様、規約を変更できます。",
      "システム保守、外部サービス障害、法令対応等により、一部または全部の提供を停止する場合があります。",
      "規約を変更した場合は、アプリ内または関連ページで更新日を示します。"
    ]
  },
  {
    title: "準拠法",
    items: ["本規約は日本法に準拠します。紛争が生じた場合は、法令に従い誠実に協議します。"]
  }
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Terms</p>
      <h1 className="mt-2 text-3xl font-black text-ink">利用規約</h1>
      <p className="mt-4 text-sm font-bold leading-7 text-slate-600">最終更新日: 2026年6月2日</p>
      <div className="mt-6 grid gap-5">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl bg-slate-50 p-4">
            <h2 className="text-lg font-black text-ink">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-bold leading-7 text-slate-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
