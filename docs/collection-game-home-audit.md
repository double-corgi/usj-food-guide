# Collection Game Home Audit

Date: 2026-06-12

References:

- Pokémon HOME feature pages and screenshots: collection completion, National Pokédex, records, mystery gifts, and points.
- Pokémon GO / Pokédex references: discovered vs undiscovered collection framing.
- Animal Crossing / Nintendo collection references: short goals, soft progress, reward-like next step.
- Local design references: `DESIGN.md`, `PRODUCT.md`, `USJ_FOOD_GUIDE_DESIGN.md`, `real-user-audit-v3.md`.

## Difference Analysis

| Item | Collection Game Reference | Current Home Before Fix | Gap |
| --- | --- | --- | --- |
| Emotional hook | The first screen makes users ask what is missing, what is unlocked, and what to do next. | The first screen is calm and tidy, but reads like a cleaned-up dashboard. | Lead with "remaining items" and next milestone, not brand text or a decorative image. |
| Progress hierarchy | Missing count and completion status are visually dominant. | `0/183` and `0%` are visible, but neutral and static. | Make `残り○品` the emotional headline, then show `0/183` and rate as supporting proof. |
| Collection affordance | Pokédex-like slots imply "filled / unfilled" and make gaps visible. | No slot metaphor; the page only shows numbers and photos later. | Add a small collection-slot preview using current food photos and a locked slot. |
| Brand treatment | Brand is recognizable but does not overpower progress. | `ユニコレ` is large and text-only. | Make it a compact badge-like brand with icon, blue/navy/gold, below the progress energy. |
| Next goal | Goals are reward-like and specific. | `あと5品` is too weak. | Use `5品達成まであと5品` style copy. |
| Visual energy | Game UI uses accents, badges, and compact visual rewards without becoming an ad. | White base is clean but lacks "I want to complete this" feeling. | Add subtle gold/blue accents, a soft field background, and badge-like progress. |
| Hero image | Images support the collection fantasy; not a generic banner. | Food hero strip is decorative and not tied to progress. | Remove image-as-hero; use small collection slots and progress as first-view content. |
| Home order | Progress and actionable collection content appear immediately. | Progress then brand image then food content. | Order becomes: remaining count, progress, next goal, active foods, areas, stores, 25th. |

## Implementation Decisions

- Replace the static first-view with a compact collection dashboard.
- Make `残り○品` the primary headline.
- Keep `食べた/販売中総数` and `達成率` as supporting metrics.
- Upgrade next goal from `あと5品` to `5品達成まであと5品`.
- Add a small collection-slot row using active food images plus a locked remaining slot.
- Remove the decorative hero strip from the first view.
- Keep "今集められるフード" immediately after the progress area.
- Keep 25th as a lower special feature, not the first-view focus.

## Adopted Elements

- Pokédex-style missing count: `残り○品` is now the strongest first-view message.
- Game milestone copy: next target is expressed as `5品達成まであと○品`.
- Collection slots: current active food photos appear as small collectible slots, with one locked `?` slot.
- Badge-like brand: `ユニコレ` is paired with the app icon and made secondary to the progress.
- Reward-like progress: progress bar uses USJ Blue to Universal Gold while avoiding a full-screen banner.

## Rejected Elements

- Full-screen game hero art: rejected because it would make the home feel like an LP or ad banner again.
- Heavy achievement/rank systems: rejected because the product is still a food collection app, not a standalone game.
- Pokémon/Nintendo visual copying: rejected; only the collection logic and hierarchy are adapted.
- Large app-icon hero: rejected because it previously made the first view feel like an enlarged icon.
