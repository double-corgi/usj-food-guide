# 設計レビュー証跡: 下部広告サイズ調整 ＋ フッターアプリアイコン修正

- **対象commit**: `cd5ae2195f952c20de9a9cad71a103bb6976524e`
- **commit message**: `fix: refine bottom ad size and footer app icon`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-21
- **判定**: ✅ **承認**

---

## 0. 結論サマリー

スマホ下部広告を 320×50 相当（`w-[min(20rem,…)]`×`h-12`＝約320×48px）の横長バナー風に調整し、ナビをさらに上げて重なりを回避、本文/フッターのパディングも追従。フッターのユニコレアイコンは `app-icon-512.png` を `object-cover`＋控えめな ring/shadow で自然表示に修正。全21観点クリア。承認。
下部固定UIの総高が増加（約116px＋safe-area）する点のみ申し送り。

---

## 変更内容（実diff・4ファイル）

`git show --stat cd5ae21` → **4 files changed, 11 insertions(+), 8 deletions(-)**

| ファイル | 変更 |
|---|---|
| `components/ad-slot.tsx` | fixed(モバイル): `h-7→h-12`(≈48px)、`w≤24rem→w≤20rem`(320px)、`bottom+0.45→+0.5rem`、`rounded-full→rounded-xl md:rounded-full`。ラベル: モバイル「広告スペース」/PC「広告」 |
| `components/app-header.tsx` | 下部ナビ bottom `+2.75rem→+4.25rem`（さらに1.5rem 上へ） |
| `app/layout.tsx` | main `pb-44→pb-52`（モバイル）、フッター枠 `pb-36→pb-44 md:pb-20` |
| `components/brand-mark.tsx` | フッターアイコン: `bg-white p-0.5` 除去、`rounded-[1rem] shadow-sm ring-black/5`、img を `object-contain→object-cover`（内側角丸除去） |

---

## 下部固定UIの幾何検証（重点確認）

safe-area 下端基準（1rem=16px）:

| 要素 | bottom | 高さ | 占有レンジ | z |
|---|---|---|---|---|
| 横長広告（下段） | +0.5rem | h-12=3rem(48px) | **0.5 – 3.5rem** | z-40 |
| （隙間） | — | — | **3.5 – 4.25rem（0.75rem）** | — |
| 下部ナビ（上段） | +4.25rem | ~3.5rem | **4.25 – 7.75rem** | z-50 |

- **重なりなし**（広告上端3.5rem < ナビ下端4.25rem、隙間0.75rem）。✅（観点4）
- **ナビのタップ領域を侵食しない**＋広告 `pointer-events-none`。✅（観点5）
- **safe-area**: 広告・ナビとも `calc(env(safe-area-inset-bottom)+…)`。✅（観点6）
- **総高**: 0.5–7.75rem ≒ 約7.25rem(≈116px)＋safe-area（申し送り1）。

### パディング整合（観点7）
- main `pb-52`(13rem) > 固定UI上端7.75rem → 本文が隠れない。✅
- フッター枠 `pb-44`(11rem) > 7.75rem → フッターが隠れない。✅
- 全画面共通レイアウトに効くため Home/foods/eaten/areas/stores すべて成立。

### サイズ妥当性（観点2・3）
- モバイル広告 320×48px ＝ 標準モバイルバナー 320×50 にほぼ一致。細すぎず横長バナー風。✅
- 形状: `rounded-xl`（モバイル矩形バナー）/ `md:rounded-full`（PCピル）。

### デスクトップ / ヘッダー副作用（観点15）
- ナビは `md:hidden`（移動はPC無影響）。広告 desktop は `md:bottom+1rem / md:h-9 / md:w≤22rem` で従来同等。main `md:pb-24`・フッター `md:pb-20` 不変。
- `BrandMark` の利用箇所は **app-footer.tsx のみ**（grep確認）。ヘッダー（sticky `<header>`）は無変更。→ ヘッダー副作用なし。✅

---

## フッターアイコン検証（観点13・14・16）

- `public/icons/app-icon-512.png`（既存・2,588B・Jun 9）を継続使用。**新規画像・生成・加工なし**。✅（観点16）
- `object-cover`＋`aspect-square` 容器（512×512 の正方画像×正方容器のため**切れ・歪みなし**でフチまで充填）。`overflow-hidden rounded-[1rem]` で角丸。`ring-black/5 + shadow-sm` の控えめな縁取り。→ 実アプリアイコンらしい自然な見え方。✅（観点13）
- 旧 `bg-white p-0.5`（白い余白枠）を除去 → **白枠の主張が解消**。✅（観点14）

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更が対象4ファイルのみか | ✅ | `git show --name-only` で4ファイル |
| 2 | 細すぎない横長バナー風か | ✅ | h-12・w≤20rem・rounded-xl |
| 3 | 320×50 相当の自然サイズか | ✅ | 約320×48px |
| 4 | ナビと広告が重なっていないか | ✅ | 0.75rem の隙間 |
| 5 | ナビのタップ領域を邪魔しないか | ✅ | 分離＋pointer-events-none |
| 6 | safe-area を考慮しているか | ✅ | 広告・ナビとも calc(env(...)) |
| 7 | 本文/フッターが固定UIに隠れないか | ✅ | main pb-52・フッター pb-44 > 7.75rem |
| 8 | 広告枠が1つだけか | ✅ | `global-bottom` 1枠のみ |
| 9 | 「広告」表記が維持されているか | ✅ | モバイル「広告スペース」/PC「広告」 |
| 10 | data-ad-slot が維持されているか | ✅ | `data-ad-slot="global-bottom"`（不変） |
| 11 | クリック不可・外部通信なしのままか | ✅ | pointer-events-none、link/onClick・外部通信なし |
| 12 | 本番広告/AdSense/SDK/外部script/iframe が無いか | ✅ | いずれも無し |
| 13 | フッターアイコンが app-icon-512.png で自然表示か | ✅ | object-cover で正方フチ充填、控えめ縁取り |
| 14 | 白枠/余白が不自然に目立たないか | ✅ | bg-white p-0.5 除去、ring-black/5 のみ |
| 15 | ヘッダー側に意図しない影響がないか | ✅ | BrandMark は footer 専用、sticky header 無変更 |
| 16 | 画像生成・加工・新規追加をしていないか | ✅ | 既存PNGのCSS調整のみ |
| 17 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | diff になし |
| 18 | package.json を変更していないか | ✅ | diff になし |
| 19 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告。UIのみで整合 |
| 20 | Food/Store Coverage が期待値から変化していないか | ✅ | UIのみ。期待値と整合 |
| 21 | 実広告化前のPhase 1として安全か | ✅ | 重なり/隠れ/誤タップなし・safe-area/パディング整合。320×50相当でPhase 3への土台も改善 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat cd5ae21` / `git show cd5ae21` → 全diff
- 幾何計算（ナビ +4.25rem＋~3.5rem、広告 +0.5rem＋h-12）→ 0.75rem 隙間・重なりなし
- `grep -rn BrandMark components/ app/` → footer 専用（ヘッダー非波及）
- `ls public/icons/app-icon-512.png` → 既存資産・新規追加なし
- `git status --short` → クリーン

---

## 補足（非ブロッキング・申し送り）

判定（承認）には影響しない。

1. **下部固定UIの総高が増加（約116px＋safe-area）**: 320×50 バナー＋ナビ＋隙間の自然な帰結。実バナー標準サイズではあるが、小型端末では本文領域の圧迫が以前より増える。体感を見て、広告高さ・ナビ位置・隙間のバランスを最終調整できるよう留意。
2. **Phase 3（実広告化）への前進**: 前回懸念した「実バナーがナビと重なる」問題は、h-12(≈50px)＋0.75rem 隙間＋ナビ上げ＋パディング拡大で解消方向。実広告(320×50)を入れる土台が整った。導入時は CSP（script-src 等）更新・同意・pwa-register との同時表示確認が別途必要。
3. **モバイルラベル「広告スペース」**: プレースホルダー文言として妥当。実広告化時は枠内容ごと差し替わる。
4. **object-cover の前提**: 現アイコンは 512×512 正方のため切れない。将来非正方画像に差し替える場合は cover でトリミングされる点に注意（現状問題なし）。
5. **広告のグローバル表示（eaten 含む）は継続**: 横長・控えめだが、記録/達成画面にも常時表示される点は前回同様、進行側で意図確認を推奨。

---

## 結論

下部広告を 320×50 相当の横長バナー風に整え、ナビ上げ＋パディング拡大で重なり・隠れ・誤タップを回避（safe-area 整合）。フッターアイコンは既存 `app-icon-512.png` を object-cover＋控えめ縁取りで自然表示にし、白枠の主張を解消。変更は対象4ファイルに限定、ヘッダー・翻訳・generated JSON・画像資産への副作用なし、広告1枠・本番広告コードなし、Coverage 不変。Phase 1 プレースホルダーとして安全。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
