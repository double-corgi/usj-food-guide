# Home First View Audit v4

Date: 2026-06-12

## Current Problems

- The first view still reads as a composed landing-page hero: image, brand text, description, and then progress.
- The long hero image is decorative but not actionable. It explains the brand mood, yet it does not make the user want to complete the food collection.
- `ユニコレ` is visually treated like a normal heading, so it does not feel like a compact collection-game brand mark.
- The progress card has the right data, but it is separated from the collection fantasy. It looks like a status panel, not a collection book being filled.
- The current structure does not immediately answer the emotional question: “あと何品で次の達成?”
- The `25th` section is too specific for a home foundation. It should be a reusable limited-time collection section so non-coders do not need UI changes for every campaign.

## Why It Feels AI-like

- A large branded image followed by centered copy creates a generic LP rhythm.
- The hero visual is not connected to the user’s own progress.
- Visual hierarchy is split between image, logo, text, and progress instead of making one strong collection moment.
- The page uses attractive pieces, but the first view lacks a game-home structure with clear status, next goal, and visible filled slots.

## Why Collection Desire Is Weak

- “1 / 183” is present but not framed as a living collection book.
- The remaining count is secondary, even though “残り” is the strongest emotional hook.
- Food thumbnails appear only after the hero section; they do not participate in the first impression.
- There is no small visual reward for eaten items or a tasteful empty-slot pattern for future items.

## Remove / De-emphasize

- Giant horizontal hero-image-first layout.
- Brand heading as the main event.
- LP-style explanatory flow.
- Fixed `25th` as a primary home section.
- Any `?` empty slot, `COLLECTION` tag, “今開けられるコレクション”, beige dotted background, or heavy navy block.

## Keep / Strengthen

- `canonicalFoodId`-based completion calculation.
- Current active food count, eaten count, remaining count, and completion rate.
- The “今集められるフード” product rail/grid.
- Area and store entry points.
- A limited-time collection section, but as a generic campaign slot.

## Adopted Direction

- Treat the first view as a compact collection-game home panel.
- Make `残り N品`, progress bar, and next milestone the emotional center.
- Use a small brand mark for `ユニコレ`, not a huge title.
- Use a collection-book slot strip with eaten thumbnails and locked empty slots. Locked slots use a subtle lock icon, not `?`.
- Use USJ Blue, USJ Navy, and Universal Gold with white surfaces and controlled shadows.
- Keep Nintendo-inspired friendliness, readable Japanese, and soft spacing without copying Nintendo’s official site.
