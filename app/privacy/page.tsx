const sections = [
  {
    title: "アプリの位置づけ",
    items: [
      "このアプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。",
      "公開情報をもとにした、非公式ファン向けのUSJフード攻略・記録アプリです。",
      "価格、販売場所、販売期間、在庫、メニュー内容は変更される可能性があります。来園前と現地では公式サイト、公式アプリ、現地表示を確認してください。"
    ]
  },
  {
    title: "収集する情報",
    items: [
      "食べた記録、評価、メモ、食べた日、次回食べたい商品など、ユーザーが端末内で保存する情報。",
      "発見報告または問い合わせで入力された商品名、価格、販売場所、画像URL、公式URL、メモ、任意の送信者名、任意の連絡先。",
      "管理者がデータ品質確認のために保存する確認状態、対応状態、確認日時。"
    ]
  },
  {
    title: "収集しない情報",
    items: [
      "位置情報、連絡先、写真ライブラリ、カメラ、マイク、決済情報は、現時点ではアプリから取得しません。",
      "広告IDや第三者広告SDKによるトラッキングは、現時点では導入していません。"
    ]
  },
  {
    title: "localStorageに保存する情報",
    items: [
      "食べた記録、最近見た商品、検索履歴、PWA案内の閉じた状態などをブラウザのlocalStorageに保存します。",
      "localStorageの情報は同じブラウザ内でのみ利用され、ユーザーがブラウザ設定から削除できます。"
    ]
  },
  {
    title: "発見報告・問い合わせで送信される情報",
    items: [
      "入力された商品情報、画像URL、公式URL、メモ、任意の連絡先が管理者確認用に保存されます。",
      "投稿内容は即時公開されず、管理者確認後に必要な範囲で反映します。",
      "第三者の個人情報、権利侵害のおそれがあるURL、公開されていない情報は送信しないでください。"
    ]
  },
  {
    title: "Cookie、アクセス解析、広告",
    items: [
      "管理画面保護のため、管理者用アクセスキーをCookieで扱う場合があります。",
      "アクセス解析は、NEXT_PUBLIC_ANALYTICS_ENDPOINTを設定した場合のみページ表示イベントなど最小限の利用状況を送信します。未設定時は外部送信しません。",
      "エラー監視は、NEXT_PUBLIC_SENTRY_DSNを設定した場合のみエラー内容、発生ページ、発生時刻などを送信します。氏名や連絡先の送信を目的としません。",
      "広告を導入する場合は、広告配信事業者、取得情報、パーソナライズの有無を本ページに追記します。"
    ]
  },
  {
    title: "第三者提供と削除依頼",
    items: [
      "法令に基づく場合を除き、問い合わせ・発見報告の連絡先を第三者へ提供しません。",
      "投稿情報や問い合わせ情報の削除を希望する場合は、お問い合わせページから対象内容を記載して連絡してください。"
    ]
  }
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Privacy</p>
      <h1 className="mt-2 text-3xl font-black text-ink">プライバシーポリシー</h1>
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
