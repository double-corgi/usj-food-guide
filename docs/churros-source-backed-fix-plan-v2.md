# Churros Source-Backed Fix Plan v2

## 1. Purpose

This plan replaces the earlier overly conservative "HOLD all churros" position with a source-backed policy:

- Restore or add only churros confirmed by USJ official pages or high-trust USJ information sources.
- Do not show products with no usable image, uncertain sale status, or suspected wrong image.
- Do not directly hand-edit generated JSON.
- Do not run crawler / DB jobs for this phase.
- Do not change translations, ads, App Store work, or unrelated foods.

This document is a design and review artifact only. No implementation is included here.

## 2. Current Data Status

Current status is based on existing generated food data and the prior review documents.

| Product | Current food.id | Current state | Why not visible / why risky | Source-backed direction |
| --- | --- | --- | --- | --- |
| サーティワン・チュリトス ～ラブポーションサーティワン～ | No separate ID found. Existing generic record: `food-udijzl` "サーティーワン・チュリトス" | `food-udijzl` is hidden, `canonicalFood=false`, `displayQuality=low`, `reviewStatus=pending`, image count 0 | The two flavors are collapsed into one generic low-quality record. No usable local image. | Add as a separate food only after official/current source snapshot and usable image are confirmed. |
| サーティワン・チュリトス ～ポッピングシャワー～ | No separate ID found. Existing generic record: `food-udijzl` "サーティーワン・チュリトス" | Same as above | Same as above | Add as a separate food only after official/current source snapshot and usable image are confirmed. |
| クロミ・チュリトス ～カシスショコラ味～ | `food-10fodl7` | Hidden, `canonicalFood=false`, `displayQuality=low`, `reviewStatus=pending`, image count 0, current price 750 | Source-backed existence is plausible, but current record lacks image and likely has stale price/location fields. | Restore only after price/location are corrected from trusted source and a usable official/manual image exists. |
| マイメロディ・チュリトス ～いちごヨーグルト味～ | `food-1sem5gf` | Hidden, `canonicalFood=false`, `displayQuality=low`, `reviewStatus=pending`, image count 0, current price 750 | Source-backed existence is plausible, but current record lacks image and likely has stale price/location fields. | Restore only after price/location are corrected from trusted source and a usable official/manual image exists. |
| ソルティキャラメルチュリトス | `food-5n9awi` | Visible, `canonicalFood=true`, `hidden=false`, `displayQuality=high`, `reviewStatus=approved`, image exists | Trusted source indicates sales pause, and app image is suspected wrong. Showing it as active risks misinformation. | Hide or mark paused until correct sale status and image are confirmed. |

## 3. Source-Backed Facts

### サーティワン・チュリトス 2種

Progress-side source claims:

- USJ official 25th anniversary food page lists the two Baskin-Robbins churros.
- Universal Market official page lists the related sales location.
- USJ official seasonal menu page lists the two flavors.
- Price: 800 yen each.
- Sales location: ユニバーサル・マーケット内ハピネス・ワゴン.

Important note:

- The earlier v1 audit treated the Baskin-Robbins churros as hold/ended based on older source interpretation.
- Before implementation, capture the current official source snapshot and confirm current sale status, image, and period.
- Do not promote the generic `food-udijzl` record directly as both flavors. The two flavors should be modeled separately if added.

### クロミ / マイメロディ チュリトス

Progress-side source claims:

- USJ official food-cart / walk-around food page confirms these products.
- Trusted USJ information sources confirm price around 850 yen.
- Sales location is around イルミネーション・シアター付近 / Hollywood catering-related food cart.

Current data risks:

- Existing records use price 750.
- Existing records have no images.
- Existing records are hidden and low-quality.

Decision:

- They are restore candidates, not immediate restore items.
- Do not display them until usable image and corrected price/location are available.

### ソルティキャラメルチュリトス

Progress-side source claims:

- Trusted source reports sales pause / unavailable status.
- Current app output is suspected to show a wrong image.

Decision:

- Hide or pause this record before public display if no correct image/status can be confirmed.
- Do not attempt image replacement in this phase.

## 4. Recommended Classification

### Add Candidates

1. サーティワン・チュリトス ～ラブポーションサーティワン～
2. サーティワン・チュリトス ～ポッピングシャワー～

Conditions before add:

- Official current source page confirms product name.
- Price is confirmed as 800 yen.
- Sales location is confirmed as ユニバーサル・マーケット内ハピネス・ワゴン.
- Sale status and period are confirmed as current/upcoming.
- Usable official image or approved manual image exists.
- Translation seed plan is prepared.

### Display Restore Candidates

1. `food-10fodl7` クロミ・チュリトス ～カシスショコラ味～
2. `food-1sem5gf` マイメロディ・チュリトス ～いちごヨーグルト味～

Conditions before restore:

- Price corrected to source-backed value if current 750 is stale.
- Sales location / area are source-backed.
- Usable image exists under a controlled manual-image path.
- `displayQuality` and `reviewStatus` are promoted only with image proof.

### Hide / Pause Candidate

1. `food-5n9awi` ソルティキャラメルチュリトス

Recommended safe action:

- Hide or mark as paused / needs review.
- Keep name, price, category, image URL, shop, and area unchanged unless a later source-backed correction is approved.
- Use an override/apply script rather than direct generated JSON edits.

## 5. Override Strategy

`data/duplicate-overrides.json` is not the right layer for this task. The target problem is visibility, sale status, image confidence, and source quality, not duplicate grouping.

Recommended new layers:

1. `data/food-visibility-overrides.json`
   - Purpose: hide/pause/promote specific food IDs with explicit reasons.
   - Initial safe use: hide `food-5n9awi`.
   - Future use: restore `food-10fodl7` and `food-1sem5gf` only after image/source requirements are met.

2. `data/food-manual-image-overrides.json`
   - Purpose: map a food ID to a vetted local manual image.
   - Use only after official/source-backed image candidate has been reviewed and placed under `public/manual-images/...`.

3. Optional source note metadata
   - If generated schema supports it, record source URL / reason notes in a non-display audit field.
   - If not supported, keep source evidence in docs only.

Required safety checks for any apply script:

- Read override definitions.
- Build expected changed ID set from the override file.
- Stop if any generated JSON diff touches an unexpected food ID.
- Stop if price/image/name/category/area/shop are changed in a visibility-only phase.
- Stop if translations, crawler output beyond the intended generated JSON file, app code, components, or public images change unexpectedly.

## 6. Minimal Fix Recommended For Codex

The safest minimal implementation is not to add/restore all four source-backed items immediately.

Recommended Phase 1:

1. Add a visibility override layer and apply script.
2. Hide or pause only `food-5n9awi` ソルティキャラメルチュリトス because it is currently visible with suspected wrong image and trusted pause signal.
3. Do not add サーティワン 2種 yet.
4. Do not restore クロミ / マイメロ yet.
5. Create follow-up image/source extraction tasks for the four positive candidates.

Reason:

- Showing image-missing or wrong-image foods creates user-facing quality regressions.
- The two Baskin-Robbins flavors should be separate records, not a promotion of the generic `food-udijzl`.
- Kuromi/My Melody need image and price correction before display.

Recommended Phase 2:

1. Confirm current official source snapshots for Baskin-Robbins 2 flavors.
2. Obtain or vet official/manual images.
3. Add the two Baskin-Robbins records one or two at a time.
4. Confirm Kuromi/My Melody price, location, and images.
5. Restore each only after image quality is acceptable.

## 7. Do Not Touch In This Fix

- Old ended My Melody churros:
  - `food-18jn4un`
  - `food-1gl4a2z`
- Old #世界クロミ化計画 / salt-caramel themed records:
  - `food-5jyp4a`
  - `food-1nx0g42`
- Non-churros foods.
- Duplicate overrides unless an actual duplicate pair is being fixed.
- Ads, AdMob, AdSense, PWA, App Store, robots, sitemap.
- `data/translations`.
- Crawler / DB.

## 8. Verification Plan For Future Implementation

Run after the implementation phase:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run coverage`
- `npm run audit:duplicates`

Expected checks:

- Coverage orphan remains 0.
- Generated JSON diff is limited to approved food IDs.
- `food-5n9awi` is no longer public-visible if Phase 1 is used.
- `food-10fodl7` and `food-1sem5gf` remain hidden until image and price are fixed.
- No direct generated JSON hand edit.
- No crawler / DB / translation changes.

## 9. Source List

Official / trusted sources to use or re-check before implementation:

- USJ official food-cart / walk-around food page: `https://www.usj.co.jp/web/ja/jp/restaurants/food-cart`
- USJ official 25th anniversary food page: `https://www.usj.co.jp/web/ja/jp/25th-anniversary-discover-u/foods`
- CASTEL USJ churros page: `https://castel.jp/p/3101`
- CASTEL product/source pages referenced in prior audit:
  - `https://castel.jp/item/125735/`
  - `https://castel.jp/p/10459`
- Fashion Press USJ food/news source: `https://www.fashion-press.net/news/143560`
- Yahoo News source referenced in prior audit: `https://news.yahoo.co.jp/articles/c1d19b6d25475b4503908026aabb41278f30db9f`
- Rosy Innovation USJ churros page: `https://rosyinnovation.com/usj-churitosu2018`
- Happyell USJ churros page: `https://happyell.co.jp/turritosusj`
- Yuniba Hatena Blog Kuromi churros source: `https://yuniba.hatenablog.com/entry/usj-kuromi-churros-sales-period-investigation`
- USJ365 Kuromi source: `https://usj365.com/2026/04/15/2026kuromi/`

Implementation must treat official USJ pages as primary. Trusted non-official sources may support price/location only when official pages lack full detail.
