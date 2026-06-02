insert into public.areas (id, name, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'ハリウッド・エリア', 1),
  ('10000000-0000-0000-0000-000000000002', 'ニューヨーク・エリア', 2),
  ('10000000-0000-0000-0000-000000000003', 'ジュラシック・パーク', 3),
  ('10000000-0000-0000-0000-000000000004', 'ミニオン・パーク', 4),
  ('10000000-0000-0000-0000-000000000005', 'ウィザーディング・ワールド', 5)
on conflict (name) do update set sort_order = excluded.sort_order;

insert into public.shops (id, area_id, name, type, official_url, is_active) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'スタジオ・スターズ・レストラン', 'restaurant', 'https://www.usj.co.jp/', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'ニューヨーク・フードカート', 'cart', 'https://www.usj.co.jp/', true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'ジュラシック・スナックワゴン', 'wagon', 'https://www.usj.co.jp/', true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'ミニオン・ハッピー・キッチン', 'cart', 'https://www.usj.co.jp/', true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '三本の箒', 'restaurant', 'https://www.usj.co.jp/', true)
on conflict (area_id, name) do update set
  type = excluded.type,
  official_url = excluded.official_url,
  is_active = excluded.is_active;

insert into public.foods (
  id, shop_id, area_id, name, normalized_name, category, price, description,
  official_url, source_url, start_date, end_date, status, is_limited,
  confidence_score, extraction_source_count, review_status, hidden, manual_override, last_checked_at
) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'スターズ・バーガーセット', 'スターズバーガーセット', 'set', 1850, 'パーク散策前の腹ごしらえ向けのサンプルセットメニューです。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', null, null, 'active', false, 100, 1, 'approved', false, false, now()),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'ベリークリーム・チュリトス', 'ベリークリームチュリトス', 'churro', 700, '片手で食べやすい甘酸っぱいチュリトスのサンプルです。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', '2026-05-01', '2026-08-31', 'active', true, 100, 1, 'approved', false, false, now()),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'ダイナソー・ターキーレッグ', 'ダイナソーターキーレッグ', 'chicken', 1250, '食べ歩きしやすい骨付き肉のサンプルメニューです。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', null, null, 'active', false, 100, 1, 'approved', false, false, now()),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'バナナキャラメル・ポップコーン', 'バナナキャラメルポップコーン', 'popcorn', 600, '甘い香りのポップコーンを想定したサンプルです。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', null, null, 'active', false, 100, 1, 'approved', false, false, now()),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '魔法界のクリーミードリンク', '魔法界のクリーミードリンク', 'drink', 850, '泡の口当たりが楽しいドリンクのサンプルです。公式名称ではありません。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', null, null, 'active', false, 100, 1, 'approved', false, false, now()),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'サマー・トロピカルパフェ', 'サマートロピカルパフェ', 'seasonal', 980, '近日登場メニューの表示確認用サンプルです。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', '2026-07-01', '2026-09-15', 'scheduled', true, 100, 1, 'approved', false, false, now()),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'ウィンター・ココア', 'ウィンターココア', 'dessert', 780, '終了メニューの表示確認用サンプルです。', 'https://www.usj.co.jp/', 'https://www.usj.co.jp/', '2025-11-01', '2026-02-28', 'ended', true, 100, 1, 'approved', false, false, now())
on conflict (shop_id, normalized_name) do update set
  category = excluded.category,
  price = excluded.price,
  description = excluded.description,
  official_url = excluded.official_url,
  source_url = excluded.source_url,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  is_limited = excluded.is_limited,
  confidence_score = excluded.confidence_score,
  extraction_source_count = excluded.extraction_source_count,
  review_status = excluded.review_status,
  hidden = excluded.hidden,
  last_checked_at = excluded.last_checked_at;

insert into public.food_images (food_id, image_url, source_type, source_url, enabled) values
  ('30000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true),
  ('30000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true),
  ('30000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true),
  ('30000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true),
  ('30000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true),
  ('30000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true),
  ('30000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=1200&q=80', 'placeholder', 'https://unsplash.com/', true);
