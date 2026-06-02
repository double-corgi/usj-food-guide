import { parseCastelChurros } from "../utils/castel-churro-parser";
import { fetchText } from "../utils/http";

async function main() {
  const url = "https://castel.jp/p/3101";
  const html = await fetchText(url, { retries: 1, timeoutMs: 20000 });
  const foods = parseCastelChurros(html, url);
  console.log(JSON.stringify({
    count: foods.length,
    active: foods.filter((food) => food.status === "active").length,
    withPrice: foods.filter((food) => food.price).length,
    withImage: foods.filter((food) => food.images.length > 0).length,
    sample: foods.slice(0, 12).map((food) => ({
      name: food.name,
      price: food.price,
      shopName: food.shopName,
      status: food.status,
      images: food.images.length
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
