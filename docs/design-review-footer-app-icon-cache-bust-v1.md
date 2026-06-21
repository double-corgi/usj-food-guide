# 設計レビュー証跡: フッターアプリアイコンのキャッシュ回避修正

- **対象commit**: `4abe93e288586aac6f696a729830c4ae3acd6182`
- **commit message**: `fix: use cache-busted footer app icon`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-21
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 4abe93e` → **2 files changed, 1 insertion(+), 1 deletion(-)**

| ファイル | 変更 |
|---|---|
| `public/icons/app-icon-unicole-512.png`（新規） | 512×512 PNG（429,666 bytes） |
| `components/brand-mark.tsx` | img src を `/icons/app-icon-512.png` → `/icons/app-icon-unicole-512.png` に変更（他の class は不変） |

```diff
-      <img src="/icons/app-icon-512.png" alt="" className="h-full w-full object-cover" />
+      <img src="/icons/app-icon-unicole-512.png" alt="" className="h-full w-full object-cover" />
```

---

## 白枠問題の根本原因とキャッシュ回避の検証

経緯を git 履歴で確認:
- 旧 `app-icon-512.png` は元々 ~2,588 bytes（ほぼ空＝**白枠の原因**）。
- 直前commit `3aed588 "fix: replace footer app icon asset"` が **同名のまま**中身を正しいアイコン(429,666 bytes)へ差し替え → しかし**同一ファイル名のためブラウザ/CDN キャッシュが旧（空）画像を配信し続け**、白枠が残存。
- 本commit `4abe93e` が**新ファイル名** `app-icon-unicole-512.png` を追加し参照を切替 → URL が変わることでキャッシュを確実に回避。

新旧アセットの実体検証:
- `cmp app-icon-512.png app-icon-unicole-512.png` → **IDENTICAL**（バイト完全一致）。
- すなわち新ファイルは「現行の正しいアイコン(app-icon-512.png)」の**複製を別名で配置**したもの。新規生成・外部取得・加工ではない。
- 画像解析: `512×512 RGBA`、平均色 (163,157,131)、near-white 割合 0.01（≒空白ではなく実コンテンツあり）。

→ **「正しいアイコン内容」＋「新URLでキャッシュ回避」**の二点で白枠問題が解消される。論理的に妥当。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更が brand-mark.tsx と app-icon-unicole-512.png のみか | ✅ | `git show --name-only` で2ファイル |
| 2 | BrandMark が `/icons/app-icon-unicole-512.png` を参照しているか | ✅ | diff で確認 |
| 3 | 旧 `/icons/app-icon-512.png` を参照していないか | ✅ | brand-mark からの参照は消失（※layout の PWA metadata では引き続き使用＝正） |
| 4 | 新画像が 512×512 の有効PNGか | ✅ | `file`＝PNG 512×512 8-bit RGBA、429,666 bytes |
| 5 | フッターで白枠ではなくアイコンが表示されるか | ✅ | 新ファイルは実アイコン内容（near-white 0.01）＋新URLでキャッシュ回避 |
| 6 | アイコンが切れていないか | ✅ | `object-cover`＋正方画像×正方容器＝トリミングなし |
| 7 | フッターレイアウトが崩れていないか | ✅ | 変更は img src のみ。容器/class 不変 |
| 8 | ヘッダーに意図しない影響がないか | ✅ | BrandMark は app-footer 専用（grep確認）。ヘッダー無関係 |
| 9 | 広告枠を変更していないか | ✅ | ad-slot.tsx 等 diff になし |
| 10 | 画像生成・外部取得・加工をしていないか | ✅ | 新ファイルは既存リポ資産とバイト完全一致＝複製。生成/取得/加工ツールの痕跡なし |
| 11 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | diff になし |
| 12 | package.json を変更していないか | ✅ | diff になし |
| 13 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告。アセット＋src変更のみで整合 |
| 14 | Food/Store Coverage が期待値から変化していないか | ✅ | UI/アセットのみ。期待値と整合 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 4abe93e` / `git show 4abe93e -- components/brand-mark.tsx` → diff
- `file` / `ls -la` → 新画像 512×512・429,666 bytes
- `git log -- public/icons/app-icon-512.png` → 直前 3aed588 で同名差し替えが行われた経緯
- `cmp app-icon-512.png app-icon-unicole-512.png` → IDENTICAL（複製＝生成/加工でない裏付け）
- Python(PIL) で平均色・near-white 割合 → 実コンテンツあり（空白でない）
- `grep -rn BrandMark` → footer 専用（ヘッダー非波及）
- `git status` → クリーン

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **同一画像が2ファイル重複**: `app-icon-512.png`（PWA metadata 用）と `app-icon-unicole-512.png`（フッター用）がバイト完全一致で並存（各 ~429KB）。キャッシュ回避の手段として有効だが、将来的にはクエリ版管理（例 `?v=2`）の方が重複バイナリを増やさず保守的。今回は新ファイル追加で問題なし。
2. **PWA metadata 側のキャッシュ**: `app/layout.tsx`（対象外）の icons は引き続き `app-icon-512.png` を参照。内容は 3aed588 で正常化済みだが、PWA アイコンのキャッシュが残る端末では更新が遅れる可能性。フッターとは別系統のため本件の対象外だが、必要なら別途確認推奨。
3. **白枠解消は実機目視で最終確認推奨**: コード/アセット上は解消が妥当だが、キャッシュ問題は環境依存のため、本番でのハードリロード等での目視確認が望ましい。

---

## 結論

フッターアイコンの白枠は「旧 app-icon-512.png のキャッシュ（元は空画像）」が原因で、本commitは正しいアイコンの複製を新ファイル名 `app-icon-unicole-512.png` で配置し参照を切替えることで確実にキャッシュ回避。新画像は 512×512 の有効PNGで実コンテンツあり、`object-cover` で切れなし。変更は対象2ファイルに限定、ヘッダー・広告・翻訳・generated JSON・package.json への副作用なし、Coverage 不変。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
