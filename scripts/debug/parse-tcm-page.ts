import { fetchText } from "../utils/http";
import { parseFoodsFromTcmJson } from "../utils/tcm-parser";

const url = process.argv[2] ?? "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kinopios-cafe/index.html";

fetchText(url)
  .then((raw) => {
    const parsed = parseFoodsFromTcmJson(raw, url);
    console.log(JSON.stringify({
      url,
      foods: parsed.foods.length,
      links: parsed.links.length,
      images: parsed.foods.reduce((sum, food) => sum + food.images.length, 0),
      sample: parsed.foods.slice(0, 40).map((food) => ({
        name: food.name,
        shop: food.shopName,
        category: food.category,
        images: food.images.length,
        image: food.images[0]?.imageUrl
      }))
    }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
