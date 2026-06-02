import { fetchText } from "../utils/http";
import { parseCastelChurros } from "../utils/castel-churro-parser";

const url = "https://castel.jp/p/3101";

fetchText(url)
  .then((html) => {
    const foods = parseCastelChurros(html, url);
    console.log(
      JSON.stringify(
        foods
          .filter((food) => food.status !== "ended")
          .slice(0, 80)
          .map((food) => ({
            name: food.name,
            price: food.price,
            shopName: food.shopName,
            images: food.images.map((image) => ({
              imageUrl: image.imageUrl,
              altText: image.altText,
              score: image.imageMatchScore,
              mismatch: image.imageMismatchReason
            }))
          })),
        null,
        2
      )
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
