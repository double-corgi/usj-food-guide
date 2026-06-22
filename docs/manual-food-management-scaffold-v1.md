# Manual Food Management Scaffold v1

## 1. Overview

This scaffold prepares a guarded manual food layer for UNICOLE. It does not add real food data, does not add images, does not create an admin UI, and does not change generated JSON when the templates are empty.

Created files:

- `data/manual-foods.json`: manual add template, currently `[]`.
- `data/manual-food-overrides.json`: manual update template, currently `[]`.
- `scripts/debug/apply-manual-foods.ts`: guarded add apply script.
- `scripts/debug/apply-manual-food-overrides.ts`: guarded update apply script.

Existing visibility and duplicate override files are not duplicated or changed by this scaffold.

## 2. Manual Add Template

`data/manual-foods.json` is an array of `action: "add"` records. The file must remain an empty array until an approved task provides a concrete food candidate.

Allowed fields:

```json
{
  "action": "add",
  "foodNameJa": "example",
  "foodNameEn": "optional example",
  "priceYen": 800,
  "area": "example area",
  "shopName": "example shop",
  "categoryTags": ["churros", "cart", "seasonal"],
  "saleStatus": "active",
  "periodStart": "2026-07-01",
  "periodEnd": null,
  "image": "main.jpg",
  "imageSourceUrl": "https://example.com/image-source",
  "infoSourceUrl": "https://example.com/info-source",
  "sourceType": "official",
  "confidence": "high",
  "notes": "review note",
  "reviewedBy": "reviewer",
  "reviewedAt": "2026-06-22T00:00:00.000Z"
}
```

Required fields:

- `action`
- `foodNameJa`
- `priceYen` as a non-negative integer, or `null` only when `confidence` is `low`
- `area`
- `shopName`
- `categoryTags`
- `saleStatus`
- `infoSourceUrl`
- `sourceType`
- `confidence`
- `reviewedBy`
- `reviewedAt`

The add script currently requires `area` and `shopName` to match an existing generated food's embedded area and shop. New shop creation is intentionally out of scope.

## 3. Manual Update Template

`data/manual-food-overrides.json` is an array of `action: "update"` records. The file must remain an empty array until an approved task provides a concrete target.

Allowed fields:

```json
{
  "action": "update",
  "targetFoodId": "food-example",
  "priceYen": 800,
  "saleStatus": "active",
  "periodStart": "2026-07-01",
  "periodEnd": null,
  "image": "main.jpg",
  "imageSourceUrl": "https://example.com/image-source",
  "infoSourceUrl": "https://example.com/info-source",
  "sourceType": "official",
  "confidence": "high",
  "notes": "review note",
  "reviewedBy": "reviewer",
  "reviewedAt": "2026-06-22T00:00:00.000Z"
}
```

Identity fields such as `id`, `name`, `normalizedName`, `shopId`, and `areaId` are not allowed in update records.

## 4. Guard Rules

Both apply scripts enforce guard checks:

- Empty input arrays are no-op and do not write `scripts/output/foods.generated.json`.
- Unsupported input fields throw.
- Unsupported enum values throw.
- Generated JSON must not be manually edited.
- Add records generate deterministic IDs with `food-manual-<stableHash(area:shopName:foodNameJa)>`.
- Add records stop on ID collision.
- Update records only change whitelisted food fields.
- Existing foods outside the target IDs must remain unchanged.
- Food array order is preserved for updates.
- Adds are append-only.

Allowed `categoryTags`:

- `churros`
- `popcorn`
- `drink`
- `burger`
- `plate`
- `dessert`
- `snack`
- `cart`
- `seasonal`
- `universal-market`
- `nintendo`
- `minion`
- `jurassic`
- `harry-potter`
- `conan`
- `sanrio`

Allowed `saleStatus`:

- `active`
- `paused`
- `ended`
- `unknown`

Allowed `sourceType`:

- `official`
- `trusted-site`
- `manual-confirmed`

Allowed `confidence`:

- `high`
- `medium`
- `low`

## 5. Image Rule

Phase A does not implement upload, download, or image generation.

When an approved future task adds or updates a manual image, use:

```text
public/manual-images/<food.id>/main.jpg
```

The JSON value is `image: "main.jpg"`. The apply scripts derive the public path from the food ID. A valid `imageSourceUrl` is required when `image` is set.

## 6. Apply Flow

1. Add an approved record to `data/manual-foods.json` or `data/manual-food-overrides.json`.
2. Place approved images under `public/manual-images/<food.id>/main.jpg` only when the task permits image changes.
3. Run the relevant apply script.
4. Confirm generated JSON diff is limited to the intended target.
5. Run lint, typecheck, build, coverage, and duplicate audit.
6. Commit only the approved files.
7. Request review evidence before production deploy.

## 7. Review Checklist

- The source URL is recorded.
- The image source URL is recorded when an image is used.
- Price, sale status, area, shop, and category are supported by the source.
- Only allowed fields are present.
- The generated food ID is deterministic and collision-free.
- Generated JSON changes are limited to the intended target.
- No crawler, DB, data translations, ad code, or admin UI changes are included.

## 8. Current Scaffold Status

- Real food additions: none.
- Real image additions: none.
- `data/manual-foods.json`: empty.
- `data/manual-food-overrides.json`: empty.
- Empty apply execution is expected to produce zero generated JSON diff.
