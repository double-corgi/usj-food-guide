# Nintendo Home Audit

Date: 2026-06-12

Reference:

- `/Users/u/Downloads/awesome-design-md-jp-main/design-md/nintendo/DESIGN.md`
- `DESIGN.md`
- `PRODUCT.md`
- `USJ_FOOD_GUIDE_DESIGN.md`
- `real-user-audit-v3.md`

Note: `DESIGN_NINTENDO.md` was requested but is not present in this repository. The downloaded Nintendo `DESIGN.md` above is used as the Nintendo source of truth.

## Difference Analysis

| Item | Nintendo DESIGN.md | Current Home Before Fix | Gap |
| --- | --- | --- | --- |
| Spacing | Spacious, clean, consumer-first. Body line-height 2.0. Sections breathe. | First view is one dark, dense block. Information is packed into a single card. | Reduce card pressure. Add white space around hierarchy. |
| Typography | Heading 30px / weight 600 / line-height 1.8. Body 16px / line-height 2.0. | Large heavy black numbers and compact labels dominate. | Use softer weights for brand/labels; keep progress large but reduce heavy dashboard feel. |
| Information density | Cards/grids organize content, but text is calm and readable. | `COLLECTION` tag, brand, progress, rate, remaining, next goal, description, image all inside one block. | Remove meaningless English tag. Separate information by hierarchy, not by nested boxes. |
| Color count | White and light neutral base, accent used sparingly. | Large navy surface dominates the first view. | Move to white/light neutral base with navy/gold as accents only. |
| Card usage | Card/grid-led but not dashboard-heavy. | One large dark card plus three inner mini-cards. | Avoid card-in-card. Use open progress layout and thin dividers. |
| Heading | 30px, 600, gentle tracking. | Brand label is heavy, progress labels are small and compressed. | Brand becomes small heading; progress number remains focal. |
| Image ratio | Images support card/grid content; not a giant ad banner. | Hero image is hidden in the dark card, still functioning as banner background. | Shrink image to a small supporting visual strip. |
| CTA | Consumer-first, clear, not too many equal CTAs. | No major CTA in first view, acceptable, but `COLLECTION` acts like a fake label. | Remove fake label; keep navigation through sections. |
| Information hierarchy | Clear heading > content > supporting metadata. | Visual block reads like SaaS dashboard due to dark container and metrics. | Show `ユニコレ`, tagline, progress, remaining, next goal, then food grid. |

## Implementation Decisions

- Remove the large navy card as the first-view container.
- Remove the `COLLECTION` tag.
- Keep progress as the main content, but display it on a white/light surface with thin lines and a small progress bar.
- Use Nintendo typography direction: brand heading around 30px/600, body around 16px with line-height 2.0.
- Use USJ Blue / Navy / Universal Gold only as accents, not as full-surface fill.
- Shrink the generated hero visual to a small supporting strip and keep it below the progress content.
- Increase section rhythm around the first view while keeping "今集められるフード" directly after it.

## Reflected In UI

| Gap | Implemented Change |
| --- | --- |
| Large navy first-view card | Replaced with a white/light neutral page surface and thin horizontal dividers. |
| Dashboard-like inner metric cards | Removed mini card surfaces; progress metadata now appears as quiet text columns. |
| Heavy typography | Section headings use 30px / 600 / line-height 1.8. Body/support text uses 16px / line-height 2.0 where practical. |
| Fake English tag | Removed `COLLECTION` from the first view. |
| Color dominance | USJ Navy, USJ Blue, and Universal Gold are limited to numbers, links, and the progress bar. |
| Banner-like image use | Hero visual is now a small supporting strip below progress, not the main content. |
| Section rhythm | Home sections use larger, calmer vertical rhythm and lighter borders instead of heavy cards. |
| Button weight | Secondary links are lighter text or white outline buttons; only the main search CTA remains dark. |
