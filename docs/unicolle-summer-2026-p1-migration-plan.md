# UNICOLLE 2026 Summer P1 Migration Plan

## 対象migration

- `supabase/migrations/20260706_summer_2026_collection_foundation.sql`

## 前提

本番Supabaseの `public` schemaにはDB側のfoodsテーブルは存在しない。
フード表示は次の3系統をアプリ側で統合している。

- `scripts/output/foods.generated.json`
- `public.manual_foods`
- `public.food_overrides`

そのため、P1の季節コレクション基盤はDB側のfoodsテーブルを参照しない。
generated food / manual food のどちらも `food_id text` で紐付ける。

## 追加・更新する構造

### `public.collections`

季節特集を保存する。

- `id`
- `name`
- `season_type`
- `starts_on`
- `ends_on`
- `accent_color`
- `is_featured`
- `sort_order`
- `created_at`
- `updated_at`

初期データ:

- `id`: `summer-2026`
- `name`: `2026 サマーコレクション`
- `season_type`: `summer`
- `accent_color`: `#38b6c9`
- `is_featured`: `true`

### `public.food_collection_memberships`

foodとcollectionを紐付ける。

- `food_id text`
- `collection_id text references public.collections(id)`
- `created_at`
- primary key: `(food_id, collection_id)`

`food_id` は generated food と manual food の両方を受けるため、DB側のfoodsテーブルへのFKは張らない。

### `public.food_publication_metadata`

generated food / manual food に共通で、公開状態と初回公開日時を持たせる補助テーブル。

- `food_id text primary key`
- `review_status text check ('draft','pending','approved','rejected')`
- `published_at timestamptz`
- `created_at`
- `updated_at`

既存approved商品へ推測の `published_at` は入れない。
`review_status` が初めて `approved` になった時だけ、triggerで `published_at` を設定する。

### `public.food_variants`

価格違い・サイズ違い・容器違いを保存する。

- `id`
- `food_id text`
- `label`
- `price`
- `is_default`
- `sort_order`
- `source_url`
- `last_checked_at`
- `created_at`
- `updated_at`

DB側のfoodsテーブルへのFKは張らない。
同じ `food_id` に `is_default=true` が複数できないよう、partial unique indexを作る。

## price同期方針

DB側にはfoods本体の `price` カラムが存在しないため、DB triggerで商品本体の価格を更新しない。
アプリ側の正規化処理で、default variantがある場合は表示用 `Food.price` をdefault variantの `price` に合わせる。

実装:

- `lib/food-variants.ts`
- `lib/repositories/seasonal-food-foundation.ts`

## 適用手順

1. Supabase SQL Editorを開く。
2. `supabase/migrations/20260706_summer_2026_collection_foundation.sql` のSQL全文を確認する。
3. DB側のfoodsテーブルへの参照がないことを確認する。
4. 本番DBバックアップ方針を確認する。
5. SQL Editorでmigrationを実行する。
6. 下記の確認SQLを実行する。

## 適用後の確認SQL

```sql
select exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'foods'
) as has_db_foods_table;

select id, name, season_type, accent_color, is_featured
from public.collections
where id = 'summer-2026';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_collection_memberships'
order by ordinal_position;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_publication_metadata'
order by ordinal_position;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_variants'
order by ordinal_position;

select conname
from pg_constraint
where conrelid = 'public.food_collection_memberships'::regclass
order by conname;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('collections', 'food_collection_memberships', 'food_publication_metadata', 'food_variants')
order by tablename, indexname;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('collections', 'food_collection_memberships', 'food_publication_metadata', 'food_variants')
order by tablename, policyname;
```

期待:

- `has_db_foods_table` は `false` でも問題ない。
- `collections` に `summer-2026` が存在する。
- `food_collection_memberships.food_id` と `food_variants.food_id` にDB側のfoodsテーブルへのFKがない。
- read policy は最小限の `select` のみ。

## ロールバック方針

実データ投入前なら、以下でP1基盤だけを戻せる。

```sql
begin;
drop table if exists public.food_variants;
drop table if exists public.food_publication_metadata;
drop table if exists public.food_collection_memberships;
drop table if exists public.collections;
drop function if exists public.set_food_publication_metadata_published_at();
commit;
```

実データ投入後は、先に各テーブルをCSV等で退避してから判断する。
`manual_foods`、`food_overrides`、`food_override_revisions`、`admin_users`、`admin_auth_pkce_attempts` は削除しない。

## 本番適用前チェックリスト

- [ ] DB側のfoodsテーブルを参照していない
- [ ] generated JSONの既存内容を変更していない
- [ ] manual_foodsの既存データを変更していない
- [ ] food_overridesの既存データを変更していない
- [ ] UserFoodLog / localStorage keyを変更していない
- [ ] 夏メニュー実データを登録していない
- [ ] migrationがtransaction内で実行される
- [ ] SQLが再実行可能
- [ ] `npm run test:seasonal-foundation` が通る

## P2へ進む前の注意

- 管理画面で夏メニューを登録する時は、`food_collection_memberships` に `collection_id='summer-2026'` を保存する。
- `food_publication_metadata.published_at` は初回公開日時だけに使い、`created_at` を新着判定へ戻さない。
- `review_status='draft'` のfoodは公開商品として扱わない。
- `food_variants` は価格・容器・サイズ違いのために使い、別food登録を増やさない。
