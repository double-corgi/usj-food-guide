type LegacyFoodLog = {
  foodId: string;
  status?: string;
  rating?: number;
  memo?: string;
  eatenAt?: string;
  spentAmount?: number;
  eatenCount?: number;
  photoIds?: string[];
  shopId?: string;
  updatedAt?: string;
};

type LegacyBackup = {
  app: string;
  version: number;
  exportedAt: string;
  logs: LegacyFoodLog[];
  nextWantFoodIds?: string[];
};

const foods = new Map([
  ['SNK-262', { id: 'SNK-262', name: 'アメリカン・ホットドッグ', shopId: 'warf', shopName: 'ワーフカフェ', areaId: 'sf', areaName: 'サンフランシスコ・エリア' }],
  ['BRG-026', { id: 'BRG-026', name: 'BBQベーコンチーズバーガーセット', shopId: 'mels', shopName: 'メルズ・ドライブイン', areaId: 'hollywood', areaName: 'ハリウッド・エリア' }],
]);
const shops = new Map([
  ['warf', { id: 'warf', name: 'ワーフカフェ' }],
  ['mels', { id: 'mels', name: 'メルズ・ドライブイン' }],
]);

const backup: LegacyBackup = {
  app: 'uniba-food-guide',
  version: 1,
  exportedAt: '2026-07-16T00:00:00.000Z',
  logs: [
    { foodId: 'legacy:SNK-262', status: 'eaten', rating: 5, memo: 'また食べたい', eatenAt: '2026-07-15T03:00:00.000Z', spentAmount: 600, eatenCount: 2, photoIds: ['p1'], shopId: 'warf', updatedAt: '2026-07-15T04:00:00.000Z' },
    { foodId: 'legacy:SNK-262', status: 'eaten', rating: 5, memo: '重複', eatenAt: '2026-07-15T03:00:00.000Z', spentAmount: 600, eatenCount: 2, shopId: 'warf' },
    { foodId: 'BRG-026', status: 'want', eatenAt: '2026-07-14T03:00:00.000Z', eatenCount: 1, shopId: 'mels' },
  ],
  nextWantFoodIds: ['legacy:SNK-262', 'BRG-026', 'BRG-026'],
};

function canonical(raw: string): string {
  const trimmed = raw.trim();
  if (foods.has(trimmed)) return trimmed;
  const tail = trimmed.split(':').pop() ?? trimmed;
  return foods.has(tail) ? tail : trimmed;
}
function logKey(foodId: string, status: string, eatenAt: string): string {
  return foodId + '|' + status + '|' + Math.floor(new Date(eatenAt).getTime() / 1000);
}

const logs: any[] = [];
const wants: string[] = [];
const keys = new Set<string>();
let duplicateLogsSkipped = 0;
let duplicateWantsSkipped = 0;

for (const legacy of backup.logs) {
  const foodId = canonical(legacy.foodId);
  const status = legacy.status === 'want' ? 'want' : 'eaten';
  const eatenAt = legacy.eatenAt ?? new Date().toISOString();
  const key = logKey(foodId, status, eatenAt);
  if (keys.has(key)) { duplicateLogsSkipped += 1; continue; }
  keys.add(key);
  const food = foods.get(foodId);
  const shop = shops.get(legacy.shopId ?? food?.shopId ?? '');
  logs.push({
    foodId,
    foodNameSnapshot: food?.name,
    status,
    rating: legacy.rating,
    memo: legacy.memo,
    eatenAt,
    spentAmount: legacy.spentAmount,
    eatenCount: Math.max(legacy.eatenCount ?? 1, 1),
    photoIds: legacy.photoIds ?? [],
    shopId: legacy.shopId ?? food?.shopId,
    shopNameSnapshot: shop?.name ?? food?.shopName,
    areaId: food?.areaId,
    areaNameSnapshot: food?.areaName,
    updatedAt: legacy.updatedAt,
  });
}
for (const raw of backup.nextWantFoodIds ?? []) {
  const foodId = canonical(raw);
  if (wants.includes(foodId)) { duplicateWantsSkipped += 1; continue; }
  wants.push(foodId);
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}
assert(logs.length === 2, 'expected 2 imported logs, got ' + logs.length);
assert(wants.length === 2, 'expected 2 imported wants, got ' + wants.length);
assert(duplicateLogsSkipped === 1, 'expected 1 duplicate log skip, got ' + duplicateLogsSkipped);
assert(duplicateWantsSkipped === 1, 'expected 1 duplicate want skip, got ' + duplicateWantsSkipped);
const hotdog = logs.find((log) => log.foodId === 'SNK-262');
assert(hotdog?.foodNameSnapshot === 'アメリカン・ホットドッグ', 'canonical food snapshot not preserved');
assert(hotdog?.rating === 5 && hotdog?.memo === 'また食べたい' && hotdog?.spentAmount === 600, 'rating/memo/amount not preserved');
assert(hotdog?.eatenCount === 2, 'eatenCount not preserved');
assert(hotdog?.photoIds?.[0] === 'p1', 'photoIds not preserved');
assert(hotdog?.shopNameSnapshot === 'ワーフカフェ', 'shop snapshot not resolved');
assert(wants.includes('SNK-262') && wants.includes('BRG-026'), 'want IDs not canonicalized');

console.log('PASS ios-native build5 legacy migration fixture:', JSON.stringify({ sourceLogs: backup.logs.length, sourceWants: backup.nextWantFoodIds?.length ?? 0, logsAdded: logs.length, wantsAdded: wants.length, duplicateLogsSkipped, duplicateWantsSkipped }));
