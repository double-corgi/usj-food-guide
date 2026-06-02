const url = "https://usjfoodallergy.usj.co.jp/search_restaurant";

async function main() {
  const first = await fetch(url);
  const html = await first.text();
  const cookie = first.headers.get("set-cookie")?.split(";")[0] ?? "";
  const token = html.match(/name="_token"\s+value="([^"]+)"/)?.[1] ?? "";
  const restaurantIds = [...html.matchAll(/name="arealist\[\]"\s+value="([^"]+)"/g)].map((match) => match[1]).slice(0, 8);
  console.log(JSON.stringify({ status: first.status, token: Boolean(token), cookie: Boolean(cookie), restaurantIds }, null, 2));

  if (!token || restaurantIds.length === 0) return;

  const body = new URLSearchParams();
  body.set("_token", token);
  body.set("actCnf", "conf");
  body.set("actAlg", "search_allergen");
  body.set("backnum", "0");
  for (const id of restaurantIds.slice(0, 2)) body.append("arealist[]", id);

  const response = await fetch("https://usjfoodallergy.usj.co.jp/conf", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie,
      referer: url
    },
    body
  });
  const text = await response.text();
  console.log(JSON.stringify({ postStatus: response.status, length: text.length, redirected: response.redirected, finalUrl: response.url }, null, 2));
  const clean = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const snippets = [...clean.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map((match) => match[1].replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 120);
  console.log(snippets.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
