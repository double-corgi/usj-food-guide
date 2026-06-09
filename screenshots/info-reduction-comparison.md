# UI情報量削減 比較

DESIGN.md / PRODUCT.md / design-audit.md に沿って、数字・囲い・管理情報を弱めた比較です。

| Page | 390px Before | 390px After | 430px Before | 430px After |
| --- | --- | --- | --- | --- |
| Home | `screenshots/home-info-reduction-before-iphone14.png` | `screenshots/home-info-reduction-after-iphone14.png` | `screenshots/home-info-reduction-before-iphone14-pro-max.png` | `screenshots/home-info-reduction-after-iphone14-pro-max.png` |
| Foods | `screenshots/foods-info-reduction-before-iphone14.png` | `screenshots/foods-info-reduction-after-iphone14.png` | `screenshots/foods-info-reduction-before-iphone14-pro-max.png` | `screenshots/foods-info-reduction-after-iphone14-pro-max.png` |
| Food Detail | `screenshots/food-detail-info-reduction-before-iphone14.png` | `screenshots/food-detail-info-reduction-after-iphone14.png` | `screenshots/food-detail-info-reduction-before-iphone14-pro-max.png` | `screenshots/food-detail-info-reduction-after-iphone14-pro-max.png` |
| Eaten | `screenshots/eaten-info-reduction-before-iphone14.png` | `screenshots/eaten-info-reduction-after-iphone14.png` | `screenshots/eaten-info-reduction-before-iphone14-pro-max.png` | `screenshots/eaten-info-reduction-after-iphone14-pro-max.png` |
| Areas | `screenshots/areas-info-reduction-before-iphone14.png` | `screenshots/areas-info-reduction-after-iphone14.png` | `screenshots/areas-info-reduction-before-iphone14-pro-max.png` | `screenshots/areas-info-reduction-after-iphone14-pro-max.png` |

## 検証

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run build`: pass
- 390px: `/`, `/foods`, `/foods/[id]`, `/eaten`, `/areas`, `/request` の横スクロール 0 / 文字クリップ 0
- 430px: `/`, `/foods`, `/foods/[id]`, `/eaten`, `/areas`, `/request` の横スクロール 0 / 文字クリップ 0
