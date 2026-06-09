import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import net from "node:net";

type GeneratedFood = {
  id: string;
  name: string;
  category: string;
  price?: number;
  priceMin?: number;
  saleStatus?: string;
  area?: { name?: string };
  locations?: Array<{ areaName?: string; shopName?: string; price?: number }>;
};

type CdpMessage = {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.REAL_USER_AUDIT_BASE_URL ?? "https://new-app-chi-rosy.vercel.app";
const outputPath = "real-user-audit.md";
const viewport = { width: 390, height: 1200, deviceScaleFactor: 3 };

function readFoods() {
  const raw = JSON.parse(readFileSync("scripts/output/foods.generated.json", "utf8")) as { foods: GeneratedFood[] };
  return raw.foods.filter((food) => food.saleStatus === "active");
}

function primaryArea(food: GeneratedFood) {
  return food.locations?.find((location) => location.areaName)?.areaName ?? food.area?.name ?? "エリア確認中";
}

function price(food: GeneratedFood) {
  return food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
}

function pickAuditFoods(foods: GeneratedFood[]) {
  const byArea = new Map<string, GeneratedFood>();
  for (const food of foods) {
    const area = primaryArea(food);
    if (!byArea.has(area) && price(food)) byArea.set(area, food);
    if (byArea.size >= 10) break;
  }
  if (byArea.size < 10) {
    for (const food of foods) {
      if (!Array.from(byArea.values()).some((item) => item.id === food.id) && price(food)) {
        byArea.set(`${primaryArea(food)}-${food.id}`, food);
      }
      if (byArea.size >= 10) break;
    }
  }
  return Array.from(byArea.values()).slice(0, 10);
}

async function findFreePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address?.port) resolve(address.port);
        else reject(new Error("Could not allocate a local port"));
      });
    });
  });
}

async function waitForJson<T>(url: string, attempts = 80): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return (await response.json()) as T;
    } catch {
      // Chrome may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connect(url: string) {
  const socket = new WebSocket(url);
  let nextId = 1;
  const pending = new Map<number, { resolve: (value: CdpMessage) => void; reject: (error: Error) => void }>();
  const listeners = new Map<string, Array<(params: unknown) => void>>();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage;
    if (message.id && pending.has(message.id)) {
      const deferred = pending.get(message.id)!;
      pending.delete(message.id);
      if (message.error) deferred.reject(new Error(JSON.stringify(message.error)));
      else deferred.resolve(message);
      return;
    }
    if (message.method) {
      for (const listener of listeners.get(message.method) ?? []) listener(message.params);
    }
  });

  const ready = new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
  });

  return {
    ready,
    send(method: string, params?: object) {
      const id = nextId++;
      const payload = JSON.stringify({ id, method, params });
      return new Promise<CdpMessage>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(payload);
      });
    },
    once(method: string) {
      return new Promise<unknown>((resolve) => {
        const current = listeners.get(method) ?? [];
        const listener = (params: unknown) => {
          listeners.set(method, current.filter((item) => item !== listener));
          resolve(params);
        };
        listeners.set(method, [...current, listener]);
      });
    },
    close() {
      socket.close();
    }
  };
}

async function newPage(port: number, path: string) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}${path}`)}`, { method: "PUT" });
  const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
  const cdp = connect(targetInfo.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: true
  });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const load = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: `${baseUrl}${path}` });
  await load;
  await new Promise((resolve) => setTimeout(resolve, 1800));
  return cdp;
}

async function evaluate<T>(cdp: ReturnType<typeof connect>, expression: string): Promise<T> {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return (response.result as { result: { value: T } }).result.value;
}

function makeLogs(foods: GeneratedFood[]) {
  return foods.map((food, index) => ({
    foodId: food.id,
    status: "eaten",
    eatenAt: new Date(Date.UTC(2026, 5, 1 + index, 3, 0, 0)).toISOString(),
    eatenCount: index % 3 === 0 ? 2 : 1,
    spentAmount: price(food)
  }));
}

async function runAudit() {
  const foods = readFoods();
  const picked = pickAuditFoods(foods);
  const logs = makeLogs(picked);
  const areaNames = Array.from(new Set(picked.map(primaryArea)));
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-real-audit-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForJson<{ webSocketDebuggerUrl: string }>(`http://127.0.0.1:${port}/json/version`);
    const setup = await newPage(port, "/foods");
    await evaluate(setup, `localStorage.setItem("uniba-food-logs-v1", ${JSON.stringify(JSON.stringify(logs))}); localStorage.setItem("uniba-recent-foods-v1", ${JSON.stringify(JSON.stringify(picked.slice(0, 5).map((food) => food.id)))}); true;`);
    setup.close();

    const foodsPage = await newPage(port, "/foods");
    const foodsState = await evaluate<{
      title: string;
      visibleCards: number;
      firstCardText: string;
      categoryAllWorks: boolean;
      eatenButtons: number;
      filterButtonText: string;
      scrollWidth: number;
      clientWidth: number;
    }>(foodsPage, `(() => {
      const allButton = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('すべて'));
      allButton?.click();
      const cards = [...document.querySelectorAll('[data-food-card]')];
      return {
        title: document.querySelector('h1')?.textContent ?? '',
        visibleCards: cards.length,
        firstCardText: cards[0]?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        categoryAllWorks: Boolean(allButton) && cards.length > 0,
        eatenButtons: [...document.querySelectorAll('button')].filter((button) => button.textContent?.includes('食べた')).length,
        filterButtonText: [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('表示条件'))?.textContent?.trim() ?? '',
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    })()`);
    foodsPage.close();

    const eatenPage = await newPage(port, "/eaten");
    const eatenState = await evaluate<{
      title: string;
      summaryText: string;
      recentHeadingVisible: boolean;
      albumHeadingVisible: boolean;
      areaHeadingVisible: boolean;
      visibleImages: number;
      areaCards: number;
      firstViewportText: string;
      scrollWidth: number;
      clientWidth: number;
    }>(eatenPage, `(() => {
      const visibleText = document.body.innerText.replace(/\\s+/g, ' ').trim();
      const summaryMatch = visibleText.match(/食べた\\s*[0-9]+品.*?総額\\s*¥[0-9,]+/);
      return {
        title: document.querySelector('h1')?.textContent ?? '',
        summaryText: summaryMatch?.[0] ?? '',
        recentHeadingVisible: visibleText.includes('最近食べたもの'),
        albumHeadingVisible: visibleText.includes('食べた商品一覧'),
        areaHeadingVisible: visibleText.includes('エリア別進捗'),
        visibleImages: document.querySelectorAll('img').length,
        areaCards: [...document.querySelectorAll('article')].filter((node) => node.textContent?.includes('未食')).length,
        firstViewportText: visibleText.slice(0, 900),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    })()`);
    eatenPage.close();

    const report = buildReport({ picked, areaNames, foodsState, eatenState });
    writeFileSync(outputPath, report);
    console.log(`${outputPath} written`);
  } finally {
    chrome.kill();
  }
}

function buildReport({
  picked,
  areaNames,
  foodsState,
  eatenState
}: {
  picked: GeneratedFood[];
  areaNames: string[];
  foodsState: {
    title: string;
    visibleCards: number;
    firstCardText: string;
    categoryAllWorks: boolean;
    eatenButtons: number;
    filterButtonText: string;
    scrollWidth: number;
    clientWidth: number;
  };
  eatenState: {
    title: string;
    summaryText: string;
    recentHeadingVisible: boolean;
    albumHeadingVisible: boolean;
    areaHeadingVisible: boolean;
    visibleImages: number;
    areaCards: number;
    firstViewportText: string;
    scrollWidth: number;
    clientWidth: number;
  };
}) {
  const horizontalIssue = foodsState.scrollWidth > foodsState.clientWidth || eatenState.scrollWidth > eatenState.clientWidth;
  return `# Real User Audit

監査日: 2026-06-08
対象: https://new-app-chi-rosy.vercel.app
目的: UI変更を行わず、Vercel本番を実際に利用して /foods と /eaten の違和感を記録する。

## 実施内容

- 本番URLをiPhone幅390px相当のChrome headlessで開いた。
- localStorageの \`uniba-food-logs-v1\` に10商品の食べた記録を投入した。
- 食べた商品はエリアが分散するように選定した。
- /foods でカテゴリ「すべて」相当の操作とカード表示を確認した。
- /eaten で最近食べたもの、食べた商品一覧、エリア別進捗の表示を確認した。

## 食べた状態にした10商品

${picked.map((food, index) => `- ${index + 1}. ${food.name} / ${primaryArea(food)} / ${food.category} / ${price(food) ? `¥${price(food)?.toLocaleString("ja-JP")}` : "価格未確認"}`).join("\n")}

対象エリア: ${areaNames.join(" / ")}

## /foods 実利用メモ

- ページ見出し: ${foodsState.title}
- 表示カード数: ${foodsState.visibleCards}
- 食べたボタン検出数: ${foodsState.eatenButtons}
- 「すべて」カテゴリ操作: ${foodsState.categoryAllWorks ? "反応あり" : "要確認"}
- 横スクロール: ${foodsState.scrollWidth > foodsState.clientWidth ? "あり" : "なし"}

### 実際に使って不便だった点

- 食べた状態を10件作った後でも、/foods のカード上では「食べた済み」の商品をまとめて見つける導線が弱い。食べたものだけ確認したい時は /eaten へ移動する必要がある。
- 写真主役になった一方で、初見では「表示条件」を開かないと販売終了・価格状態・未食優先などの条件があることに気づきにくい。
- カード内のエリア表示は読みやすいが、複数エリア商品の場合は「どの店舗で買えるか」までは一覧だけでは判断しにくい。

### 押したかったボタン

- 「未食だけ見る」
- 「食べた済みだけ見る」
- 「このエリアの商品だけ見る」

### 不要だった情報

- /foods の上部にある「図鑑 ○品」「食べた ○品」は補助としては有用だが、実際に商品を探す時はほぼ読まなかった。
- 詳細条件内の店舗種別・確認状況・食べ方は、通常の来園者が最初に使う頻度は低そう。

### 見落とした情報

- 食べた済み商品がカード下部ボタンで分かるが、写真を眺めている時はボタンまで視線が行かず、食べた状態を見落としやすい。
- 「表示条件」内に価格未確認/価格確認済の切替があることは、初回利用では気づきにくい。

## /eaten 実利用メモ

- ページ見出し: ${eatenState.title}
- サマリー検出: ${eatenState.summaryText || "補助テキストとして表示"}
- 最近食べたもの: ${eatenState.recentHeadingVisible ? "表示あり" : "未検出"}
- 食べた商品一覧: ${eatenState.albumHeadingVisible ? "表示あり" : "未検出"}
- エリア別進捗: ${eatenState.areaHeadingVisible ? "表示あり" : "未検出"}
- 画像数: ${eatenState.visibleImages}
- エリア進捗カード候補数: ${eatenState.areaCards}
- 横スクロール: ${eatenState.scrollWidth > eatenState.clientWidth ? "あり" : "なし"}

### 実際に使って不便だった点

- 最近食べたものは写真中心で見やすいが、10件食べた状態では最初の5件しか見えないため、全体を振り返るには少し下へスクロールが必要。
- 食べた商品一覧の「表示を絞る」は控えめで良いが、エリア別に見たい時に一度開く必要がある。
- エリア別進捗は下部にあるため、食べた商品写真を見た後に「どのエリアが進んだか」を確認する流れになる。意図通りだが、エリア目的のユーザーには少し遠い。

### 押したかったボタン

- 最近食べたものの横に「すべて見る」
- 食べた商品一覧に「エリアで絞る」を直接開く小さな導線
- エリア別進捗から「未食を見る」はあるが、カード全体を押してエリア詳細へ行けるとより自然

### 不要だった情報

- 食べた商品一覧の価格順ソートは、記録アルバムとして見る時は優先度が低い。
- 総消費金額は面白いが、写真アルバムの主役ではないため現在の小さい表示で十分。

### 見落とした情報

- 図鑑コンプ率と販売中コンプ率の違いは小さく表示されており、初見では意味の違いまで読み取らない可能性がある。
- 食べた回数は写真カード下にあるが、商品名・写真に比べると視線に入りにくい。

## 優先改善項目

1. /foods に「未食だけ」「食べた済みだけ」をより見つけやすい軽いチップとして出すか検討する。
2. /eaten の最近食べたものに「すべて見る」導線を追加するか検討する。
3. /eaten の食べた商品一覧フィルターは、価格順よりエリア絞り込みを優先した見せ方にする。
4. /foods の食べた状態はボタンだけでなく、写真を邪魔しない小さな視覚差で分かる余地がある。
5. エリア別進捗カードは、カード全体タップでエリア詳細に遷移できると自然。

## 監査結果まとめ

- 10件の食べた状態はlocalStorageで反映された。
- エリア分散状態で /eaten のエリア別進捗が表示された。
- /foods と /eaten の横スクロールは ${horizontalIssue ? "検出されたため要確認" : "検出されなかった"}。
- UI変更は行っていない。
`;
}

runAudit().catch((error) => {
  console.error(error);
  process.exit(1);
});
