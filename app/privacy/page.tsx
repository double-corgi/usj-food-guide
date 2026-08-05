import { AdMobPrivacyOptionsButton } from "@/components/admob-privacy-options-button";

const sections = [
  {
    title: "アプリの位置づけ",
    items: [
      "このアプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。",
      "公開情報をもとにした、非公式ファン向けのUSJフード図鑑・検索・レビューアプリです。",
      "価格、販売場所、販売期間、在庫、メニュー内容は変更される可能性があります。来園前と現地では公式サイト、公式アプリ、現地表示を確認してください。"
    ]
  },
  {
    title: "収集する情報",
    items: [
      "通常利用では個人情報を収集しません。",
      "このアプリはログイン不要で利用できます。食べた記録、評価、メモ、食べた日、レビュー、星評価、総消費金額用の支払金額は端末内に保存され、アプリ運営者へ自動送信されません。",
      "iOSアプリで記録に追加した写真は端末内に保存され、運営者、Supabase、Vercelへ送信されません。",
      "情報提供・お問い合わせでGoogleフォームに入力された商品名、価格、販売場所、画像URL、公式URL、メモ、任意の送信者名、任意の連絡先。",
      "管理者がデータ品質確認のために保存する確認状態、対応状態、確認日時。"
    ]
  },
  {
    title: "収集しない情報",
    items: [
      "Googleログイン、Appleログイン、メール登録、Supabase認証などのログイン機能は使用しません。",
      "食べた記録、レビュー、星評価をクラウド同期する機能は使用しません。",
      "位置情報、連絡先、カメラ、マイク、決済情報は、現時点ではアプリから取得しません。写真ライブラリは、利用者が記録に写真を追加するときだけ選択画面を開きます。"
    ]
  },
  {
    title: "localStorageに保存する情報",
    items: [
      "食べた記録、レビュー、星評価、総消費金額用の支払金額、最近見た商品、検索履歴、PWA案内の閉じた状態などを端末内に保存します。",
      "iOSアプリでは記録写真をアプリのデータ領域に保存し、共有操作を選ぶまで外部へ渡しません。",
      "localStorageの情報は同じ端末・同じブラウザ内でのみ利用されます。別端末で使う場合は、設定画面のバックアップ出力JSONと復元機能を利用できます。",
      "localStorageの情報は、アプリ内の全データ削除機能またはブラウザ設定から削除できます。"
    ]
  },
  {
    title: "情報提供・お問い合わせで送信される情報",
    items: [
      "情報提供・お問い合わせはGoogleフォームを利用します。入力された商品情報、画像URL、公式URL、メモ、任意の連絡先はGoogleフォーム上で管理者確認用に保存されます。",
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
      "iOSアプリではGoogle AdMobを利用して広告を表示します。Web/PWA版および管理画面では、現在の実装ではAdMob広告を表示しません。",
      "広告の配信、不正防止、品質改善などのため、Googleが端末情報、広告の表示・操作情報、利用状況、診断情報などを処理する場合があります。",
      "広告識別子などの取扱いは、Googleの最新のプライバシーポリシーおよびGoogle Mobile Ads SDKの仕様に従います。",
      "現在のアプリは非パーソナライズ広告を基本方針としています。将来パーソナライズ広告やアプリ・サイトをまたいだ追跡を導入する場合は、必要な同意取得と本ポリシーの更新を行います。"
    ]
  },
  {
    title: "利用している外部サービス",
    items: [
      "Google AdMob: iOSアプリ内の広告表示に利用します。広告配信や不正防止などのため、Googleが広告関連情報を処理する場合があります。",
      "Supabase: 管理者向けの認証、管理画面で追加・修正したフード情報、情報提供・お問い合わせ内容の管理に利用します。通常利用者の食べた記録を自動でクラウド保存する目的では利用していません。",
      "Vercel: Web/PWA版の配信、アプリ内Webコンテンツの配信、ページ表示に必要なサーバー処理に利用します。",
      "Sentryは、NEXT_PUBLIC_SENTRY_DSNを設定した場合のみエラー監視に利用します。未設定の場合はSentryへ送信しません。"
    ]
  },
  {
    title: "利用者の選択肢",
    items: [
      "端末やGoogleの広告設定により、広告に関する設定を変更できる場合があります。",
      "アプリ内に保存された食べた記録、評価、メモ、金額などは、アプリ内の全データ削除機能、ブラウザ設定、またはアプリ削除により消える場合があります。",
      "情報提供・お問い合わせ内容やデータの取扱いについて確認・削除を希望する場合は、情報提供・お問い合わせページから連絡してください。"
    ]
  },
  {
    title: "第三者提供と削除依頼",
    items: [
      "法令に基づく場合を除き、情報提供・お問い合わせの連絡先を第三者へ提供しません。",
      "投稿情報や問い合わせ情報の削除を希望する場合は、情報提供・お問い合わせページから対象内容を記載して連絡してください。"
    ]
  }
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Privacy</p>
      <h1 className="mt-2 text-3xl font-black text-ink">プライバシーポリシー</h1>
      <p className="mt-4 text-sm font-bold leading-7 text-slate-600">最終更新日: 2026年6月29日</p>
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
      <AdMobPrivacyOptionsButton />
    </article>
  );
}
