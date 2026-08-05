const sections = [
  {
    title: "通信と管理画面",
    items: [
      "公開環境ではHTTPSでの利用を前提とします。",
      "外部公開時の管理画面はADMIN_ACCESS_KEYで保護します。未設定の本番外部アクセスでは管理画面を閉じます。"
    ]
  },
  {
    title: "入力値検証",
    items: [
      "情報提供・お問い合わせは既存のGoogleフォームへ統合して受け付けます。アプリ内では送信先を一本化し、外部リンクにはnoopener noreferrerを付与します。",
      "外部リンクは新規タブで開く場合にnoopener noreferrerを付与します。"
    ]
  },
  {
    title: "XSSと保存データ",
    items: [
      "ユーザー入力をHTMLとして直接描画しません。",
      "localStorageに保存する値は読み込み時に型確認を行い、不正な形式は破棄します。"
    ]
  },
  {
    title: "レート制限方針",
    items: [
      "情報提供・お問い合わせはGoogleフォーム側の保護設定を利用します。公開後に不正送信が増えた場合は、サーバー側のIPベース制限やWAF導入を検討します。",
      "公開後に不正送信が増えた場合は、サーバー側のIPベース制限やWAF導入を検討します。"
    ]
  },
  {
    title: "個人情報最小化",
    items: [
      "連絡先は任意です。問い合わせ対応や投稿確認に必要な場合のみ利用します。",
      "不要になった投稿・問い合わせ情報は情報提供・お問い合わせページからの削除依頼に応じて確認します。"
    ]
  },
  {
    title: "監視と解析",
    items: [
      "エラー監視とアクセス解析は環境変数を設定した場合のみ有効です。未設定時は外部送信を行いません。",
      "監視・解析はアプリ品質改善を目的とし、商品記録や問い合わせ内容を追跡目的で送信しない方針です。"
    ]
  }
];

export default function SecurityPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Security</p>
      <h1 className="mt-2 text-3xl font-black text-ink">セキュリティ方針</h1>
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
