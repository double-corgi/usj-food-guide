# 設計レビュー証跡: スマホ下部「ナビ＋横長広告」2段構成

- **対象commit**: `8b8c2dff35082fcd38650e6ff52d22c1f7c6b1ae`
- **commit message**: `fix: add bottom ad below mobile nav`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-21
- **判定**: ✅ **承認**

---

## 0. 結論サマリー

スマホで「下部ナビ（上段）＋横長広告（下段）」の2段固定UIを構成。前回（d3ce206）でナビ背後に隠れていた問題を、**ナビを 2.75rem まで上げ、広告をその下に 0.55rem の隙間を空けて配置**することで正しく解消。重なり・誤タップ・隠れなし、safe-area とパディングも整合。承認。
ただし下部固定UI全体が高くなる点・広告位置が画面最下部に近い点・実広告化時の高さ制約は申し送りとして記載。

---

## 変更内容（実diff・4ファイル）

`git show --stat 8b8c2df` → **4 files changed, 4 insertions(+), 7 deletions(-)**

| ファイル | 変更 |
|---|---|
| `components/app-header.tsx` | 下部ナビの bottom を `+0.75rem` → **`+2.75rem`**（2rem 上へ移動） |
| `components/ad-slot.tsx` | fixed variant: モバイルでも表示（`hidden` 撤去）。`bottom +0.45rem / h-7 / w≤24rem`、`md:bottom +1rem / md:h-9 / md:w≤22rem` |
| `app/layout.tsx` | main `pb-32`→**`pb-44`**（モバイル）。フッター枠 `pb-20`→**`pb-36 md:pb-20`** |
| `components/food-grid.tsx` | インライン広告 `foods-list-before`（＋import）を**削除** |

---

## 下部固定UIの幾何検証（重点確認）

safe-area 下端を基準（1rem=16px換算）:

| 要素 | bottom | 高さ | 占有レンジ | z |
|---|---|---|---|---|
| 横長広告（下段） | +0.45rem | h-7=1.75rem | **0.45 – 2.2rem** | z-40 |
| （隙間） | — | — | **2.2 – 2.75rem（0.55rem）** | — |
| 下部ナビ（上段） | +2.75rem | ~3.5rem（min-h-12 + p-1） | **2.75 – 6.25rem** | z-50 |

- **重なりなし**: 広告上端2.2rem < ナビ下端2.75rem（0.55rem の隙間）。✅
- **広告がナビ背後に隠れない**（縦に分離）。✅（観点5）
- **広告がナビの上に重ならない**（広告は下段）。✅（観点6）
- **ナビのタップ領域は広告で侵食されない**＋広告は `pointer-events-none` で誤タップ不可。✅（観点4）
- **safe-area**: ナビ・広告とも `calc(env(safe-area-inset-bottom)+…)`。✅（観点7）
- **総高**: 0.45–6.25rem ≒ 約5.8rem(≈93px)＋safe-area。ナビ単独(~56px)より高い（後述・申し送り1）。

### パディング整合（観点8・9）
- main `pb-44`(11rem) > 固定UI上端6.25rem → 本文がUI裏に隠れない。✅
- フッター枠 `pb-36`(9rem, モバイル) > 6.25rem → フッターが隠れない。✅
- 全ページ共通レイアウト（Home/foods/eaten/areas/stores）に同じ `main pb-44` が効くため全画面で成立。✅

### デスクトップ副作用（重点確認）
- ナビは `md:hidden`（ナビ移動はデスクトップ無影響）。
- 広告 desktop は `md:bottom +1rem / md:h-9 / md:w≤22rem`＝従来同等。main `md:pb-24`・フッター `md:pb-20` も不変。→ **PC に副作用なし**。✅

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更が対象4ファイルのみか | ✅ | `git show --stat` で4ファイル |
| 2 | /foods 内インライン広告が削除されているか | ✅ | food-grid から `foods-list-before`＋import 削除 |
| 3 | 「下部ナビ＋横長広告」2段構成か | ✅ | ナビ(上段 2.75–6.25rem)＋広告(下段 0.45–2.2rem) |
| 4 | ナビのタップ領域が広告で邪魔されないか | ✅ | 0.55rem 分離＋広告 pointer-events-none |
| 5 | 広告がナビ裏に隠れていないか | ✅ | 縦に重なりなし |
| 6 | 広告がナビの上に重なっていないか | ✅ | 広告は下段、重なりなし |
| 7 | safe-area-inset-bottom を考慮しているか | ✅ | ナビ・広告とも calc(env(...)) |
| 8 | layout の padding-bottom 調整が妥当か | ✅ | main pb-44・フッター pb-36 が固定UI上端6.25rem を上回る |
| 9 | 各画面の本文・フッターが固定UIに隠れないか | ✅ | 共通レイアウトのパディングで全画面成立 |
| 10 | 広告枠が1つだけか | ✅ | `global-bottom` 1枠のみ（インライン撤去済み・各VP最大1） |
| 11 | 広告が横長・小さめ・控えめか | ✅ | h-7(28px)・w≤24rem の cream 半透明ピル、ラベルのみ |
| 12 | 「広告」表記が維持されているか | ✅ | fixed variant が「広告」描画 |
| 13 | data-ad-slot が維持されているか | ✅ | `data-ad-slot="global-bottom"` |
| 14 | クリック不可・外部通信なしのままか | ✅ | pointer-events-none、link/onClick・外部通信なし |
| 15 | 本番広告/AdSense/SDK/外部script/iframe が無いか | ✅ | いずれも無し |
| 16 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | diff になし |
| 17 | package.json を変更していないか | ✅ | diff になし |
| 18 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告。UIのみで整合 |
| 19 | Food/Store Coverage が期待値から変化していないか | ✅ | UIのみ。期待値と整合 |
| 20 | 実広告化前のPhase 1として安全か | ✅ | 重なり/隠れ/誤タップなし・safe-area/パディング整合。プレースホルダーとして安全（実広告化の制約は申し送り） |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 8b8c2df` / `git show 8b8c2df` → 全diff
- `sed -n '76,92p' components/app-header.tsx` → ナビ bottom +2.75rem・min-h-12 を確認
- `sed -n '10,35p' components/ad-slot.tsx` → 広告 bottom +0.45rem/h-7・pointer-events-none・「広告」ラベルを確認
- `grep -n AdSlot components/food-grid.tsx app/layout.tsx` → food-grid 撤去・global-bottom 据え置きを確認
- `git status --short` → クリーン

---

## 補足（非ブロッキング・申し送り）

判定（承認）には影響しない。

1. **下部固定UIの総高が増加**: ナビ単独(~56px)→ナビ＋広告(~93px＋safe-area)。小型端末では本文領域を従来より圧迫する。許容範囲だが、体感を見て広告高さ（h-7）や隙間を微調整できるよう留意。
2. **広告位置が画面最下部に近い（+0.45rem）**: safe-area で home indicator は回避されるが、safe-area inset の無い端末ではジェスチャー領域に近い。`pointer-events-none` のため誤タップ実害はないが、視覚的に窮屈になりうる。
3. **実広告化(Phase 3)時の高さ制約（重要）**: 現状ナビ下端(2.75rem)と広告上端(2.2rem)の余白は **0.55rem** のみ。実広告が h-7(1.75rem) を超えるとナビと重なる。実バナー（例 50px+）を入れるなら、ナビをさらに上げ・main/フッターのパディングを再拡大する設計変更が必要。今回のプレースホルダー前提のみ成立する点に注意。
4. **方針の再転換**: 直前の bd3d192（モバイル＝インライン）から、本commitでモバイル＝固定下部広告へ再転換。元設計は「モバイル固定下部＝非推奨」だったが、今回はナビ上げ＋隙間確保で**幾何的には安全**に実装されている。方針自体は進行側判断。
5. **広告がグローバル表示（eaten 含む）**: `global-bottom` は全画面に出るため、食べた記録/達成画面にも常時表示される。元設計の「記録体験を安っぽくしない」観点から、eaten で広告を出すかは進行側で一度確認推奨（横長・控えめのため影響は小）。

---

## 結論

下部ナビを上げ、その下に横長広告を 0.55rem の隙間を空けて配置する2段構成が正しく実装され、重なり・隠れ・誤タップなし、safe-area・パディング整合、デスクトップ無影響、広告1枠・本番広告コードなし、Coverage 不変。前回の「ナビ背後に隠れる」問題は解消。Phase 1 プレースホルダーとして安全。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
