# design-review-store-id-collision-fix-v1-1

対象: 店舗ID衝突修正 v1.1（commit 8224683c）
レビュー日: 2026-06-16
参照: `design-review-store-id-collision-fix-v1.md`、`docs/store-id-collision-audit-v1.md`、`docs/codex-goal-store-id-collision-fix-v1.md`

---

## 判定: 条件付き承認

---

## 1. 判定理由の要約

v1不承認の理由として挙げた2点（①`createUniqueStoreDisplayId`の非ASCII URL問題、②本番重複未解消）のうち、①はコード変更により完全に解消されており、スクリーンショット3枚から修正ロジックが正しく動作していることが確認できる。しかし②について、本番URL（`https://new-app-chi-rosy.vercel.app/stores`）を独立取得したところ、v1レビュー時と同一のpre-fix状態（`shop-1tt48e8` ×8重複、`shop-店舗未確認` ×2）が依然として返されており、Vercelデプロイ完了を独立確認できていない。スクリーンショットが本番URLからのものか不明な点も残る。コード品質は承認に値するため、本番デプロイ確認を条件として条件付き承認とする。

---

## 2. v1不承認理由の解消確認

### ①（v1問題）`createUniqueStoreDisplayId`が非ASCII URLを生成する → **解消✅**

v1では `normalizeAreaName(store.areaName)` の戻り値（日本語文字列 + 中黒`・`）をそのまま `areaSlug` に使用していたため、新IDに非ASCII文字が混入していた。

v1.1での変更:

```ts
// v1（問題あり）
const areaSlug = normalizeAreaName(store.areaName) || normalizeShopName(store.areaName);
const base = `shop-${normalizeShopName(store.name)}-${areaSlug || "area"}`;

// v1.1（修正後）
const slug = [
  normalizeAsciiSlug(store.name),
  normalizeAsciiSlug(normalizeAreaName(store.areaName) || store.areaName),
  normalizeAsciiSlug(store.type)
].filter(Boolean).join("-");
const suffix = `${slug || "store"}-${shortStoreHash(`${store.name}|${store.areaName}|${store.type}`)}`;
const base = `${originalBase}-${suffix}`.replace(/-+/g, "-").replace(/-$/g, "");
```

`normalizeAsciiSlug` は NFKD正規化 → `™`/`®`削除 → `&` → "and" → ASCII英数字以外を`-`に変換 → 小文字化 を行う。日本語・中黒・記号はすべて除去される（純日本語入力は空文字列を返す）。`shortStoreHash` は FNV-1aによる6文字base36ハッシュで衝突を防ぐ。

**結果**: 新IDの形式は `shop-[a-z0-9-]+` または `shop-store-[hash]`（純日本語店舗名の場合）となり、完全にASCII-safe。`isAsciiSafeStoreId` によって対象外判定される非ASCIIな既存IDには legacyAlias が付与され後方互換性も保たれる。

### ②（v1問題）本番URL重複未解消 → **スクリーンショットでは解消確認、本番独立確認は未取得**

Codexが提供したスクリーンショット3枚（`detail-1-390.png`、`detail-2-390.png`、`detail-3-390.png`）で、以下の3店舗が別々のコンテンツを表示している:

| ファイル | 表示店舗 | エリア | 品数 |
|---|---|---|---|
| detail-1-390.png | ボードウォーク・スナック | アミティ・ビレッジ | 5品 |
| detail-2-390.png | ホッグズ・ヘッド | ウィザーディング・ワールド・オブ・ハリー・ポッタ | 1品 |
| detail-3-390.png | アミティ・アイスクリーム | アミティ・ビレッジ | 3品 |

修正前はこれら3店舗がすべて `shop-1tt48e8` を共有し、同一店舗（アミティ・アイスクリーム）の画面を返していた。各店舗が独立したコンテンツを表示していることは **ロジックが正しく動作している証拠**である。

ただし、スクリーンショットのURLが本番URLであるかローカル環境（`localhost:3000`）であるかを画像から判別できない。本番URL（`https://new-app-chi-rosy.vercel.app/stores`）を独立取得したところ、依然として `shop-1tt48e8` ×8重複が存在するレスポンスが返された。v1レビュー時と同じ状況であり、Vercelデプロイの完了タイミングが再び問題となっている可能性が高い。

---

## 3. コードレビュー（`lib/store-utils.ts` diff: +67/-15）

### `resolveStoreDisplayIds` の改修

```ts
// v1.1: ASCII-safeかつ1件目のIDは保持する
if (isAsciiSafeStoreId(originalId) && (!isDuplicated || seen === 0)) {
  return { store, legacyAliasToKeep: undefined };
}
const id = createUniqueStoreDisplayId(store, reservedIds, originalId);
reservedIds.add(id);
return {
  store: { ...store, id },
  legacyAliasToKeep: seen === 0 ? originalId : undefined
};
```

ロジックの評価:

- ASCII-safeかつ重複なし → 変更なし（既存URL維持）✅
- ASCII-safeかつ重複あり1件目 → 変更なし（最初の店舗が既存IDを保持）✅
- ASCII-safeかつ重複あり2件目以降 → 新ID付与、legacyAliasなし ✅
- 非ASCII（例: `shop-店舗未確認`、`shop-ホッグズ-ヘッド-パブ`）1件目 → 新ID付与、旧IDをlegacyAliasとして保持（後方互換）✅
- 非ASCII2件目以降 → 新ID付与、legacyAliasなし ✅

全5衝突グループ（`shop-1tt48e8` ×8、`shop-店舗未確認` ×2、`shop-bie1ke` ×2、`shop-56paaa` ×2、`shop-10vzio0` ×2）がすべて正しく処理される設計になっている。

### エイリアス浄化ロジック

```ts
aliases: store.aliases.filter((alias) => {
  if (alias === store.id || finalIds.has(alias)) return false;
  if (alias === legacyAliasToKeep) return true;
  return (aliasCounts.get(alias) ?? 0) === 1;
})
```

- 自分自身のIDと重複するエイリアスは除去 ✅
- 他のstoreのprimary IDと衝突するエイリアスは除去 ✅
- legacyAliasToKeepは確実に保持 ✅
- 他のエイリアスとして重複（aliasCounts ≥ 2）するものは除去 ✅

### `findStoreById` の改修（v1から継続）

```ts
const ids = new Set([id, safeDecodeStoreId(id)]);
return stores.find((store) => ids.has(store.id) || store.aliases.some((alias) => ids.has(alias)));
```

パーセントエンコードされた非ASCII IDでのアクセスにも対応。legacyAliasを経由したルーティングが機能する。設計として正しい ✅

---

## 4. スクリーンショット評価

| ファイル | 確認内容 | 評価 |
|---|---|---|
| `stores-390.png` | /stores一覧（390px）。エリア別セクションが表示されている。hrефのASCII/非ASCII判別は画像から不可。 | ⚠️要URL確認 |
| `detail-1-390.png` | ボードウォーク・スナック、5品 → 修正前とは異なる正しい店舗が表示 | ✅ |
| `detail-2-390.png` | ホッグズ・ヘッド、1品、バタービール → 正しい店舗が表示。ウィザーディング・エリアとして正しい | ✅ |
| `detail-3-390.png` | アミティ・アイスクリーム、3品 → 独立した店舗ページとして正しく存在 | ✅ |

**総評**: 3つの詳細ページが互いに異なる店舗を表示していることは、衝突修正が動作していることを強く示す。ただし、URLバーが写っておらずURLの確認ができないため、ASCIIセーフなIDがURLとして実際に使われているかの確認は本番独立確認に委ねる。

---

## 5. 本番確認結果（独立確認）

`https://new-app-chi-rosy.vercel.app/stores` を取得した結果:

| ID | 重複件数 | 状態 |
|---|---|---|
| `shop-1tt48e8` | 8件 | 修正前と同一 ❌ |
| `shop-店舗未確認` | 2件 | 修正前と同一 ❌ |
| その他衝突ID（`shop-bie1ke`等） | 未確認 | — |

v1レビュー時との差分なし。原因はVercelデプロイ未完了の可能性が高い（commit 8224683c のデプロイタイミング）。コードバグの可能性は低いと判断するが、本番確認なしには排除できない。

---

## 6. 項目別評価

| 観点 | 評価 | 詳細 |
|---|---|---|
| v1不承認理由①（非ASCII新ID）の解消 | ✅ | `normalizeAsciiSlug` により完全にASCII-safe |
| v1不承認理由②（本番重複未解消）の解消 | ⚠️ | スクリーンショットでは解消確認、本番独立確認では未確認 |
| 修正範囲の限定 | ✅ | `lib/store-utils.ts` のみ（+67/-15）。generated JSON・DB・i18n・home・area-detailに変更なし |
| `isAsciiSafeStoreId` の実装 | ✅ | 正規表現 `^shop-[a-z0-9]+(?:-[a-z0-9]+)*$` は正しい |
| `normalizeAsciiSlug` の実装 | ✅ | NFKD + ASCII-only filter で全言語対応 |
| `shortStoreHash` の実装 | ✅ | FNV-1a 6文字 base36、十分なエントロピー |
| legacyAlias保持（後方互換性） | ✅ | 非ASCII 1件目のみ旧IDをaliasとして保持 |
| `findStoreById` のサフィックス対応 | ✅ | `safeDecodeStoreId` によるdecodeURIComponent対応 |
| 0品防御的UI（v1からの継続） | ✅ | `displayFoods.length > 0` 条件分岐 |
| スクリーンショットの店舗正確性 | ✅ | 3店舗が独立した正しいコンテンツを表示 |
| 本番URL独立確認 | ❌ | Vercelデプロイ完了を確認できず |

---

## 7. 条件付き承認の条件

### 必須（これを確認できれば本承認）

1. **Vercelデプロイ完了確認**: `https://new-app-chi-rosy.vercel.app/stores` を取得し、以下をすべて確認して報告すること。
   - `shop-1tt48e8` の重複が0件（または1件のみ — 最初の店舗がIDを保持している場合）
   - `shop-店舗未確認` の重複が0件（または1件のみ）
   - 非ASCII hrefを持つカードが0件

2. **詳細ページ確認**: 以下の2パターンを本番URLで確認すること。
   - 旧 `shop-1tt48e8` にアクセスした場合に1件目の店舗（アルファベット順で最初に来る店舗）が正しく表示されること
   - 衝突していた別の店舗（例: ホッグズ・ヘッド）の新IDでアクセスした場合に正しい店舗が表示されること

### 推奨（条件ではないが報告を求める）

3. 5衝突グループすべて（`shop-1tt48e8`、`shop-店舗未確認`、`shop-bie1ke`、`shop-56paaa`、`shop-10vzio0`）が解消されていることを href一覧で確認して報告すること。

---

## 8. 既存機能影響

コード変更は `lib/store-utils.ts` の後処理ステップ（`resolveStoreDisplayIds`）と `findStoreById` のルックアップ拡張のみ。`buildStoresFromFoods` のコア処理、`isVisibleFood` フィルタ、i18n、ホーム、area-detail、eaten/settings への変更なし。既存機能への破壊リスクは低い。

デプロイ確認時に `/`・`/areas`・`/areas/[id]`・`/eaten`・`/settings` の動作も合わせて確認すること。

---

## 9. 次のステップ

1. Vercelが commit 8224683c をデプロイ完了していることを確認する（Vercel dashboardのデプロイログ等）。
2. 本番URLで条件①②を確認し、結果を報告する。
3. 確認が取れた時点でレビュー担当（Claude）に再提出すること — この時点で**本承認**とする。
