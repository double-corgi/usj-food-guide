const baseUrl = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const paths = [
  "/",
  "/foods",
  "/foods/food-62sv4l",
  "/areas",
  "/areas/area-olb56e",
  "/eaten",
  "/stores",
  "/stores/shop-102yaa2",
  "/request",
  "/settings",
  "/admin",
  "/admin/prices",
  "/privacy",
  "/terms",
  "/contact",
  "/disclaimer",
  "/about",
  "/security",
  "/commercial-disclosure",
];

async function main() {
  const results = [];
  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, { method: "HEAD", redirect: "manual" });
    results.push({ path, status: response.status, ok: response.status === 200 });
  }
  const failed = results.filter((result) => !result.ok);
  console.log(JSON.stringify({ baseUrl, results, failed }, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
