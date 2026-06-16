# design-review-store-id-collision-fix-v1

対象: 店舗ID衝突修正 v1（commit 66c3f02、backup 8dafd79）
レビュー日: 2026-06-16
参照: `docs/store-id-collision-audit-v1.md`、`docs/store-detail-empty-state-review-v1.md`、`docs/codex-goal-store-id-collision-fix-v1.md`

---

## 判定: 不承認

---

## 1. 判定理由の要約

本番URL（`https://new-app-chi-rosy.vercel.app`）を独立確認した結果、**`/stores` 一覧に依然として `shop-1tt48e8` の重複が少なくとも7件存在**し、`/stores/shop-1tt48e8` は依然として「アミティ・アイスクリーム」を表示していることを確認した。Codexが報告した「unique href数: 63、duplicate href数: 0」と事実が整合していない。加えて、`createUniqueStoreDisplayId` が生成する新IDには日本語文字と中黒（・）が含まれており、解決しようとしていた「非ASCII URL問題」を新規のIDでも継承する設計上の懸念がある。

---

## 2. diff確認（コード変更の独立レビュー）

変更ファイル: `lib/store-utils.ts`（+75/-3）、`app/stores/[id]/page.tsx`（+5/-3）のみ。generated JSON・クローラー・DB・i18n・ホーム・area-detailへの変更なし。これは /goal に準拠している。

### `lib/store-utils.ts` の変更内容

#### 追加: `resolveStoreDisplayIds(stores)`

```ts
// buildStoresFromFoods() の末尾で呼び出す
return resolveStoreDisplayIds(Array.from(storeMap.values()).sort(...));
```

ロジック:
1. 全エントリの `store.id` 出現回数を `idCounts` に集計
2. 全 `aliases` の出現回数を `aliasCounts` に集計（重複エイリアス検出用）
3. ソート済み配列を走査し、同一 `id` の2件目以降を `createUniqueStoreDisplayId` で新IDに差し替え
4. 最終IDセット（`finalIds`）を使って全エントリのエイリアスを浄化

**コード自体のロジックは正しい。** ローカルシミュレーション（foods.generated.jsonを直接解析）では、実際のデータで `shop-1tt48e8` を一次IDとして持つ店舗が8件存在し、7件が新IDを取得するはずである（would reassign: 11 stores）と確認できた。

#### 追加: `findStoreById` の改修

```ts
const ids = new Set([id, safeDecodeStoreId(id)]);
return stores.find((store) => ids.has(store.id) || store.aliases.some((alias) => ids.has(alias)));
```

`safeDecodeStoreId` は `decodeURIComponent` のtry/catchラッパー。URLエンコードされた日本語スラッグを受け取った場合にデコードして照合する。**発想は正しい。**

#### 追加: `createUniqueStoreDisplayId(store, reservedIds)`

```ts
const areaSlug = normalizeAreaName(store.areaName) || normalizeShopName(store.areaName);
const base = `shop-${normalizeShopName(store.name)}-${areaSlug || "area"}`;
```

**問題**: `normalizeAreaName` の戻り値はフルの日本語エリア名（例: `"ウィザーディング・ワールド・オブ・ハリー・ポッター"`）であり、これに含まれる中黒（`・`）は `normalizeShopName` を通さないため除去されない。結果として生成される新IDに日本語文字と `・` が含まれる。例:

```
ホッグズ・ヘッド → shop-ホッグズヘッド-ウィザーディング・ワールド・オブ・ハリー・ポッター
ワーフカフェ   → shop-ワーフカフェ-サンフランシスコ・エリア
```

`safeDecodeStoreId` でルーティング自体は機能しうるが、解消しようとしていた `shop-店舗未確認`（非ASCII URL）と同種の問題を、今度は13件のユニークIDで量産することになる。`/goal` の要件「既存URLへのアクセス互換性をできるだけ維持する」「安全な修正」に照らして、このURLの品質は受け入れられない。

### `app/stores/[id]/page.tsx` の変更内容

```tsx
{displayFoods.length > 0 ? (
  <p className="mt-2 text-sm font-bold text-slate-500">
    <I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />
  </p>
) : null}
```

0品時の防御的UI。`/goal` の要件に完全準拠。i18nキーの変更なし。**この変更は正しい。**

---

## 3. 本番確認結果（独立確認）

### `/stores` 一覧

`https://new-app-chi-rosy.vercel.app/stores` を取得し、全hrефを確認した。

**依然として `shop-1tt48e8` が7件以上のカードに重複している（抜粋）:**

| 店舗名 | エリア | href |
|---|---|---|
| ボードウォーク・スナック | アミティ・ビレッジ | shop-1tt48e8 |
| ホッグズ・ヘッド | ウィザーディング | shop-1tt48e8 |
| ワーフカフェ | サンフランシスコ | shop-1tt48e8 |
| ディスカバリー・レストラン | ジュラシック | shop-1tt48e8 |
| シネマ 4-D 前フードカート | ハリウッド | shop-1tt48e8 |
| イーブル・イーツ | ミニオン | shop-1tt48e8 |
| スヌーピー・バックロット・カフェ | ワンダーランド | shop-1tt48e8 |
| ハローキティのコーナーカフェ | ワンダーランド | shop-1tt48e8 |

`shop-店舗未確認` も依然として ロンバーズ・ランディング™ 前テラスとロストワールド・レストランの2件に重複。

Codex報告「unique href数: 63、duplicate href数: 0」と**明確に矛盾する。**

### `/stores/shop-1tt48e8`

取得結果: **「アミティ・アイスクリーム」（3品）** — 修正前と完全に同一。

Codex報告「`/stores/shop-1tt48e8 → ボードウォーク・スナック`」と矛盾する。

### 結論

本番URLの状態は修正前（backup commit 8dafd79 時点）と実質的に同一である。考えられる原因は2つ:

**A. Vercelデプロイが未完了**: Codexが `git push` 直後（デプロイ完了前）に本番確認を行い、古い静的ページがCDNから返された状態で「確認済み」と報告した可能性がある。

**B. 実装バグ**: `resolveStoreDisplayIds` が実行時（Next.jsのSSG）に正しく動作していない。

どちらの場合も「Vercel確認済み・duplicate href数: 0」という報告は正確でなく、**独立本番確認なしに承認することはできない。**

---

## 4. 追加で発見した未解決の衝突（/goal非対応）

`foods.generated.json` 直接解析（本レビューで新たに確認）により、監査ドキュメントが把握していなかった衝突グループがさらに3件存在する:

| ID | 件数 | 店舗名 |
|---|---|---|
| `shop-56paaa` | 2 | フードカート/ミニオン・パーク vs フードカート/エリア確認中 |
| `shop-10vzio0` | 2 | おさるのジョージ前カート/サンフランシスコ vs /ハリウッド |
| `shop-bie1ke` | 2 | バッテリーパーク北側フードカート/ジュラシック vs /ニューヨーク |

`resolveStoreDisplayIds` は汎用的に動作するため、これらも同時に解消される設計になっているが、実際に解消されているかは本番確認できていない。

---

## 5. 項目別評価

| 観点 | 評価 | 詳細 |
|---|---|---|
| 修正範囲の限定 | ✅ | 変更2ファイルのみ。generated JSON・DB・crawler・i18n・home・area-detailに変更なし |
| コードロジックの正確さ | ✅ | `resolveStoreDisplayIds` は論理的に正しい。シミュレーションでは期待通り動作 |
| 0品防御的UI | ✅ | `displayFoods.length > 0` 条件分岐。正しい実装 |
| `safeDecodeStoreId` の設計 | ✅ | URLエンコード済みの日本語IDを安全にデコードする。設計として妥当 |
| 新ID（`createUniqueStoreDisplayId`）のURL品質 | ⚠️ | `normalizeAreaName` の戻り値（日本語）を areaSlug に使用するため、新IDに中黒（・）が残る。非ASCII URL問題を継承 |
| 本番確認（/stores 重複解消） | ❌ | 7件以上の重複が依然として存在。fix前と同一状態 |
| 本番確認（/stores/[id] 整合性） | ❌ | shop-1tt48e8 がアミティ・アイスクリームを返し続けている |
| Codex自己報告の正確さ | ❌ | 「duplicate href: 0」「shop-1tt48e8 → ボードウォーク・スナック」いずれも本番で確認できない |

---

## 6. 承認するための条件

以下を全て満たした上で再提出すること。

### 必須

1. **本番URL確認の再実施**: Vercelデプロイ完了後、`/stores` 一覧の全63件のhref一覧を取得し、重複件数が0であることを確認して報告すること。
2. **`createUniqueStoreDisplayId` の修正**: `areaSlug` に `normalizeAreaName` の戻り値をそのまま使わず、`normalizeShopName(normalizeAreaName(store.areaName) || store.areaName)` のように正規化を通すことで、新IDからも中黒と非ASCII文字を除去すること。これにより例えば `shop-ワーフカフェ-サンフランシスコエリア`（ASCII寄り）のようなIDになる。
3. **shop-店舗未確認のURL対応**: `shop-店舗未確認` がlinkの `href` として残っている場合（ロンバーズ・ランディング™ 前テラス等）、これも `resolveStoreDisplayIds` で新IDを取得して解消されていることを本番で確認すること。

### 推奨（必須ではないが品質向上）

4. 衝突グループ5件（`shop-1tt48e8` × 8、`shop-店舗未確認` × 2、`shop-bie1ke` × 2、`shop-56paaa` × 2、`shop-10vzio0` × 2）がすべて解消されていることを、本番URL取得によって一覧形式で確認して報告すること。

---

## 7. 既存機能破壊への影響

本番が修正前状態と同一のため、既存機能破壊も確認できない。ただし diff の構造上（変更2ファイルのみ、既存ロジックへの変更は `buildStoresFromFoods` 末尾と `findStoreById` のみ）、ホームv1.2・area-detail-v1.1・i18n Phase 2D-C/Dへの破壊リスクは低いと判断する。デプロイ後の再確認時に `/`・`/areas`・`/areas/[id]`・`/eaten`・`/settings` の動作確認も含めること。

---

## 8. 次のステップ

1. Vercelデプロイ完了を確認の上、`/stores` 一覧の本番URLを再取得して重複の有無を確認する。
2. 本番で依然として重複が残る場合は `resolveStoreDisplayIds` のデバッグ（実行されているか、idCounts が正しいか）を行う。
3. 本番で重複が解消されていた場合でも、`createUniqueStoreDisplayId` の `areaSlug` に中黒が含まれる問題と `shop-店舗未確認` URL問題について、条件付き承認の上で修正依頼するか、次バージョンの改善課題として扱うかを判断する。
4. 上記確認後、再提出を受けて再レビューを行う。
