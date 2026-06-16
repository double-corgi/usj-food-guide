# codex-goal-bottom-nav-and-language-switcher-v1

## 目的

Phase A: 下部ナビの現在地表示（アクティブ状態）追加・暗転改善、およびヘッダー・モバイル上部への言語切替UI追加。

---

## 事前確認

```bash
git status
```

- 未コミット変更がある場合:

```bash
git add .
git commit -m "backup-before-bottom-nav-language-switcher"
git push
```

- 未コミット変更がない場合:

```bash
git commit --allow-empty -m "backup-before-bottom-nav-language-switcher"
git push
```

---

## 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `components/app-header.tsx` | 下部ナビのアクティブ状態追加・背景改善・デスクトップ言語切替追加 |
| `app/layout.tsx` | モバイル用言語バッジの挿入 |
| `components/mobile-language-badge.tsx` | モバイル上部の言語バッジ新規作成 |

**変更しないファイル（絶対に触るな）:**

- `components/language-switcher.tsx` — `/settings` 既存UIを壊さない
- `lib/i18n/use-locale.tsx` — `document.documentElement.lang` 更新は実装済み。変更不要
- `lib/i18n/locales.ts` — 変更不要
- `lib/i18n/dictionaries.ts` — 変更不要
- `lib/store-utils.ts` — 変更不要
- `scripts/output/foods.generated.json` — 変更不要
- `app/page.tsx`（ホームv1.2）— 変更不要
- `app/areas/[id]/page.tsx`（area-detail-v1.1）— 変更不要
- 上記3ファイル以外は変更不要

---

## 実装 1: `components/app-header.tsx`

### 現在のコード（全体）

```tsx
"use client";

import Link from "next/link";
import { CheckCircle2, Globe2, House, Search, Store } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";

const navItems = [
  { href: "/", labelKey: "nav.home", icon: House },
  { href: "/foods", labelKey: "nav.search", icon: Search },
  { href: "/eaten", labelKey: "nav.eaten", icon: CheckCircle2 },
  { href: "/areas", labelKey: "nav.areas", icon: Globe2 },
  { href: "/stores", labelKey: "nav.stores", icon: Store }
] as const;

export function AppHeader() {
  const { t } = useLocale();

  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-slate-200/60 bg-white/78 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end px-6 py-2.5 lg:px-8">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-mint hover:text-park"
              >
                <item.icon size={17} aria-hidden />
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 grid grid-cols-5 rounded-[1.55rem] border border-white/80 bg-white/86 p-1 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur-2xl md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-[10.5px] font-black text-slate-600 transition hover:bg-white/70 active:scale-95 active:bg-mint">
            <item.icon size={19} aria-hidden />
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </>
  );
}
```

### 変更後のコード（完全置換）

```tsx
"use client";

import Link from "next/link";
import { CheckCircle2, Globe2, House, Search, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { localeLabels, supportedLocales } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/use-locale";

const navItems = [
  { href: "/", labelKey: "nav.home", icon: House },
  { href: "/foods", labelKey: "nav.search", icon: Search },
  { href: "/eaten", labelKey: "nav.eaten", icon: CheckCircle2 },
  { href: "/areas", labelKey: "nav.areas", icon: Globe2 },
  { href: "/stores", labelKey: "nav.stores", icon: Store }
] as const;

/** ロケールの短縮ラベル（ヘッダー表示用） */
const localeShortLabels: Record<string, string> = {
  ja: "JP",
  en: "EN",
  ko: "KO",
  "zh-TW": "TW"
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppHeader() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();

  return (
    <>
      {/* デスクトップヘッダー（md以上） */}
      <header className="sticky top-0 z-30 hidden border-b border-slate-200/60 bg-white/78 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-6 py-2.5 lg:px-8">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-mint hover:text-park"
              >
                <item.icon size={17} aria-hidden />
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          {/* デスクトップ言語切替 */}
          <div className="relative">
            <select
              value={locale}
              onChange={(e) => {
                const next = e.target.value;
                if (supportedLocales.includes(next as never)) {
                  setLocale(next as (typeof supportedLocales)[number]);
                }
              }}
              className="cursor-pointer appearance-none rounded-full border border-slate-200 bg-white px-3 py-1.5 pr-7 text-xs font-black text-slate-600 transition hover:border-park hover:text-park focus:outline-none focus:ring-2 focus:ring-park/30"
              aria-label="Language"
            >
              {supportedLocales.map((loc) => (
                <option key={loc} value={loc}>
                  {localeShortLabels[loc]} — {localeLabels[loc]}
                </option>
              ))}
            </select>
            {/* 擬似ドロップダウン矢印 */}
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" aria-hidden>
              ▼
            </span>
          </div>
        </div>
      </header>

      {/* モバイル下部ナビ（md未満） */}
      <nav
        aria-label={t("nav.home")}
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 grid grid-cols-5 rounded-[1.55rem] border border-slate-200/60 bg-white/94 p-1 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur-2xl md:hidden"
      >
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-[10.5px] font-black transition active:scale-95 ${
                active
                  ? "bg-mint text-park"
                  : "text-slate-500 hover:bg-white/70 active:bg-mint"
              }`}
            >
              <item.icon size={19} aria-hidden />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
```

### 変更点の説明

1. `usePathname` を import し `pathname` を取得
2. `isNavActive(pathname, href)` 関数で現在地判定（`/` は完全一致、他は prefix 判定）
3. アクティブ項目: `bg-mint text-park`、`aria-current="page"` を付与
4. 非アクティブ項目: `text-slate-500`（以前の `text-slate-600` より少し明るく）
5. 下部ナビ背景: `bg-white/86` → `bg-white/94`
6. 下部ナビボーダー: `border-white/80` → `border-slate-200/60`
7. デスクトップヘッダーに `<select>` 形式の言語切替を追加（`localeShortLabels` で `JP`/`EN`/`KO`/`TW` 表示）
8. `localeShortLabels`、`localeLabels` を import して使用

---

## 実装 2: `app/layout.tsx`

モバイル（md未満）画面上部右端に言語バッジを追加する。

### 現在の `<main>` 部分

```tsx
<main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-8 md:pt-8 lg:px-8">{children}</main>
```

### 変更後

`<main>` の内部に `MobileLanguageBadge` を追加する。  
`MobileLanguageBadge` は `"use client"` コンポーネントとして `app/layout.tsx` 内に定義するか、`components/mobile-language-badge.tsx` として分離する。

**分離ファイル `components/mobile-language-badge.tsx` を新規作成:**

```tsx
"use client";

import { Globe2 } from "lucide-react";
import { supportedLocales } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/use-locale";

const localeShortLabels: Record<string, string> = {
  ja: "JP",
  en: "EN",
  ko: "KO",
  "zh-TW": "TW"
};

export function MobileLanguageBadge() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="mb-2 flex justify-end md:hidden">
      <div className="relative inline-flex">
        <select
          value={locale}
          onChange={(e) => {
            const next = e.target.value;
            if (supportedLocales.includes(next as never)) {
              setLocale(next as (typeof supportedLocales)[number]);
            }
          }}
          className="cursor-pointer appearance-none rounded-full border border-slate-200 bg-white/90 py-1 pl-6 pr-5 text-xs font-black text-slate-500 transition hover:border-park hover:text-park focus:outline-none focus:ring-2 focus:ring-park/30"
          aria-label="Language"
        >
          {supportedLocales.map((loc) => (
            <option key={loc} value={loc}>
              {localeShortLabels[loc]}
            </option>
          ))}
        </select>
        {/* Globe icon - pointer-events-none で select の上に重ねる */}
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
          <Globe2 size={13} />
        </span>
        {/* ドロップダウン矢印 */}
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400" aria-hidden>
          ▼
        </span>
      </div>
    </div>
  );
}
```

**`app/layout.tsx` の `<main>` を以下に変更:**

```tsx
import { MobileLanguageBadge } from "@/components/mobile-language-badge";

// ...

<main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-8 md:pt-8 lg:px-8">
  <MobileLanguageBadge />
  {children}
</main>
```

### MobileLanguageBadge の表示仕様

- `md:hidden` でモバイル（md未満）のみ表示
- `mb-2` でコンテンツとのスペースを確保
- `justify-end` で右端配置
- Globe2 アイコン（13px）+ select で `🌐 JP` 相当の見た目
- `appearance-none` で OS 標準の `<select>` 見た目を無効化し、カスタムスタイルを適用
- `bg-white/90` で少し半透明（ページ背景に馴染む）
- ホームv1.2 の `home-collection-hero` セクションは `.home-collection-hero` クラスを使う `<section>` であり、`MobileLanguageBadge` は `main` 直下なので干渉しない

---

## 実装確認（Codex が自分でチェックする項目）

### コードチェック

- [ ] `isNavActive("/", "/")` が `true` を返す
- [ ] `isNavActive("/foods", "/")` が `false` を返す
- [ ] `isNavActive("/areas/area-1", "/areas")` が `true` を返す
- [ ] `isNavActive("/stores/shop-1tt48e8", "/stores")` が `true` を返す
- [ ] アクティブ項目に `aria-current="page"` が付与されている
- [ ] 下部ナビの `aria-label` が付与されている
- [ ] `MobileLanguageBadge` に `md:hidden` がある（デスクトップで非表示）
- [ ] デスクトップ言語切替の `<select>` に `aria-label="Language"` がある
- [ ] `document.documentElement.lang` の更新は `use-locale.tsx` で実装済み（追加実装不要）
- [ ] `/settings` の `LanguageSwitcher` コンポーネントは変更していない

### lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

全てエラー 0 であることを確認する。

### スクリーンショット撮影

以下のページ × 幅（390・430・768・1280・1920px）でスクリーンショットを撮影する。

| ページ | 確認項目 |
|---|---|
| `/` | 「ホーム」がアクティブ（bg-mint + text-park） |
| `/foods` | 「探す」がアクティブ |
| `/eaten` | 「食べた」がアクティブ |
| `/areas` | 「エリア」がアクティブ |
| `/stores` | 「店舗」がアクティブ |
| `/settings` | 既存の言語切替カードが正常に動作する |

スクリーンショットファイル名:
```
screenshots/bottom-nav-language-switcher-v1-<page>-<width>.png
```

例:
```
screenshots/bottom-nav-language-switcher-v1-home-390.png
screenshots/bottom-nav-language-switcher-v1-home-1280.png
screenshots/bottom-nav-language-switcher-v1-foods-390.png
screenshots/bottom-nav-language-switcher-v1-settings-390.png
```

---

## 検証チェックリスト

以下をすべて確認してから完了報告すること。

### 下部ナビ・アクティブ状態

- [ ] `/` で「ホーム」がアクティブ（他4項目は非アクティブ）
- [ ] `/foods` で「探す」がアクティブ
- [ ] `/eaten` で「食べた」がアクティブ
- [ ] `/areas` で「エリア」がアクティブ
- [ ] `/stores` で「店舗」がアクティブ
- [ ] `/areas/area-xxx` 等サブページでも「エリア」がアクティブ
- [ ] `/stores/shop-xxx` 等サブページでも「店舗」がアクティブ
- [ ] 非アクティブ項目が暗すぎない（bg-mint 背景なし・text-slate-500 程度）
- [ ] 390px・430px で下部ナビが見やすい
- [ ] ホームのネイビー背景でスクロール中、ナビが白く明瞭に見える
- [ ] safe-area-inset-bottom 対応が維持されている（iOS PWA で底が切れない）

### 言語切替UI

- [ ] デスクトップ（1280px）ヘッダー右端に `JP — 日本語 ▼` 形式のセレクトが表示される
- [ ] EN に切り替えるとUI文言が英語になる
- [ ] KO に切り替えるとUI文言が韓国語になる
- [ ] TW に切り替えるとUI文言が繁体字になる
- [ ] リロード後も選択言語が維持される（localStorage に保存されている）
- [ ] `document.documentElement.lang` が選択言語に更新されている
- [ ] モバイル（390px）で `🌐 JP` バッジが右上に表示される
- [ ] バッジがページコンテンツと重なっていない（`mb-2` でスペース確保）
- [ ] モバイルでの言語切替が動作する
- [ ] `/settings` の言語切替カードが正常に動作する（壊れていない）

### 既存機能の破壊チェック

- [ ] ホームv1.2（`/`）が正常表示される
- [ ] area-detail-v1.1（`/areas/[id]`）が正常表示される
- [ ] `/foods`・`/eaten`・`/areas`・`/stores` が正常表示される
- [ ] 横スクロールが発生していない（全幅で overflow-x: hidden）
- [ ] クリッピング（要素が切れる）が発生していない

### ビルド

- [ ] `npm run lint` エラー 0
- [ ] `npm run typecheck` エラー 0
- [ ] `npm run build` 成功

---

## 完了後の git コマンド

```bash
git add .
git commit -m "implement-bottom-nav-language-switcher"
git push
```

---

## 完了報告に含めること

1. 実装した HEAD commit hash
2. 変更したファイル一覧
3. `npm run lint` / `npm run typecheck` / `npm run build` の結果（エラー件数）
4. スクリーンショット: 最低限 `home-390.png`・`home-1280.png`・`stores-390.png`・`settings-390.png` の4枚
5. 言語切替の動作確認結果（JP→EN 切替後の `/` スクリーンショット）
6. 下部ナビのアクティブ状態確認（各ページでどの項目がアクティブか）

---

## 禁止事項（再掲）

- 商品名・店舗名・エリア名・カテゴリ名の翻訳追加
- 価格・日付の表示変更
- `generated JSON` の編集
- DB・crawler の変更
- `lib/store-utils.ts` の変更
- `components/language-switcher.tsx` の変更（`/settings` 既存UIを壊すな）
- `lib/i18n/use-locale.tsx` の変更
- 下部ナビの項目数変更（5個固定）
- `/en` `/ko` `/zh-TW` などのルート追加
- ホームv1.2・area-detail-v1.1 の構造変更
