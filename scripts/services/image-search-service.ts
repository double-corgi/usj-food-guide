import type { GeneratedFood } from "../types/generated";

export type ImageSearchItem = {
  candidateUrl: string;
  thumbnailUrl?: string;
  sourcePage?: string;
  sourceName?: string;
  query: string;
  imageWidth?: number;
  imageHeight?: number;
  title?: string;
};

export type ImageSearchStats = {
  enabled: boolean;
  provider: "manual-search-links";
  requests: number;
  items: number;
  queries: number;
  errors: string[];
};

export function getGoogleSearchEngineId() {
  return undefined;
}

export function isGoogleImageSearchEnabled() {
  return false;
}

export async function searchGoogleImagesForFoods(_foods: GeneratedFood[]) {
  return [];
}

export async function searchGoogleImagesForFoodsWithStats(foods: GeneratedFood[]) {
  const queries = foods.reduce((total, food) => total + buildImageSearchQueries(food).length, 0);
  const stats: ImageSearchStats = {
    enabled: false,
    provider: "manual-search-links",
    requests: 0,
    items: 0,
    queries,
    errors: []
  };
  return { items: [] as ImageSearchItem[], stats };
}

export function buildImageSearchQueries(food: GeneratedFood) {
  const base = food.name.replace(/\s+/g, " ").trim();
  const queries = [`${base} USJ`, `${base} ユニバ`, `${base} フード`];
  if (food.category === "churro" || /チュリトス|チュロス|churro|churros/i.test(food.name)) {
    queries.push(`${base} チュリトス USJ`, `${base} チュロス USJ`, `${base} ユニバ チュリトス`);
  }
  return Array.from(new Set(queries));
}
