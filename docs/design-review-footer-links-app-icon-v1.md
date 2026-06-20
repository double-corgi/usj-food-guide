# 設計レビュー証跡: フッターリンク整理・フッターアイコン修正

- **対象commit**: `d27cea5eafcdc5c8cadf33e0a5e1d2befa00723e`
- **commit message**: `fix: refine footer links and app icon`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat d27cea5` → **2 files changed, 5 insertions(+), 5 deletions(-)**

### `components/app-footer.tsx`
- `footerPrimaryLinks` から `/contact`（footer.contact）を削除
- `/disclaimer`・`/privacy` の並び順を整理（末尾2件を入れ替え）
- `footerSupportLinks` の先頭に `/contact`（footer.contact）を追加

### `components/brand-mark.tsx`
- 画像を `/icons/app-icon.svg` → `/icons/app-icon-512.png` に変更
- コンテナ: `bg-[#f7d47b]`（金）→ `bg-white p-0.5`、角丸 `rounded-xl` → `rounded-[1.05rem]`
- 画像に `rounded-[0.85rem]` を追加（`object-contain` / `aspect-square` は維持）

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが app-footer.tsx と brand-mark.tsx のみか | ✅ | `git show --stat` で2ファイルのみ |
| 2 | フッター主要リンクから「お問い合わせ」が外れているか | ✅ | `footerPrimaryLinks` から `footer.contact` を削除 |
| 3 | 「お問い合わせ」が補助リンク側に整理されているか | ✅ | `footerSupportLinks` 先頭に `/contact` を移動 |
| 4 | 「発見報告」がCTAまたは主要導線として維持されているか | ✅ | フッターCTAの `/request`（footer.report）ボタン＋ `footerPrimaryLinks` の `/request` の双方で維持 |
| 5 | フッターリンクが下部ナビと過剰に重複していないか | ✅（補足あり） | 下部ナビは `/ /foods /eaten /areas /stores`。フッターと重複するのは foods/areas/stores/eaten で**本commit以前から存在**し、本変更で増えていない。フッターが主要導線を再掲するのは一般的。下記「補足」参照 |
| 6 | 既存ページがないリンクを新規追加していないか | ✅ | 並べ替え・移動のみで新規href追加なし。全リンク先（contact/privacy/disclaimer/settings/terms/security/commercial-disclosure/about/request/eaten/foods/areas/stores）の `app/*/page.tsx` 実在を確認 |
| 7 | フッターアイコンが正しいアプリアイコン寄りになっているか | ✅ | 実アプリアイコン `app-icon-512.png` を使用。白背景＋角丸で実機アイコンに近い表示 |
| 8 | `/icons/app-icon-512.png` の使用が妥当か | ✅ | `public/icons/app-icon-512.png`（2,588B、Jun 9 のデプロイ準備commitで既出）実在。新規生成ではなく既存資産の参照 |
| 9 | アイコンが不自然に切れない表示か | ✅ | `aspect-square` + `object-contain` + `p-0.5` パディング + 内側角丸。縦横比保持で見切れ回避 |
| 10 | 新規画像生成・画像追加・外部画像取得がないか | ✅ | diff に画像ファイル追加なし。既存PNG参照のみ。外部URL不使用 |
| 11 | ヘッダーが変更されていないか | ✅ | diff に `app-header.tsx` なし。`BrandMark` 使用箇所はフッターのみで、ヘッダーへ波及なしを確認 |
| 12 | 下部ナビが変更されていないか | ✅ | 下部ナビ（app-header.tsx 内 `navItems`）は無変更 |
| 13 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | 変更は2コンポーネントのみ。使用翻訳キー（footer.contact/disclaimer/privacy/report 等）はすべて既存 |
| 14 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告で全成功。変更が className・リンク並べ替え・画像パスのみのため整合 |
| 15 | Food/Store Coverage が期待値から変化していないか | ✅ | 翻訳データ非変更のため変動なし。期待値と整合 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat d27cea5` / `git show d27cea5` → 全diff を直接確認
- `ls -la public/icons/app-icon-512.png` + `git log -1 -- public/icons/app-icon-512.png` → 既存資産（Jun 9）であることを確認
- `for p in ...; do [ -e app/$p/page.tsx ]` → 全フッターリンク先のページ実在を確認
- `grep navItems components/app-header.tsx` → 下部ナビ項目（/ /foods /eaten /areas /stores）を確認、無変更
- `grep -rln "BrandMark"` → 使用箇所がフッターのみ（ヘッダー非波及）を確認

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **フッターと下部ナビの重複（既存）**
   `/foods`・`/areas`・`/stores`・`/eaten` はフッター主要リンクと下部ナビで重複している。ただしこれは本commit以前からの状態で、本変更が重複を増やしたものではない。フッターが主要導線を再掲するのは一般的なパターンであり、対応は任意。整理する場合は別途スコープで検討。

2. **アイコンコンテナの背景色変更**
   金背景（`#f7d47b`）→白背景に変更された。`app-icon-512.png` 自体が背景を内包しているため白＋パディングで見切れを避ける妥当な調整。`BrandMark` の利用箇所はフッターのみのため、他画面への意図しない影響はない。

3. **旧 `app-icon.svg` は削除されていない**
   参照が外れた `public/icons/app-icon.svg` はそのまま残存。未参照アセットだが本commitの責務外であり、削除要否は別途判断でよい。

---

## 結論

変更は対象2ファイルに限定され、(1) お問い合わせを主要→補助リンクへ移動、(2) 発見報告をCTA＋主要導線で維持、(3) フッターアイコンを既存の実アプリアイコン（app-icon-512.png）へ、見切れしない表示で差し替え、という指示を過不足なく実装。ヘッダー・下部ナビ・翻訳データ・生成JSON・DB/crawler への副作用なし。リンク先ページの実在も全件確認済み。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
