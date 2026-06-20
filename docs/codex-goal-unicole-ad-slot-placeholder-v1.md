# Codex /goal: UNICOLE 広告枠プレースホルダー（Phase 1）

> 前提: `docs/unicole-ad-slot-design-v1.md` の Phase 1。
> **本番広告コード・広告SDK・外部 script は入れない。** プレースホルダー枠を `/foods` 末尾に1箇所だけ追加する。

以下、Codex にそのまま貼れる本文。

---

```
/goal UNICOLE に「小さめのインライン広告プレースホルダー枠」を1箇所だけ追加する（本番広告コードなし）。

## 背景 / 方針
- 下部ナビは fixed のフローティングピル（z-50, md:hidden）。固定広告は干渉するため使わない。
- 本文(main)は pb-28 でナビ分の余白を確保済み。通常フロー内のインライン枠ならナビと干渉しない。
- 第一弾は探す(/foods)ページの商品一覧の直下・フッター直前に「広告」プレースホルダーを1枠だけ置く。
- 翻訳(data/translations)は凍結中のため、ラベル「広告」やダミー文言はコンポーネント内にハードコードする（i18n は将来）。

## やること（最小・限定）
1. 新規コンポーネント `components/ad-slot.tsx` を作成する。
   - サーバーコンポーネントでよい（フック不要、クリック不可、外部通信なし）。
   - 任意 props（最低限）: `className?: string`、`slotId?: string`、`children?: React.ReactNode`。
   - 見た目:
     - ルート: `<aside>` か `<div>`。`role` 過剰付与は不要、`aria-label="広告"`。
     - クラス: `mx-auto my-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white`（bg-cream でも可）。
     - 固定高でレイアウトシフト(CLS)を防ぐ: 例 `h-24` 程度（モバイル中心）。中央寄せ。
     - 左上に小さく「広告」: `text-[10px] font-bold uppercase tracking-wide text-slate-400`。
     - 中央に淡色プレースホルダー文言（例「広告スペース」）: `text-xs font-bold text-slate-300`。
     - ルートに `data-ad-slot={slotId ?? "placeholder"}` を付け、将来 AdSense 等へ中身だけ差し替え可能にする。
     - `children` が渡されたらプレースホルダー文言の代わりに children を表示（将来の実広告差し替え用フック）。
   - 外部 `<script>`・iframe・SDK・本番広告タグは入れない。リンク/onClick も付けない。

2. `app/foods/page.tsx` を編集し、`<FoodGrid .../>` の直後（フッター直前）に枠を1つだけ置く。
   - 例:
     return (
       <>
         <FoodGrid ... />
         <AdSlot slotId="foods-bottom" />
       </>
     );
   - import を1行追加（@/components/ad-slot）。FoodGrid に渡す props は一切変えない。

## やってはいけないこと（厳守）
- git add . 禁止。変更ファイルを個別に限定して add する。
- 広告SDK / 外部script / iframe / 本番広告コードの追加禁止（Phase 1 はプレースホルダーのみ）。
- package.json 変更禁止（依存追加なし）。
- 下部ナビ（app-header.tsx）変更禁止。
- ヘッダー変更禁止。
- app/layout.tsx は変更しない（全画面共通化はしない。今回は /foods の1箇所だけ）。
- 常時下固定（position:fixed/sticky の広告）にしない。通常フローのインラインのみ。
- data/translations 変更禁止（ラベルはハードコード）。
- generated JSON 変更禁止。
- DB / crawler 実行禁止。
- URL構造・food.id・store.id を変更しない。
- 対象2ファイル（components/ad-slot.tsx, app/foods/page.tsx）以外を変更しない。

## 検証（実施し結果を報告）
- npm run lint
- npm run typecheck
- npm run build
- npm run coverage   ← Food/Store Coverage が下記から変化していないこと:
    Food: total 294 / translated 77 / missing 217 / verified 6 / needs_review 69 / orphan 0
    Store: generated_total 42 / translated 42 / missing 0 / display_total 99 / display_translated 52 /
           display_missing 47 / display_seed 14 / verified 23 / needs_review 33 / orphan 0
- 表示確認（モバイル幅）:
    - /foods 末尾に広告枠が1つだけ表示される。
    - 下部ナビと重ならない／遮らない（枠はナビ余白の内側、フッター手前）。
    - 読み込み時のレイアウトシフトがない（固定高）。
    - フッター・本文がナビに潜らない。
    - 枠は白背景・薄い枠・小さめで、「広告」表記がある。
- git status --short が想定2ファイルのみであること。

## 完了条件
- components/ad-slot.tsx（プレースホルダー）を新設。
- app/foods/page.tsx で 1 枠だけ配置。
- lint/typecheck/build/coverage 成功、Coverage 不変、表示・ナビ非干渉・CLS なしを確認。
- 変更2ファイルを限定報告し、レビュー（Claude）へ回す。

## Stop条件（該当したら停止して報告）
- 対象2ファイル以外に差分が出そうなとき。
- Coverage が変化したとき。
- 下部ナビ/フッターと干渉する、またはレイアウトシフトが出るとき。
- 翻訳キー追加や package.json 変更が必要になったとき。
- 本番広告コード/外部script が必要だと判明したとき（Phase 3 マター）。
```

---

## 進行側メモ
- 本 /goal は **Phase 1（プレースホルダー）限定**。実広告（AdSense 等）は Phase 3 で CSP 更新・同意・i18n を含む別 /goal を作成する。
- 実装完了後、Claude が `design-review-unicole-ad-slot-placeholder-v1.md` でレビュー証跡を作成する（本タスクではまだ作らない）。
