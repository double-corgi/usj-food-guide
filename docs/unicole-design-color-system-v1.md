# UNICOLE デザインカラーシステム v1

**作成日:** 2026-06-19  
**担当:** Claude（設計担当 / レビュー担当）  
**ステータス:** 設計書 — 実装前

---

## 0. なぜこの設計書を作るか

現在のUNICOLEは全体的に「濃紺（`#071b3a` = `ink`）をボタン・見出し・CTA全般に使いすぎており、重い・AI寄りの印象になっている。USJの鮮やかなブルー（`park`）とゴールド（`sun`）を主役に据え、`ink`を「締め色・文字色限定」に引き戻すことで、ユニバ感・明るさ・コレクション欲を引き出す。

---

## 1. 現在のカラートークン（tailwind.config.ts）

| トークン名 | 値 | 用途（現状） |
|---|---|---|
| `ink` | `#071b3a` | 文字・ボタン背景・見出し・CTAすべてに乱用 |
| `park` | `#0057b8` | USJブルー。リンク・アクセント・「食べた済み」ボタン |
| `berry` | `#c8102e` | 限定バッジ・終売バッジ。**誤ってcompletion-meterの進捗バーにも使用** |
| `sun` | `#fdbb30` | ゴールド。Homeヒーロー進捗バーのグラデ終端のみ |
| `mint` | `#e8f2ff` | hover背景・下部ナビアクティブ背景・チップ背景 |

**CSS変数:** 現状なし（tailwind tokenのみ）

**body color (globals.css):** `color: #18212f`（やや濃いが`ink`と近似。文字色として許容範囲）

---

## 2. 現状の濃紺（`ink` = `bg-ink`）使用箇所 完全マップ

### 問題: `bg-ink text-white`（濃紺ボタン）

| ファイル | 行 | 用途 | 問題レベル |
|---|---|---|---|
| `components/food-card.tsx` | L79–81 | 未食べ「食べた」ボタン | 🔴 最重要 |
| `components/food-detail.tsx` | L142 | 未食べ「食べた」ボタン | 🔴 最重要 |
| `components/app-footer.tsx` | L24 | 「食品を探す」CTAボタン | 🔴 最重要 |
| `components/food-grid.tsx` | L344 | 「もっと見る」ボタン | 🔴 最重要 |

これら4箇所が「黒っぽい・重い・AIっぽい」の主因。すべてのプライマリアクションが濃紺で塗られており、USJブルーが脇役になっている。

### 問題: `bg-berry`（誤用）

| ファイル | 行 | 用途 | 問題レベル |
|---|---|---|---|
| `components/completion-meter.tsx` | L26 | 達成率プログレスバー | 🔴 意味的に誤 |

進捗バーに赤（`berry`）は「危険・終了」の印象を与える。達成感を出すには`park`（青）またはblue→gold グラデが正しい。

### 許容範囲: `text-ink`（文字色としての濃紺）

| ファイル | 用途 | 評価 |
|---|---|---|
| h1, h2 全般 | ページ見出し | ✅ 文字色としては適切 |
| `HomeCollectionHero` | `text-[#071b3a]`（= ink相当） | ✅ ヒーロー見出しは濃く締める |
| カード内テキスト（`HomeFoodRailCard`など） | 商品名 | ✅ 読みやすさ優先でOK |

### 現状良好な箇所（変えない）

| ファイル / 箇所 | クラス | 評価 |
|---|---|---|
| 下部ナビ（アクティブ） | `bg-mint text-park` | ✅ 正しい配色 |
| カテゴリチップ（アクティブ） | `border-park bg-mint text-park` | ✅ |
| 食べた後ボタン | `bg-park text-white` | ✅ USJブルーが達成感を表す |
| Homeヒーロー進捗バー | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` | ✅ blue→gold でUSJらしい |
| ジャンル別進捗バー（eaten-genre-progress） | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` | ✅ |
| エリア別進捗バー（eaten-area-progress） | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` | ✅ |
| エリアカード進捗バー（area-overview） | `bg-mint`（白背景の上） | 🟡 Phase 2で確認 |
| 限定バッジ | `bg-berry text-white` | ✅ 用途として正しい |
| 終売バッジ | `bg-slate-800/88 text-white` | ✅ |
| kicker（ページ小見出し） | `text-park/70` | ✅ |
| MapPin・Store アイコン | `text-park` | ✅ |
| Homeヒーロー背景 | `bg-[#fffaf5]`（クリーム） | ✅ 温かみがある |
| Homeヒーロー進捗バー背景 | `bg-[#e7dccb]`（サンド） | ✅ |

---

## 3. カラーシステム新ルール

### 3-1. トークン役割の再定義

| トークン | 値 | 新しい役割 |
|---|---|---|
| `ink` | `#071b3a` | **文字・締め色限定。ボタン背景・大面積への使用禁止** |
| `park` | `#0057b8` | **プライマリアクションカラー。全CTAボタン・アクセント・リンク・アイコン** |
| `berry` | `#c8102e` | **限定・終売・警告バッジのみ。進捗バー・ボタン禁止** |
| `sun` | `#fdbb30` | **達成・ゴールドアクセント。進捗バーグラデ終端・スタンプ強調** |
| `mint` | `#e8f2ff` | **hover背景・アクティブ背景・選択状態チップ** |

### 3-2. 追加トークン（tailwind.config.ts に追加）

| トークン名 | 値 | 用途 |
|---|---|---|
| `cream` | `#fffaf5` | Homeセクション背景・温かみのある白（現在ハードコード） |
| `sand` | `#e7dccb` | Homeプログレスバー背景・ウォームニュートラル（現在ハードコード） |

### 3-3. ボタンカラーの統一ルール

| ボタン種別 | 新クラス | 説明 |
|---|---|---|
| プライマリ（未操作） | `bg-park text-white` | USJブルー主役。「食べる・探す・進む」 |
| プライマリ（操作済み） | `bg-park text-white` | 変わらず（既に正しい） |
| セカンダリ（アウトライン） | `border-slate-200 bg-white text-slate-700` | ゴースト。サブアクション |
| 危険・終了 | `border-red-200 bg-red-50 text-red-700` | 削除・警告のみ |
| 次回食べたいフラグ（OFF） | `border-slate-200 bg-white text-slate-500` | 変わらず |
| 次回食べたいフラグ（ON） | `border-park bg-mint text-park` | 変わらず |
| 「もっと見る」 | `bg-park text-white` | 濃紺→USJブルー |

### 3-4. 進捗バーカラーのルール

| 用途 | クラス |
|---|---|
| Home・全体達成率 | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` |
| ジャンル達成率 | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` |
| エリア達成率 | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` |
| completion-meter | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]`（`bg-berry`→修正） |
| エリアカード内（濃い背景の上） | `bg-mint`（変わらず） |

### 3-5. コンポーネント別カラーまとめ

#### 商品カード (food-card.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| 未食べ「食べた」ボタン | `bg-ink text-white` | `bg-park text-white` |
| 食べた後ボタン | `bg-park text-white` | 変わらず |
| カード枠線（未食べ） | `ring-1 ring-slate-200/70` | 変わらず |
| カード枠線（食べた後） | `ring-park/20` | 変わらず |
| 次回食べたいボタン(OFF) | `border-slate-200 bg-white text-slate-500` | 変わらず |
| 次回食べたいボタン(ON) | `border-park bg-mint text-park` | 変わらず |

#### 商品詳細 (food-detail.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| 未食べ「食べた」ボタン | `bg-ink text-white` | `bg-park text-white` |
| 食べた後ボタン | `bg-park text-white` | 変わらず |
| 次回食べたいボタン | `border-slate-200 bg-white/75 text-slate-700` | 変わらず |

#### 探す (food-grid.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| 「もっと見る」ボタン | `bg-ink text-white rounded-lg` | `bg-park text-white` |
| カテゴリチップ（アクティブ） | `border-park bg-mint text-park` | 変わらず |
| フィルター各種 | `border-slate-200` | 変わらず |

#### フッター (app-footer.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| 「食品を探す」CTAボタン | `bg-ink text-white rounded-full` | `bg-park text-white` |
| 「お知らせ」アウトラインボタン | `border-slate-200 bg-white text-ink` | 変わらず |

#### Completion Meter (completion-meter.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| 進捗バー | `bg-berry` | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` |

#### ヘッダー・下部ナビ (app-header.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| 下部ナビ（アクティブ） | `bg-mint text-park` | 変わらず（現状維持） |
| 下部ナビ（非アクティブ） | `text-slate-500` | 変わらず |
| PCナビ hover | `hover:bg-mint hover:text-park` | 変わらず |

#### Home (home-progress-client.tsx)
| 要素 | 現状 | Phase 1後 |
|---|---|---|
| セクション背景 | `bg-[#fffaf5]` | 変わらず（cream トークン化はPhase 2） |
| 進捗バー | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` | 変わらず |
| 見出し | `text-[#071b3a]` | 変わらず（Phase 2） |

---

## 4. Phase 計画

### Phase 1（今回 Codex に依頼）— 最小変更・最大効果

**目標:** 「濃紺ボタン」と「進捗バー赤」を一掃。全体の第一印象を改善。

**変更ファイル（7件）:**

| ファイル | 変更内容 |
|---|---|
| `tailwind.config.ts` | `cream`, `sand` トークン追加 |
| `app/globals.css` | body `color` → `#071b3a`（ink統一） |
| `components/food-card.tsx` | 未食べボタン `bg-ink` → `bg-park` |
| `components/food-detail.tsx` | 未食べボタン `bg-ink` → `bg-park` |
| `components/app-footer.tsx` | CTAボタン `bg-ink` → `bg-park` |
| `components/food-grid.tsx` | 「もっと見る」`bg-ink` → `bg-park` |
| `components/completion-meter.tsx` | 進捗バー `bg-berry` → グラデ |

**変更しないもの:**
- `text-ink`（文字色）— 全ファイルで文字として正しく使っている
- 下部ナビ・ヘッダー
- バッジ（`bg-berry`, `bg-sun`）
- Home カルーセル
- カテゴリチップ

**期待効果:**
- プライマリCTAがすべてUSJブルー(`park`)に統一される
- 達成率バーが「進捗感・前向き感」のある青→金グラデになる
- 黒っぽい重さが大幅に軽減される

---

### Phase 2（次の設計書で定義）— 細かい装飾調整

**対象:**
- Homeヒーローの`text-[#071b3a]`等のハードコード色 → tailwind tokenへ統一
- エリアカード進捗バーの`bg-mint`（白背景上での視認性確認）
- 食べたページのタブ（`bg-white text-ink` → `bg-white text-park`）
- 商品詳細ページのカテゴリkicker (`text-park`) → 変わらず確認
- Homeクリーム背景のtailwind token置換（`bg-[#fffaf5]` → `bg-cream`）

---

### Phase 3（別作業）— 画像品質チェック

**対象:**
- `foods.generated.json`の商品画像URLを棚卸し
- 低品質・代替必要な商品のリスト作成
- 候補の差し替え先URLを提案（実装なし・リストのみ）

---

## 5. 画面別・色の使い分け指針

### Home（ユニコレの顔）
- 背景: `cream`（温かみのある白） ← 既に良好
- 見出し: `text-ink`（締め色）
- 進捗数値: `text-ink`（大きく・力強く）
- 進捗バー: `park`→`sun` グラデ ← 既に良好
- CTAボタン（あれば）: `bg-park text-white`

### 探す（集める入口）
- フィルターチップ（アクティブ）: `bg-mint border-park text-park` ← 既に良好
- 商品カードボタン: `bg-park text-white`（Phase 1で修正）
- 「もっと見る」: `bg-park text-white`（Phase 1で修正）

### 食べた（コレクション記録）
- タブ（アクティブ）: `bg-white text-park`（Phase 2で修正）
- ジャンル・エリア進捗バー: `park`→`sun` グラデ ← 既に良好
- 達成数値: `text-park`（現状良好）

### エリア
- エリアカード進捗バー: `bg-mint`（Phase 2で視認性確認）
- 数値: `text-park` ← 既に良好

### 店舗
- 見出し: `text-ink`
- MapPin: `text-park` ← 既に良好

---

## 6. 「やりたい方向性」との対応確認

| 方向性 | Phase 1で達成 | Phase 2で達成 |
|---|---|---|
| USJカラーを感じる | ✅（全CTAがpark=USJブルーに） | ✅（さらに統一） |
| 派手すぎない | ✅（mintをhoverに留める） | ✅ |
| 見やすい | ✅（白地に`park`は視認性高） | ✅ |
| 安っぽくない | ✅（berry進捗バー修正） | ✅ |
| AIっぽい濃紺を減らす | ✅（`bg-ink`ボタン全廃） | ✅ |
| 白・淡いクリームをベースに | ✅（Homeは既にcream背景） | ✅ |
| parkを主役に | ✅（CTAすべてparkに） | ✅ |
| sunをアクセントに | ✅（進捗バーグラデ） | ✅ |
| 濃紺は文字・締め色に限定 | ✅（`text-ink`のみ残す） | ✅ |

---

## 7. 変えない原則

- `text-ink` の全廃はしない — 文字色として視認性・高級感あり
- ナビゲーション（header, bottom nav）は現状維持
- バッジ色（`bg-berry`, `bg-sun`）は変えない — 意味が正しい
- Homeカルーセルのvisualグラデ・装飾は変えない
- data/translations, generated JSON, DB は触らない
- 大規模リファクタは行わない
