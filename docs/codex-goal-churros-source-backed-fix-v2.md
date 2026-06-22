# Codex Goal: Source-Backed Churros Safe Fix v2

## Goal

Implement the smallest safe source-backed churros fix.

Primary objective:

- Prevent a suspected wrong-image / paused churros item from being shown publicly.

Secondary objective:

- Prepare a safe visibility override path that can later restore or add source-backed churros one item at a time.

This goal intentionally does not add or restore image-missing churros.

## Inputs

Read first:

- `docs/churros-source-backed-fix-plan-v2.md`
- `docs/churros-official-source-audit-v1.md`
- `docs/churros-visibility-audit-v1.md`
- `docs/beta-feedback-image-price-audit-v1.md`

Target for this phase:

- Hide / pause `food-5n9awi` ソルティキャラメルチュリトス.

Do not change in this phase:

- `food-udijzl` サーティーワン・チュリトス generic record.
- `food-10fodl7` クロミ・チュリトス ～カシスショコラ味～.
- `food-1sem5gf` マイメロディ・チュリトス ～いちごヨーグルト味～.

Reason:

- The positive candidates still need usable images and, for Kuromi/My Melody, price/location correction.
- Showing image-missing foods is not acceptable.

## Allowed Files

Expected new/changed files:

- `data/food-visibility-overrides.json`
- `scripts/debug/apply-food-visibility-overrides.ts`
- `scripts/output/foods.generated.json`

Only add other files if there is a clearly documented blocker and the user approves.

## Prohibited

- `git add .`
- Direct hand-editing generated JSON.
- Crawler execution.
- DB execution.
- `data/translations` changes.
- `package.json` changes.
- App/component UI changes.
- Public image changes.
- External image download.
- AdMob / AdSense / App Store work.
- Adding or restoring the Baskin-Robbins, Kuromi, or My Melody churros in this phase.

## Implementation Requirements

### 1. Add visibility override definition

Create `data/food-visibility-overrides.json`.

Initial content should include only:

```json
[
  {
    "foodId": "food-5n9awi",
    "hidden": true,
    "reviewStatus": "needs_review",
    "displayQuality": "low",
    "reason": "Trusted source indicates sales pause and current app image is suspected wrong. Hide until correct sale status and image are confirmed."
  }
]
```

If the generated schema does not support `needs_review` or `low` exactly as shown, stop and report the valid enum values before applying.

### 2. Add offline apply script

Create `scripts/debug/apply-food-visibility-overrides.ts`.

Requirements:

- Read `scripts/output/foods.generated.json`.
- Read `data/food-visibility-overrides.json`.
- Apply only allowed fields:
  - `hidden`
  - `reviewStatus`
  - `displayQuality`
- Do not change:
  - food.id
  - name
  - price
  - category
  - imageUrl / images
  - area
  - shop
  - sourceUrl
  - canonical / duplicate grouping
- Compute expected changed IDs from the override file.
- Compute actual changed IDs after applying.
- Stop if actual changed IDs differ from expected changed IDs.
- Stop if any unsupported field would change.
- Log before/after for each target ID.
- Write the generated JSON only if safety checks pass.

### 3. Run the apply script

Use the repo's existing ts-node style. Do not run crawler scripts.

Expected result:

- `food-5n9awi` has `hidden=true`.
- `food-5n9awi` has review/display quality indicating review-needed/low confidence.
- No other food ID changes.

## Verification

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run coverage`
- `npm run audit:duplicates`

Check:

- Coverage orphan remains 0.
- Food/Store coverage counts are reported.
- `food-5n9awi` is not public-visible.
- No price, image, category, product name, shop, or area changes.
- No Kuromi / My Melody / Baskin-Robbins records are promoted.
- No crawler / DB / translation changes.

## Stage

Do not use `git add .`.

Stage only:

```bash
git add data/food-visibility-overrides.json
git add scripts/debug/apply-food-visibility-overrides.ts
git add scripts/output/foods.generated.json
```

Confirm staged files:

```bash
git diff --cached --name-only
git diff --cached --stat
```

Expected staged files only:

- `data/food-visibility-overrides.json`
- `scripts/debug/apply-food-visibility-overrides.ts`
- `scripts/output/foods.generated.json`

## Commit

Suggested commit message:

```bash
git commit -m "fix: hide paused salty caramel churro"
```

Then push.

## Stop Conditions

Stop and report if:

- More than `food-5n9awi` changes in generated JSON.
- Any price, image, category, name, shop, area, sourceUrl, or duplicate grouping changes.
- Valid enum values for `reviewStatus` / `displayQuality` are unclear.
- Crawler or DB execution appears necessary.
- `data/translations` changes appear necessary.
- `package.json` changes appear necessary.
- `npm run lint` fails.
- `npm run typecheck` fails.
- `npm run build` fails.
- `npm run coverage` fails.
- `npm run audit:duplicates` fails.

## Follow-Up Goals

Do not implement these in this goal.

1. Confirm official image candidates for:
   - サーティワン・チュリトス ～ラブポーションサーティワン～
   - サーティワン・チュリトス ～ポッピングシャワー～
2. Add the Baskin-Robbins churros as separate foods only after usable images and current sale status are confirmed.
3. Confirm and place official/manual images for:
   - `food-10fodl7` クロミ・チュリトス ～カシスショコラ味～
   - `food-1sem5gf` マイメロディ・チュリトス ～いちごヨーグルト味～
4. Restore Kuromi/My Melody only after price, location, and image are fixed.
