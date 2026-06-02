const baseUrl = process.argv[2] ?? "http://localhost:3000";

async function main() {
  const [home, foods, admin] = await Promise.all([fetchPage("/"), fetchPage("/foods"), fetchPage("/admin")]);
  const badVisiblePattern = /Global alt|SEO|Keywords|販売場所|price amount|Url Title|Swimlane|商標|ビッグサイズの本格派|株式会社|バックロット・カフェ パブ/;
  const officialImagePattern = /https:\/\/www\.usj\.co\.jp\/tridiondata\/usj\/ja\/jp\/files\/images\/[^"' <]+?\.(?:jpg|png|webp)/g;
  const dashboardPattern = /通常表示|総候補|公式画像|Pending|コンプ率|販売中|終了/;

  console.log(
    JSON.stringify(
      {
        homeStatus: home.status,
        foodsStatus: foods.status,
        adminStatus: admin.status,
        foodsHasDashboard: dashboardPattern.test(foods.html),
        foodsBadVisibleText: badVisiblePattern.test(foods.html),
        foodsOfficialImageUrls: new Set(foods.html.match(officialImagePattern) ?? []).size,
        foodsShowsGeneratedCount: /143件中|138件中|通常表示/.test(foods.html),
        adminHasQualityColumns: /画像|score|pending|rejected|hidden|source/i.test(admin.html)
      },
      null,
      2
    )
  );
}

async function fetchPage(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    html: await response.text()
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
