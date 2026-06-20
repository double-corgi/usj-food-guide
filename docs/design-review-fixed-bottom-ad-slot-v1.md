# design-review-fixed-bottom-ad-slot-v1

## 判定

承認

## レビュー対象

- commit: `d65bc11`
- commit message: `feat: make ad slot fixed at bottom`
- 対象ファイル:
  - `components/ad-slot.tsx`
  - `app/foods/page.tsx`
  - `app/layout.tsx`

## 確認結果

### スコープ遵守

承認。

変更対象は以下3ファイルに限定されている。

- `components/ad-slot.tsx`
- `app/foods/page.tsx`
- `app/layout.tsx`

以下には変更なし。

- `components/app-header.tsx`
- 下部ナビ構造
- `data/translations`
- `scripts/output`
- generated JSON
- DB / crawler
- `package.json`
- 本番広告コード
- 広告SDK
- 外部script
- iframe
- public画像

### /foods 末尾インライン広告の削除

承認。

`app/foods/page.tsx` から `AdSlot` import と `<AdSlot slotId="foods-bottom" />` が削除されており、`FoodGrid` 直後のインライン広告は残っていない。

### 全ページ共通固定広告

承認。

`app/layout.tsx` に以下が追加され、全ページ共通で広告枠が1枠だけ表示される構成になっている。

```tsx
<AdSlot slotId="global-bottom" variant="fixed" />
```

`AdSlot` の呼び出しは layout 側の1箇所のみで、複数広告化していない。

### 広告コード・外部通信

承認。

`components/ad-slot.tsx` は静的なプレースホルダーのみで、以下は含まれていない。

- 本番広告コード
- 広告SDK
- 外部script
- iframe
- onClick
- 外部通信処理

Phase 1 の範囲に収まっている。

### アクセシビリティ / 識別属性

承認。

`AdSlot` に以下が維持されている。

- `aria-label="広告"`
- `data-ad-slot={slotId}`
- 表示テキスト「広告」
- プレースホルダー文言「広告スペース」

### 下部ナビとの干渉

承認。

下部ナビは `components/app-header.tsx` 側で従来どおり以下のまま。

- `bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]`
- `z-50`
- `md:hidden`

固定広告は以下の設計。

- mobile: `bottom-[calc(env(safe-area-inset-bottom)+5.25rem)]`
- `z-40`
- `h-14`
- `inset-x-4`
- `max-w-md`

広告枠は下部ナビより上に配置され、z-indexも下部ナビより低いため、明確な構造衝突はない。

### PC表示

承認。

PCでは以下のクラスで画面下部中央に控えめに表示される。

- `md:bottom-[calc(env(safe-area-inset-bottom)+1rem)]`
- `md:left-1/2`
- `md:right-auto`
- `md:w-[min(28rem,calc(100vw-2rem))]`
- `md:-translate-x-1/2`

サイズも `h-14` / `max-w-md` で小さめに収まっている。

### safe-area / CLS

承認。

`env(safe-area-inset-bottom)` を mobile / desktop 両方の fixed bottom 位置に使っている。

広告枠は `h-14` の固定高で、fixed配置のため通常フローのCLS要因にはなりにくい。

### 本文・フッターへの被り対策

承認。

`app/layout.tsx` で本文下余白が調整されている。

- mobile: `pb-44`
- md以上: `md:pb-24`

また `AppFooter` を `pb-20` のラッパーで包んでおり、固定広告がフッター末尾に被るリスクも軽減されている。

やや余白は増えるが、固定広告のPhase 1としては安全側の調整で妥当。

### ヘッダー / 下部ナビ

承認。

ヘッダーおよび下部ナビの構造変更はない。

### 品質保証

申告された検証はすべて成功。

- `npm run lint`: 成功
- `npm run typecheck`: 成功
- `npm run build`: 成功
- `npm run coverage`: 成功

Coverageも期待値から変化なし。

Food Translation Coverage:

- total: 294
- translated: 77
- missing: 217
- verified: 6
- needs_review: 69
- orphan: 0

Store Translation Coverage:

- generated_total: 42
- translated: 42
- missing: 0
- display_total: 99
- display_translated: 52
- display_missing: 47
- display_seed: 14
- verified: 23
- needs_review: 33
- orphan: 0

## 懸念点

致命的な問題なし。

軽微な注意点として、固定広告により全ページで下部視界を常時一部占有するため、今後の実広告化前に実機で以下を確認するとよい。

- iPhone Safari 下部UIとの距離
- 390px幅での圧迫感
- フッター最下部のリンク操作性
- 長い一覧ページでのスクロール体感

ただし、現実装は小さめ・固定高・safe-area考慮済みであり、Phase 1としては承認可能。

## 結論

承認。

広告プレースホルダーは `/foods` 末尾のインライン配置から、全ページ共通の下部固定表示へ適切に移行されている。本番広告コードや外部scriptを含まず、下部ナビ構造にも手を入れていないため、Phase 1の実装範囲に収まっている。
