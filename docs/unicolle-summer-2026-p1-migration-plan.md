# ユニコレ 2026年夏アップデート P1 migration plan

## 対象migration

- `supabase/migrations/20260706_summer_2026_collection_foundation.sql`

## 目的

季節コレクションと価格バリエーションを、既存の `food.id` と食べた記録を維持したまま追加する。

## 追加内容

- `public.collections`
  - `summer-2026` を初期データとして登録
  - 25周年特集も将来同じ構造へ移せるよう、`season_type='anniversary'` を許可
- `public.foods`
  - `collection_id`
  - `published_at`
  - `review_status='draft'` を許可
- `public.food_variants`
  - `label`
  - `price`
  - `is_default`
  - `sort_order`
  - `source_url`
  - `last_checked_at`
- triggers
  - 初めて `approved` になった時だけ `published_at` を自動設定
  - default variant の `price` を `foods.price` へ同期

## 本番適用手順

1. Supabase SQL Editorを開く。
2. `supabase/migrations/20260706_summer_2026_collection_foundation.sql` のSQL全文を貼り付ける。
3. 実行前に、`public.foods` と `public.food_variants` のバックアップ方針を確認する。
4. SQLを実行する。
5. 以下を確認する。

```sql
select * from public.collections where id = 'summer-2026';
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'foods' and column_name in ('collection_id', 'published_at');
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'food_variants' and column_name in ('label', 'price', 'is_default', 'sort_order', 'source_url', 'last_checked_at');
select conname from pg_constraint where conrelid = 'public.foods'::regclass and conname = 'foods_review_status_check';
```

## 本番適用前チェックリスト

- 本番DBへ直接データ登録しない。
- 既存 `food.id` を変更しない。
- 既存 `UserFoodLog` とlocalStorageキーを変更しない。
- 既存approved商品へ推測の `published_at` を入れない。
- `food_variants` は価格・容器・サイズ違いのために使い、別food登録を増やさない。
- 既存25周年表示はP1では強制移行しない。

## ロールバック方針

P1のmigrationは既存行を削除しない。問題が起きた場合は、アプリ側で新項目を参照しない状態に戻す。
DBを戻す必要がある場合は、実行前バックアップから復元する。手動で列やテーブルをdropする場合は、事前に以下の影響を確認する。

- `collections` をdropすると、将来の `foods.collection_id` 参照が消える。
- `food_variants` をdropすると、価格バリエーションの履歴が消える。
- `published_at` をdropすると、新着判定の基準が消える。

## P2へ進む前の注意

- 管理画面UIでは、夏メニュー登録時に `collection_id='summer-2026'` を明示的に保存する。
- 公開ゲートでは `review_status='approved' && hidden=false` を維持する。
- `published_at` は初回公開日時だけに使い、`created_at` を新着判定へ戻さない。
- default variant がある場合は、保存時に `foods.price` と同期する。
