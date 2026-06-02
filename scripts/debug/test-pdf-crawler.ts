import { crawlMenuPdfs } from "../crawlers/crawl-menu-pdfs";

async function main() {
  const result = await crawlMenuPdfs(Number(process.argv[2] ?? 6));
  console.log(
    JSON.stringify(
      {
        pagesCrawled: result.pagesCrawled,
        foods: result.foods.length,
        sample: result.foods.slice(0, 20).map((food) => ({
          name: food.name,
          category: food.category,
          price: food.price,
          shopName: food.shopName,
          sourceUrl: food.sourceUrl
        })),
        errors: result.errors.slice(0, 10)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
