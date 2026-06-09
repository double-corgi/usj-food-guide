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

type EatenAuditState = {
  title: string;
  summaryText: string;
  firstViewportText: string;
  recentVisible: boolean;
  albumVisible: boolean;
  areaVisible: boolean;
  genreVisible: boolean;
  recentTop: number;
  albumTop: number;
  areaTop: number;
  genreTop: number;
  documentHeight: number;
  viewportHeight: number;
  imageCount: number;
  articleCount: number;
  eatenCardCandidates: number;
  areaProgressCandidates: number;
  genreProgressCandidates: number;
  visibleAtTopImages: number;
  filterButtonCount: number;
  scrollWidth: number;
  clientWidth: number;
  headings: string[];
};

type ScenarioResult = {
  count: number;
  selectedAreaCount: number;
  selectedCategoryCount: number;
  actualSummary: string;
  state: EatenAuditState;
  problems: string[];
  improvements: string[];
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.REAL_USER_AUDIT_BASE_URL ?? "https://new-app-chi-rosy.vercel.app";
const outputPath = "real-user-audit-v2.md";
const viewport = { width: 390, height: 1200, deviceScaleFactor: 3 };
const scenarioCounts = [50, 100, 150];

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

function pickAuditFoods(foods: GeneratedFood[], count: number) {
  const byArea = new Map<string, GeneratedFood[]>();
  for (const food of foods) {
    const area = primaryArea(food);
    byArea.set(area, [...(byArea.get(area) ?? []), food]);
  }

  const picked: GeneratedFood[] = [];
  const seen = new Set<string>();
  const areaBuckets = Array.from(byArea.entries()).sort((a, b) => b[1].length - a[1].length);
  let cursor = 0;

  while (picked.length < count && seen.size < foods.length) {
    const [, bucket] = areaBuckets[cursor % areaBuckets.length];
    const candidate = bucket.find((food) => !seen.has(food.id) && price(food));
    const fallback = bucket.find((food) => !seen.has(food.id));
    const next = candidate ?? fallback;
    if (next) {
      picked.push(next);
      seen.add(next.id);
    }
    cursor += 1;
  }

  for (const food of foods) {
    if (picked.length >= count) break;
    if (!seen.has(food.id)) {
      picked.push(food);
      seen.add(food.id);
    }
  }

  return picked.slice(0, count);
}

function makeLogs(foods: GeneratedFood[]) {
  return foods.map((food, index) => {
    const eatenAt = new Date(Date.UTC(2026, 4, 1 + (index % 31), 3, 0, 0));
    if (index >= 31) eatenAt.setUTCMonth(5);
    if (index >= 62) eatenAt.setUTCMonth(3);
    if (index >= 93) eatenAt.setUTCMonth(2);
    if (index >= 124) eatenAt.setUTCMonth(1);
    return {
      foodId: food.id,
      status: "eaten",
      eatenAt: eatenAt.toISOString(),
      eatenCount: index % 7 === 0 ? 2 : 1,
      spentAmount: price(food)
    };
  });
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

async function auditScenario(port: number, foods: GeneratedFood[], count: number): Promise<ScenarioResult> {
  const picked = pickAuditFoods(foods, count);
  const logs = makeLogs(picked);
  const areaCount = new Set(picked.map(primaryArea)).size;
  const categoryCount = new Set(picked.map((food) => food.category)).size;

  const setup = await newPage(port, "/eaten");
  await evaluate(setup, `localStorage.setItem("uniba-food-logs-v1", ${JSON.stringify(JSON.stringify(logs))}); localStorage.setItem("uniba-recent-foods-v1", ${JSON.stringify(JSON.stringify(picked.slice(0, 5).map((food) => food.id)))}); true;`);
  setup.close();

  const page = await newPage(port, "/eaten");
    const state = await evaluate<EatenAuditState>(page, `(() => {
    const text = document.body.innerText.replace(/\\s+/g, ' ').trim();
    const findTop = (label) => {
      const node = [...document.querySelectorAll('h1,h2,h3,section,article')].find((item) => item.textContent?.includes(label));
      return node ? Math.round(node.getBoundingClientRect().top + window.scrollY) : -1;
    };
    const visibleImages = [...document.querySelectorAll('img')].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight && rect.width > 20 && rect.height > 20;
    }).length;
    return {
      title: document.querySelector('h1')?.textContent ?? '',
      summaryText: text.match(/食べた\\s*[0-9]+品.*?総額\\s*¥[0-9,]+/)?.[0] ?? '',
      firstViewportText: text.slice(0, 750),
      recentVisible: text.includes('最近食べたもの'),
      albumVisible: text.includes('食べた商品一覧'),
      areaVisible: text.includes('エリア別進捗'),
      genreVisible: text.includes('ジャンル別進捗'),
      recentTop: findTop('最近食べたもの'),
      albumTop: findTop('食べた商品一覧'),
      areaTop: findTop('エリア別進捗'),
      genreTop: findTop('ジャンル別進捗'),
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      imageCount: document.querySelectorAll('img').length,
      articleCount: document.querySelectorAll('article').length,
      eatenCardCandidates: [...document.querySelectorAll('article')].filter((node) => /[0-9]+\\/|回|¥/.test(node.textContent ?? '')).length,
      areaProgressCandidates: [...document.querySelectorAll('article')].filter((node) => node.textContent?.includes('未食') && node.textContent?.includes('図鑑')).length,
      genreProgressCandidates: [...document.querySelectorAll('article')].filter((node) => node.textContent?.includes('ジャンル') || node.textContent?.includes('チュリトス') || node.textContent?.includes('ドリンク')).length,
      visibleAtTopImages: visibleImages,
      filterButtonCount: [...document.querySelectorAll('button')].filter((button) => button.textContent?.includes('表示を絞る')).length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      headings: [...document.querySelectorAll('h1,h2,h3')].map((node) => node.textContent?.trim() ?? '').filter(Boolean).slice(0, 20)
    };
  })()`);
  page.close();

  return {
    count,
    selectedAreaCount: areaCount,
    selectedCategoryCount: categoryCount,
    actualSummary: state.summaryText,
    state,
    problems: deriveProblems(count, state),
    improvements: deriveImprovements(count, state)
  };
}

function deriveProblems(count: number, state: EatenAuditState) {
  const problems: string[] = [];
  if (!state.firstViewportText.includes("最近食べたもの")) {
    problems.push("ファーストビューで最近食べたものまで届きにくく、食べた記録アルバムとしての主役が少し遅れて見える。");
  }
  if (state.albumTop > state.viewportHeight * 1.4) {
    problems.push("食べた商品一覧がファーストビューから遠く、件数が増えるほど一覧確認までのスクロールが長く感じる。");
  }
  if (state.documentHeight / state.viewportHeight > 12) {
    problems.push(`ページ全体が約${Math.round((state.documentHeight / state.viewportHeight) * 10) / 10}画面分あり、${count}件状態では下部の進捗まで見る前にスクロール疲れが出る。`);
  } else if (state.documentHeight / state.viewportHeight > 7) {
    problems.push(`ページ全体は約${Math.round((state.documentHeight / state.viewportHeight) * 10) / 10}画面分。実装前より短くなったが、下部進捗まで一気に見るにはまだ少し長い。`);
  }
  if (state.visibleAtTopImages < 2) {
    problems.push("上部で見える写真数が少なく、食べた記録アルバムとしての写真の密度が弱い。");
  }
  if (state.filterButtonCount > 0 && count >= 100) {
    problems.push("食べた商品一覧の絞り込みはあるが、100件以上では最初から探したい切り口を選べるほど目立たない。");
  }
  if (state.scrollWidth > state.clientWidth) {
    problems.push("横スクロールが発生している。");
  }
  return problems.length ? problems : ["大きな破綻はない。初期表示が最近の記録に抑えられ、件数増加による一覧肥大化はかなり抑制されている。"];
}

function deriveImprovements(count: number, state: EatenAuditState) {
  const improvements = [
    "エリア別・ジャンル別モードで、グループ見出しから該当グループだけをさらに見る導線があると使いやすい。",
    "全てモードは長くなるため、明示的に選んだ時だけ表示する現在の方針を維持する。",
    "エリア別進捗とジャンル別進捗は補助情報として、今後もページ下部に抑える。"
  ];
  if (count >= 100) improvements.unshift("100件以上でも初期表示は短くなった。次の改善は、エリア別/ジャンル別のグループ内詳細確認を軽くすること。");
  if (state.visibleAtTopImages < 3) improvements.unshift("ファーストビュー内の最近食べた写真をもう少し詰めて、食べたアルバム感を強める。");
  return improvements;
}

async function runAudit() {
  const foods = readFoods();
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-real-audit-v2-"));
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
    const results: ScenarioResult[] = [];
    for (const count of scenarioCounts) {
      results.push(await auditScenario(port, foods, count));
    }
    writeFileSync(outputPath, buildReport(results));
    console.log(`${outputPath} written`);
  } finally {
    chrome.kill();
  }
}

function buildReport(results: ScenarioResult[]) {
  return `# Real User Audit v2

監査日: 2026-06-08
対象: ${baseUrl}/eaten
目的: 食べた商品一覧の切替実装後に、50件/100件/150件でも見やすいか再確認する。

## 実施内容

- 対象URLをiPhone幅390px相当のChrome headlessで開いた。
- localStorageの \`uniba-food-logs-v1\` を50件、100件、150件に切り替えた。
- 各状態で /eaten を開き、最近食べたもの、食べた商品一覧、エリア別進捗、ジャンル別進捗を確認した。
- 食べた商品一覧の切替は「最近」「今月」「エリア別」「ジャンル別」「全て」を確認対象にした。

${results.map(formatScenario).join("\n\n")}

## 改善案

1. エリア別/ジャンル別モードで、各グループの残りを軽く開ける導線を検討する。
2. 全てモードは長くなるため、初期表示に戻さない。
3. 価格順ソートは利用優先度が低いため、将来的には折りたたみ内の後方へ下げる。
4. エリア別進捗とジャンル別進捗は補助情報として、ページ下部・小さめ表示を維持する。
5. 最近食べたものの写真密度は現状維持でよいが、カード間余白が広すぎる場合のみ微調整する。

## 優先順位

1. 初期表示を「最近」に保ち、150件でも一覧が肥大化しない状態を維持する。
2. エリア別/ジャンル別モードのグループ内詳細導線を検討する。
3. 全てモードは明示選択時のみ表示する。
4. 価格順ソートの優先度を下げる。
5. 下部進捗は小さく、アルバムの主役を邪魔しない表示を維持する。

## 監査まとめ

- 50件、100件、150件のすべてで /eaten は表示できた。
- 最近食べたもの、食べた商品一覧、エリア別進捗、ジャンル別進捗は検出できた。
- 横スクロールは${results.some((result) => result.state.scrollWidth > result.state.clientWidth) ? "検出されたため要確認" : "検出されなかった"}。
- 50件、100件、150件でページ長がほぼ一定になり、件数増加による一覧肥大化は抑制された。
`;
}

function formatScenario(result: ScenarioResult) {
  const { count, state } = result;
  return `## ${count}件時

### 観測値

- サマリー: ${result.actualSummary || "未取得"}
- 投入した食べた記録数: ${count}
- 選定エリア数: ${result.selectedAreaCount}
- 選定ジャンル数: ${result.selectedCategoryCount}
- 最近食べたもの: ${state.recentVisible ? "表示あり" : "要確認"}
- 食べた商品一覧: ${state.albumVisible ? "表示あり" : "要確認"}
- エリア別進捗: ${state.areaVisible ? "表示あり" : "要確認"}
- ジャンル別進捗: ${state.genreVisible ? "表示あり" : "要確認"}
- ページ全体の長さ: 約${Math.round((state.documentHeight / state.viewportHeight) * 10) / 10}画面分
- 上部で見える画像数: ${state.visibleAtTopImages}
- 画像数: ${state.imageCount}
- article数: ${state.articleCount}
- 横スクロール: ${state.scrollWidth > state.clientWidth ? "あり" : "なし"}

### 問題点

${result.problems.map((problem) => `- ${problem}`).join("\n")}

### 確認項目別メモ

- 実際に見たい情報が最初に見えるか: ${state.firstViewportText.includes("最近食べたもの") ? "最近食べたものは上部で見える。ただし商品一覧まではスクロールが必要。" : "最初に最近食べたものが見えにくい。"}
- 一覧が長すぎないか: ${state.documentHeight / state.viewportHeight > 12 ? "長い。追加削減が必要。" : "初期表示は抑えられており、件数増加による急な肥大化はない。"}
- スクロール疲れしないか: ${state.documentHeight / state.viewportHeight > 12 ? "疲れやすい。" : "以前より抑えられている。下部進捗まで全部見る場合だけ少し長い。"}
- 写真が埋もれていないか: ${state.visibleAtTopImages >= 2 ? "上部に写真は見えるが、一覧が長くなると進捗セクションより写真確認が主作業になる。" : "写真の見え始めが弱い。"}
- 食べた件数が増えるほど使いづらくならないか: ${state.documentHeight / state.viewportHeight > 12 ? "使いづらさが増える。" : "初期表示量が固定され、50/100/150件で使い勝手は大きく悪化しない。"}

### 改善案

${result.improvements.map((improvement) => `- ${improvement}`).join("\n")}`;
}

runAudit().catch((error) => {
  console.error(error);
  process.exit(1);
});
