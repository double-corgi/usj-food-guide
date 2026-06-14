# Design Review — area-detail-v1.1 実装後レビュー

レビュー日: 2026-06-14
レビュー担当: Claude（プロダクト責任者 / UX / UIデザイナー）
対象: Codexによる docs/codex-goal-area-detail-v1.1.md の実装（`/areas/[id]` 販売場所dedupe＋P3小修正）
確認方法: 改修後コード全文確認（app/areas/[id]/page.tsx・area-collection-summary.tsx・area-food-status-lists.tsx）、**本番URL（/areas/area-olb56e）への独立アクセスによる反映確認**。

本レビューは評価のみ。コード変更・実装・git操作は行っていない。

---

## 1. 総合判定: **条件付き承認**

コード実装そのものは設計書（codex-goal-area-detail-v1.1.md）の意図に忠実で、P2の店舗名dedupeロジック・代表行選定・P3-1（0品時の右側ブロック非表示）・P3-2（販売終了0品セクションの非表示）のいずれも、コードレベルでは正しく実装されている。

しかし、**本番URL（/areas/area-olb56e）への独立アクセスでは、これら3点の修正が一切反映されていない**。メルズ・ドライブインは依然×3、スタジオ・スターズ・レストランは×2、ビバリーヒルズ・ブランジェリーは×2のまま表示され、「0 / 37 コンプ率 0%」も「販売終了フード0品」セクションも従来どおり表示されている。Codexの報告（lint/typecheck/build成功・Vercel 200 OK・push成功・commit 0bdcb84）と、本番の実際の表示内容が一致していない。

コードは正しいため**全面的な不承認とはしない**が、**本番が修正後のコードで配信されていることの再確認**ができるまでは最終承認としない。

---

## 2. コードレベルのレビュー（P2）

### 販売場所dedupeの方式

```ts
function buildAreaShopRows(foods: FoodWithRelations[]) {
  const rows = new Map<string, AreaShopRow>();
  for (const food of foods) {
    const locations = food.locations?.length ? food.locations : [foodToLocation(food)];
    for (const location of locations) {
      if (!isDisplayableShopName(location.shopName)) continue;
      const key = normalizeShopName(location.shopName);
      const current = rows.get(key);
      const next = {
        key,
        name: location.shopName.trim(),
        type: location.shopType,
        href: location.shopId ? `/stores/${location.shopId}` : undefined
      };
      rows.set(key, pickRepresentativeShopRow(current, next));
    }
  }
  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function normalizeShopName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function pickRepresentativeShopRow(current: AreaShopRow | undefined, next: AreaShopRow) {
  if (!current) return next;
  if (!current.href && next.href) return next;
  if (current.href && !next.href) return current;
  if (!isKnownShopType(current.type) && isKnownShopType(next.type)) return next;
  return current;
}
```

判定: ✅ 設計書の指示通り。

- dedupeキーを `shopId` から「正規化した店舗名」（NFKC正規化＋trim＋空白統一）に変更している。指定どおりUI表示専用ロジックに限定されており、`shopId`・データ・repositories・generated JSONには手を入れていない。
- 代表行選定（`pickRepresentativeShopRow`）は「`/stores/[id]` リンクあり」を優先し、リンク有無が同等なら「種別が `unknown` でない行」を優先する、という設計書の優先順位を満たしている。
- ヘッダーの「◯か所」も `shops.length`（dedupe後の配列長）を使っており、件数表示も正規化後の値になる。

ロジック自体はメルズ・ドライブイン／スタジオ・スターズ・レストラン／ビバリーヒルズ・ブランジェリーのいずれも、同名であれば1キーに集約されるはずであり、コードとしては重複解消が期待できる実装になっている。

---

## 3. コードレベルのレビュー（P3）

### P3-1: 銘板の数字三重表示の軽減（area-collection-summary.tsx）

```tsx
{completion.eaten > 0 ? (
  <p className="shrink-0 text-right text-sm font-black text-[#071b3a]">
    {completion.eaten} / {completion.total}
    <span className="block text-[11px] text-slate-500">コンプ率 {completion.rate}%</span>
  </p>
) : null}
```

判定: ✅ 設計書の指示通り。

- `completion.eaten === 0` のときのみ右側の「{eaten}/{total} コンプ率{rate}%」ブロックを非表示にしている。
- `completion.eaten >= 1` の通常表示は変更されておらず、`uneaten === 0`（コンプリート分岐）・`completion.total === 0`（確認中分岐）のレイアウトも未変更。
- 「このエリアであと◯品」と下部の「食べた {eaten} / 販売中 {total}品（登録分）」は両方の場合とも維持されている。

### P3-2: 販売終了0品セクションの非表示（area-food-status-lists.tsx）

```tsx
{endedFoods.length > 0 ? (
  <details className="border-y border-[#eadcc8] py-4">
    ...
  </details>
) : null}
```

判定: ✅ 設計書の指示通り。

- `endedFoods.length === 0` のときセクション全体（`<details>` ごと）が非レンダリングになっている。1件以上のときの表示・挙動は未変更。

### P3-3: 価格疑義（¥25,000）

判定: ✅ 不変。

- 「スタジオ・スターズ 25周年スペシャルプレート ￥25,000」のデータは変更されておらず、価格推測・修正は行われていない。指示どおりデータ監査トラックに残されている。

---

## 4. 本番URL確認（最重要・問題あり）

`https://new-app-chi-rosy.vercel.app/areas/area-olb56e`（ハリウッド・エリア）に独立アクセスして確認した結果、以下のとおり**コードの修正内容が本番に反映されていない**。

| 項目 | コード上の期待 | 本番での実際 | 判定 |
|---|---|---|---|
| 銘板の右側ブロック（`completion.eaten===0`時） | 非表示 | 「0 / 37 コンプ率 0%」が表示されたまま | ❌ |
| 販売終了フード0品セクション | 非レンダリング | 「販売終了フード0品 / このエリアに販売終了フードはありません。」が表示されたまま | ❌ |
| メルズ・ドライブイン | 1行 | 3行（shop-1tt48e8 / shop-1yvdndz / shop-メルズ・ドライブイン） | ❌ |
| スタジオ・スターズ・レストラン | 1行 | 2行（shop-c8yjbq / shop-スタジオ・スターズ・レストラン） | ❌ |
| ビバリーヒルズ・ブランジェリー | 1行 | 2行（shop-152bmpp / shop-ビバリーヒルズ・ブランジェリー） | ❌ |
| 「◯か所」件数 | dedupe後の件数 | 「19か所」（dedupe前と同じ件数のまま） | ❌ |

これは前回（v1）レビュー時に確認した重複と**完全に同一**であり、変化が見られない。

考えられる原因（コードを読んだだけでは判別不能なため、Codexによる再確認が必要）:

1. push済みのcommit（0bdcb84）が本番ドメイン（`new-app-chi-rosy.vercel.app`）のVercelデプロイに反映されていない（別のデプロイ/ブランチ向け、もしくはまだビルド完了していない）。
2. `revalidate = 3600`（ISR）のキャッシュにより、新デプロイ後も古いHTMLが配信されている（通常は新デプロイでキャッシュは更新されるはずだが、念のため確認要）。
3. 報告された「Vercel主要ページ: 200 OK」はHTTPステータスのみの確認であり、**内容（実際のHTML）までは確認されていない**可能性がある。

---

## 5. その他の確認結果

### area-detail-v1の見た目の維持

`/areas/area-olb56e` の本番表示で以下を確認:

- エリア写真ヒーロー: ✅ 維持
- ウォーム紙背景・Gold/Navy: ✅ 維持（テーマカラー `#071b3a` 等変化なし）
- 「このエリアであと◯品」: ✅ 維持（「このエリアであと 37品」表示）
- まず食べたい3品（非順位表現）: ✅ 維持
- /foodsへの導線（「残りをすべて見る → /foods?area=…&sale=active&sort=uneaten」）: ✅ 維持
- 取得済みGoldスタンプ・未食の微抑制: コード上 `area-eaten-foods.tsx` / `area-food-status-lists.tsx` の該当クラス（`saturate-[0.88] brightness-[1.03]`、Goldリング）は変更されておらず維持と判断

### スコープ違反の有無

- ホームv1.2・/areas一覧・/foods・/eaten・/stores: 本番トップナビ・フッターのリンク構成に変化なし。今回の変更ファイルは `app/areas/[id]/page.tsx`・`components/area-collection-summary.tsx`・`components/area-food-status-lists.tsx` の3点のみと判断でき、スコープ外ファイルへの変更の兆候はない。
- データ本体・DB・repositories・generated JSON・localStorage schema: コード上、`lib/repositories/*`・`lib/food-utils.ts`・`lib/use-food-logs.ts`・`lib/local-user-data.ts`・`lib/area-images.ts` への変更なし。

### 禁止UIの復活

- 統計カード4連発・Area Memory/Missing Foods/Archive Foodsラベル・#1/#2/#3バッジ・販売場所チップ壁・埋め込みFoodGrid: 本番HTML・コードのいずれにも出現なし。✅ 復活なし。

---

## 6. 結論と次のアクション

実装コード自体は `codex-goal-area-detail-v1.1.md` の指示に忠実で、P2（店舗名dedupe）・P3-1（銘板の三重表示軽減）・P3-2（販売終了0品セクションの非表示）のいずれも正しく書かれている。禁止事項・スコープ違反・禁止UIの復活もない。

**条件**: 本番URL（`/areas/area-olb56e`）で、以下が実際に解消されていることを再確認すること。

- メルズ・ドライブインが1行になっている
- スタジオ・スターズ・レストランが1行になっている
- ビバリーヒルズ・ブランジェリーが1行になっている
- 「◯か所」の件数がdedupe後の値になっている
- `completion.eaten===0` のエリアで右側「0/◯ コンプ率0%」ブロックが非表示になっている
- 「販売終了フード0品」セクションが非表示になっている

この再確認（最新デプロイの反映確認、必要なら再デプロイ）が取れた時点で**承認**に切り替え可能。再確認ができない、または再デプロイ後も反映が確認できない場合は、デプロイ起因の問題として別途調査が必要。

修正用 /goal は本レビューでは作成しない。
