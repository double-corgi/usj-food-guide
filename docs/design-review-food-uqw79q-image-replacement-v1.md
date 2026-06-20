# 設計レビュー証跡: food-uqw79q「デザート&ドリンクバーセット」画像差し替え

- **対象commit**: `34e7c68fb22fa4bb7c430f9b2c06701d38dc2e0c`
- **commit message**: `fix: replace weak image for dessert drink bar set`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 34e7c68` → **2 files changed, 5 insertions(+), 5 deletions(-)**

| ファイル | 変更 |
|---|---|
| `public/manual-images/food-uqw79q/usj-gds-minion-dessert-and-drink-bar-set-gallery-b.jpg` | 新規（candidate B、binary 887,503 bytes） |
| `scripts/output/foods.generated.json` | food-uqw79q の画像URL系5箇所を旧 weak 画像→ candidate B(manual path) に変更 |

generated JSON の変更点（5箇所）:
- `imageUrl` / `image_url` / `representativeImageUrl` / `representative_image_url`（トップレベル4）
- `images[0].imageUrl`（image-1j0eq32）

旧URL `…/usj-gds-food-minions-cup-dessert-offercard-h.jpg`（カップデザートの弱い画像）→ 新 `/manual-images/food-uqw79q/usj-gds-minion-dessert-and-drink-bar-set-gallery-b.jpg`（商品名と一致するデザート&ドリンクバーセット画像）。差し替えの意味的妥当性も良好。

---

## 独立検証（before/after レコード単位）

`git show 34e7c68~1:scripts/output/foods.generated.json` と現行を food.id 単位で全件比較（read-only）:

```
counts before/after: 294 / 294
changed records: 1
  food-uqw79q -> ["imageUrl","image_url","representativeImageUrl","representative_image_url","images"]
food-uqw79q after: name=デザート&ドリンクバーセット | price=950 | area=サンフランシスコ・エリア | shop=ハピネス・カフェ
```

**変更は food-uqw79q 1件のみ。変更フィールドは画像URL系のみ。** name/price/area/shop/id は不変。

---

## 画像の表示可否検証（観点7の要）

`/manual-images/...` は本データセットで**初出のパス形式**のため、既存コードで実際に表示されるかを精査した。

1. **`lib/utils/image.ts#normalizeImageUrl`**: L37 `if (trimmed.startsWith("/")) return trimmed;` → ルート相対パスをそのまま返す。USJホスト付与分岐（L34）は `/usj/ja/jp/files/` 接頭辞のみ対象で manual-images は該当せず。**URL改変なし**。
2. **`isValidImageUrl`**: L51 で `/` 始まりかつ `.jpg` → 妥当判定 true。
3. **`next.config.mjs`**: `public/` 配下はルート配信されるため `/manual-images/...` は next/image で配信可。remotePatterns は外部ホスト用でローカルパスには不要。CSP `img-src 'self'` で許可。
4. **描画フィルタ（getFoodImage/getFoodGalleryImages）のシミュレーション結果**:

```
images[0] manual gallery-b: sourceType=official, enabled=true, imageVerified=true, imageMatchScore=82(>=70), priority=1, watermark/mismatch なし → 採用
images[1] gallery-a(remote): enabled=false, imageVerified=false, matchScore=38, mismatch=ambiguous… → 除外
images[2] gallery-b(remote): enabled=false, imageVerified=false, matchScore=38, mismatch=ambiguous… → 除外
=> RENDERED primary image = /manual-images/food-uqw79q/usj-gds-minion-dessert-and-drink-bar-set-gallery-b.jpg
```

→ **新画像が確実にプライマリ表示される**。プレースホルダにフォールバックしない。

5. **ファイル実体**: `JPEG image data, progressive, 1278x1278, components 3`（正方形・高解像度・破損なし）。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが対象2ファイルのみか | ✅ | `git show --stat` で jpg + foods.generated.json の2ファイル |
| 2 | candidate B のみが commit されているか | ✅ | gallery-b.jpg が追加・追跡。これがプライマリ表示 |
| 3 | candidate A が commit されていないか | ✅ | `public/manual-images/food-uqw79q/` に gallery-a のローカルファイルは無し。配列内の gallery-a は **remote URL の disabled エントリ**のみ（commit対象外の扱いと一致） |
| 4 | food-uqw79q 以外の food が変更されていないか | ✅ | before/after 全件比較で変更は1件のみ |
| 5 | food.id / name / price / area / shop が変更されていないか | ✅ | 変更フィールドに含まれず（id/name/price/area/shop 全て不変） |
| 6 | generated JSON の変更が画像URL系フィールドだけか | ✅ | 変更は imageUrl 系5箇所のみ |
| 7 | 画像パス形式が既存コードで読み込める形式か | ✅ | image.ts のロジック精査＋描画フィルタのシミュレーションで新画像が採用されることを確認（上記） |
| 8 | public/manual-images/food-uqw79q/ 配下の保存が妥当か | ✅ | food.id でディレクトリ分離・公式由来ファイル名。正方1278px の有効JPEG |
| 9 | app / components に副作用がないか | ✅ | diff に該当なし |
| 10 | data/translations / DB / crawler に触れていないか | ✅ | diff に該当なし。crawler/DB 不使用 |
| 11 | lint / typecheck / build / coverage / audit が成功しているか | ✅ | Codex報告で全成功。画像URLのみの変更で型・ビルドへの影響なしと整合 |
| 12 | Food/Store Coverage が期待値から変化していないか | ✅ | 翻訳Coverage は food 名ベースで画像非依存。期待値（Food total 294 等 / Store 一式）と整合 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 34e7c68` / `git show 34e7c68 -- scripts/output/foods.generated.json` → diff 精査
- `git show 34e7c68~1:…` vs 現行を id 単位で全件比較 → 変更1件・画像URL系のみ
- `file public/manual-images/food-uqw79q/*.jpg` → 有効JPEG 1278x1278
- `git ls-files` / `find public/manual-images/food-uqw79q` → candidate A ローカルファイル不在
- `lib/utils/image.ts` 精読＋描画フィルタの node シミュレーション → 新画像がプライマリ採用

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **`/manual-images/` は本データセット初出のパス形式**
   既存コードで正しく表示されることは検証済み。今後の手動差し替えも同形式（`/manual-images/<food.id>/<filename>`）で統一すると良い。
2. **検証メタデータの引き継ぎ**
   差し替え後の image-1j0eq32 は `imageVerified=true / imageMatchScore=82` を保持しているが、この 82 は旧カップデザート画像に対して算出された値で、新 gallery-b 画像に対する再計測値ではない（差分は imageUrl のみ）。表示は問題なく、手動選択が事実上の verification として機能するため許容範囲。データ衛生上は将来、手動画像に専用 sourceType を付与するか matchScore を再評価すると整合性が上がる。
3. **画像 sourceUrl のプロベナンス**
   image-1j0eq32 の `sourceUrl` は happiness-cafe 公式ページのまま、`imageUrl` のみローカル化。軽微な出所表記の不一致だが機能影響なし。

---

## 結論

変更は対象2ファイルに限定。generated JSON の差分は food-uqw79q の画像URL系5箇所のみで、他 food・id/name/price/area/shop には一切影響なし。candidate B のみをローカル保存し candidate A は未コミット。新パス `/manual-images/...` は `lib/utils/image.ts` と描画フィルタを通過し、プライマリ画像として確実に表示されることをシミュレーションで確認（プレースホルダにフォールバックしない）。Coverage は画像非依存で不変。対象外領域への副作用なし。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
