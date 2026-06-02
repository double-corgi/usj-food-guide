import type { FoodCategory, FoodStatus } from "../../types/domain";

const productKeywordPattern =
  /(チュリ|チュロ|ポップコーン|ターキーレッグ|バーガー|プレート|サンデー|ケーキ|パイ|ドリンク|ラテ|ソーダ|レモネード|カレー|ピザ|ライス|チキン|サンド|セット|コンボ|コースター付き|フラッペ|シェイク|プリン|ワッフル|パフェ|アイス|クッキー|スイーツ|デザート|ビール|ジュース|コーヒー|ティー|カクテル|スープ|ポテト|ナゲット|スナック|ホットドッグ|パスタ|ヌードル|ラーメン|丼|ビーフ|ポーク|ステーキ|ソーセージ|リブ|ロースト|burger|pizza|drink|cake|popcorn|churro|sandwich|chicken|turkey|dessert|sweets|curry|rice|noodle)/i;

const badFragmentPattern =
  /^(?:Global alt|SEO|SEOKeywords|Keywords|Meta|Title|Description|Url Title|Site Title|Swimlane)|Global alt|SEO|Keywords|price amount|販売場所|店舗未確認|左.*右|中.*右|セット内容|\/レストラン|tcm:|GDS|SHARED|href=|src=|class=|function\s*\(|webpack|chunk-|polyfills|canonical|breadcrumb|shortDescription|pagination|コンテンツへ移動|クッキーに関する通知|プライバシー|サイトマップ|商標/i;

const navOnlyPattern =
  /^(?:メニュー|フード|レストラン|店舗|エリア|ニュース|イベント|キャンペーン|チケット|営業時間|アトラクション|ショー|パレード|詳細|画像|写真|公式|販売中|終了|期間限定|近日登場|価格|税込|一覧|おすすめ|閉じる|購入はこちら|詳しくはこちら|詳細はこちら|Map|MAP|マップ|その他)$/i;

const accessoryOnlyPattern =
  /^(?:ドリンク|ソフトドリンク|カップサラダ|サラダ|デザート|フライドポテト|ポテト|チキンナゲット|ナゲット|オレンジドリンク|コーヒー|紅茶|ライス|パン|パンまたはライス|スープ|ソース|トッピング|コースター|ステッカー|ドリンクボトル)(?:付き|付)?$/;

const shopOnlyPattern =
  /(レストラン|カフェ|キッチン|パーラー|グリル|ストア|ショップ|ワーフ|ランディング|アイスクリーム|ポップコーン|スナック|ダイナー|テラス|ラグーン|カート|ワゴン|フィネガンズ|三本の箒|キノピオ|ヨッシー|ピットストップ)$/;

const areaOnlyPattern =
  /^(?:スーパー・ニンテンドー・ワールド|ミニオン・パーク|ウィザーディング・ワールド・オブ・ハリー・ポッター|ハリウッド・エリア|ニューヨーク・エリア|ジュラシック・パーク|アミティ・ビレッジ|サンフランシスコ・エリア|ウォーターワールド|ユニバーサル・ワンダーランド|その他)$/;

const knownShopNamePattern =
  /^(?:アミティ・アイスクリーム|ルイズ\s*N\.?Y\.?\s*ピザパーラー|ビバリーヒルズ・ブランジェリー|スタジオ・スターズ・レストラン|スヌーピー・バックロット・カフェ|ハローキティのコーナーカフェ|メルズ・ドライブイン|ディスカバリー・レストラン|アミティ・ランディング・レストラン|ハピネス・カフェ|フォッシル・フュエルズ|ボードウォーク・スナック|デリシャス・ミー！ザ・クッキー・キッチン|キノピオ・カフェ|ヨッシー・スナック・アイランド|ピットストップ・ポップコーン|三本の箒|マリオ・カフェ&ストア)$/;

const routeOrLocationFragmentPattern =
  /^(?:\d+\s+)?[ァ-ヶー一-龠A-Za-z0-9 .&！!・･-]{2,34}(?:レストラン|カフェ|キッチン|パーラー|グリル|ストア|ショップ|ワーフ|ランディング|アイスクリーム|ポップコーン|スナック|ダイナー|テラス|ラグーン)\s+(?:スーパー・ニンテンドー・ワールド|ミニオン・パーク|ウィザーディング・ワールド・オブ・ハリー・ポッター|ハリウッド・エリア|ニューヨーク・エリア|ジュラシック・パーク|アミティ・ビレッジ|サンフランシスコ・エリア|ウォーターワールド|ユニバーサル・ワンダーランド)$/;

export function removeNonProductPrefixes(raw: string) {
  return raw
    .replace(/^\s*(?:Global alt|SEOKeywords|SEO\s*Keywords|Keywords|SEO\s*Description|SEO\s*Title|Url Title|Site Title|画像|写真)\s*[:：-]?\s*/i, "")
    .replace(/^\s*(?:販売場所|店舗|レストラン|エリア|価格|税込)\s*[:：]\s*[^:：]{0,40}\s*/g, "")
    .replace(/^\s*(?:左|右|中|上|下|中央)\s*[:：)\]）-]?\s*/g, "")
    .replace(/^\s*(?:b|c|d)?\s*\d+\s*(?:alt|heading|title)\s*[:：-]?\s*/i, "");
}

export function cleanFoodName(raw: string) {
  const cleaned = removeNonProductPrefixes(String(raw ?? ""))
    .normalize("NFKC")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&yen;/g, "¥")
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/[™®©]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/[\u{1f000}-\u{1faff}]/gu, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/[【】]/g, "")
    .replace(/(?:￥|¥)\s*\d{1,3}(?:,\d{3})*(?:\s*円)?/g, "")
    .replace(/\d{2,5}(?:,\d{3})?\s*円(?:\s*\(?税込\)?)?/g, "")
    .replace(/\s*(?:税込|税抜|価格|販売中|終了|近日登場|公式|詳細|画像|写真)\s*[:：]?\s*$/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s・:：\-–—|/／,、。]+|[\s・:：\-–—|/／,、。]+$/g, "")
    .trim();
  return cleaned;
}

export function normalizeFoodName(name: string) {
  return cleanFoodName(name)
    .replace(/(?:￥|¥)?\s*\d{1,3}(?:,\d{3})*(?:\s*円)?/g, "")
    .replace(/[・･]/g, "")
    .replace(/[「」『』"']/g, "")
    .replace(/[()\[\]（）【】]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function splitCompositeMenuName(raw: string) {
  const cleaned = cleanFoodName(raw);
  const hasPositionMarkers = /(?:^|[（(])(?:左|右|中|上|下)(?:[）)]|[:：])/.test(cleaned) || /左.*(?:中|右)|中.*右/.test(cleaned);
  const split = cleaned
    .replace(/[（(](?:左|右|中|上|下)[）)]/g, "、")
    .replace(/(?:左|右|中|上|下)\s*[:：]/g, "、")
    .split(/[、,／/]+/)
    .map((part) => cleanFoodName(part))
    .filter(Boolean);
  const meaningful = split.filter((part) => !accessoryOnlyPattern.test(part) && !isGenericFoodName(part));
  return {
    original: cleaned,
    isComposite: hasPositionMarkers || split.length >= 3,
    parts: split,
    productCandidates: meaningful,
    primary: meaningful[0] ?? cleaned
  };
}

export function extractProductNameFromContext(raw: string, context = "") {
  const cleaned = cleanFoodName(raw);
  const composite = splitCompositeMenuName(cleaned);
  if (composite.isComposite && composite.primary && scoreFoodNameQuality(composite.primary) >= 78 && !/[左中右]/.test(cleaned)) {
    return composite.primary;
  }

  const lines = `${cleaned}\n${context}`
    .split(/[\n。|｜]/)
    .map((line) => cleanFoodName(line))
    .filter(Boolean);
  const best = lines
    .filter((line) => line.length <= 50)
    .sort((a, b) => scoreFoodNameQuality(b) - scoreFoodNameQuality(a))[0];
  return best && scoreFoodNameQuality(best) > scoreFoodNameQuality(cleaned) ? best : cleaned;
}

export function isGenericFoodName(name: string) {
  const cleaned = cleanFoodName(name);
  return navOnlyPattern.test(cleaned) || accessoryOnlyPattern.test(cleaned) || areaOnlyPattern.test(cleaned);
}

export function isBadFoodName(name: string) {
  const cleaned = cleanFoodName(name);
  if (!cleaned) return true;
  if (cleaned.length < 3 || cleaned.length > 45) return true;
  if (badFragmentPattern.test(cleaned)) return true;
  if (navOnlyPattern.test(cleaned) || accessoryOnlyPattern.test(cleaned) || areaOnlyPattern.test(cleaned) || knownShopNamePattern.test(cleaned)) return true;
  if (routeOrLocationFragmentPattern.test(cleaned)) return true;
  if (/など$/.test(cleaned)) return true;
  if (/株式会社|有限会社|合同会社|公式サイト/.test(cleaned)) return true;
  if (/^一例/.test(cleaned)) return true;
  if (/おすすめ|ご注意|に関するご注意|罪悪感|による.*ための|ご注文|特典付き|特典|ご購入/.test(cleaned)) return true;
  if (/^\d+.+\s+\d+.+\s+\d+/.test(cleaned)) return true;
  if (/チュリトス\s+ターキーレッグ|ターキーレッグ\s+チュリトス/.test(cleaned)) return true;
  if (/^\d[^\d]+.*\d[^\d]+.*\d/.test(cleaned)) return true;
  if ((cleaned.match(/(?:レストラン|カフェ|パブ|パフェテリア|キッチン|グリル|パーラー|ショップ|スナック)/g) ?? []).length >= 2) return true;
  if (/https?:\/\/|www\.|\.js|\.css|\.json|\.html|\.png|\.jpe?g|\.webp|\.svg/i.test(cleaned)) return true;
  if (/[{}[\]<>]|=>|const\s+|let\s+|var\s+|class=|href=|src=/i.test(cleaned)) return true;
  if (/[、,].*[、,].*[、,]/.test(cleaned)) return true;
  if (/^(?:左|右|中|上|下)\b/.test(cleaned) || /左.*右|中.*右/.test(cleaned)) return true;
  if (/^(?:付き|セット内容|販売場所|レストラン|店舗|その他)/.test(cleaned)) return true;
  if (/^(?:スペシャル・ケーキ|セットメニュー|デザート、ドリンク)$/.test(cleaned)) return true;
  if (/ドリンクステーション$/.test(cleaned)) return true;
  if (/ください|できます|楽しめ|味わえる|いただく|贅沢な時間|イメージ|ご確認|場合があります|ご利用|紹介|登場!|専門店。|レストラン。|モチーフ|きらめく|販売している|点在しています|内観|ロゴ|デザート店|フード店|スナック・スタンド|経営の|専門店$/.test(cleaned)) return true;
  if (/フォト・オポチュニティ|カップケーキ・ドリーム|ハチャメチャ・アイス|ハチャメチャ・ライド|プレイランド|アドベンチャー|ツアー|アトラクション/.test(cleaned)) return true;
  if (/price amount|Url Title|Swimlane|SEOKeywords|tion SEOKeywords/i.test(cleaned)) return true;
  if (/チェス|スライド|ライド|レース|ショー|パレード/.test(cleaned) && !/(プレート|バーガー|ドリンク|ケーキ|チキン|ピザ|カレー|チュリ|ポップコーン|アイス|パフェ|サンド)/.test(cleaned)) return true;
  if (/\d+\s*(?:price|amount)\s*\d+/i.test(cleaned)) return true;
  if (/^[a-z0-9_-]+$/i.test(cleaned)) return true;
  if (symbolRatio(cleaned) > 0.24) return true;
  if (shopOnlyPattern.test(cleaned) && !productKeywordPattern.test(cleaned)) return true;
  return false;
}

export function scoreFoodNameQuality(name: string) {
  const cleaned = cleanFoodName(name);
  if (!cleaned) return 0;
  let score = 50;
  if (cleaned.length >= 5 && cleaned.length <= 28) score += 16;
  if (cleaned.length >= 29 && cleaned.length <= 42) score += 6;
  if (cleaned.length < 4) score -= 22;
  if (cleaned.length > 45) score -= 42;
  if (productKeywordPattern.test(cleaned)) score += 24;
  if (/チュリトス|ポップコーン|ターキーレッグ|バーガー|プレート|サンデー|ケーキ|ドリンク|ラテ|ソーダ|カレー|ピザ|ライス|チキン|サンド|セット/.test(cleaned)) score += 10;
  if (/コースター付き|ボトル|マグ|カップ|バケツ/.test(cleaned) && productKeywordPattern.test(cleaned)) score += 5;
  if (badFragmentPattern.test(cleaned)) score -= 45;
  if (navOnlyPattern.test(cleaned) || accessoryOnlyPattern.test(cleaned) || areaOnlyPattern.test(cleaned) || knownShopNamePattern.test(cleaned)) score -= 55;
  if (routeOrLocationFragmentPattern.test(cleaned)) score -= 55;
  if (/など$/.test(cleaned)) score -= 40;
  if (/株式会社|有限会社|合同会社|公式サイト/.test(cleaned)) score -= 55;
  if (/^一例/.test(cleaned)) score -= 55;
  if (/おすすめ|ご注意|に関するご注意|罪悪感|による.*ための|ご注文|特典付き|特典|ご購入/.test(cleaned)) score -= 55;
  if (/^\d+.+\s+\d+.+\s+\d+/.test(cleaned)) score -= 55;
  if (/チュリトス\s+ターキーレッグ|ターキーレッグ\s+チュリトス/.test(cleaned)) score -= 55;
  if (/^\d[^\d]+.*\d[^\d]+.*\d/.test(cleaned)) score -= 55;
  if ((cleaned.match(/(?:レストラン|カフェ|パブ|パフェテリア|キッチン|グリル|パーラー|ショップ|スナック)/g) ?? []).length >= 2) score -= 55;
  if (/[、,].*[、,].*[、,]/.test(cleaned)) score -= 34;
  if (/左.*右|中.*右|セット内容/.test(cleaned)) score -= 38;
  if (/販売場所|店舗:|レストラン/.test(cleaned)) score -= 32;
  if (/^(?:スペシャル・ケーキ|セットメニュー|デザート、ドリンク)$/.test(cleaned) || /ドリンクステーション$/.test(cleaned)) score -= 55;
  if (/ください|できます|楽しめ|味わえる|いただく|贅沢な時間|イメージ|ご確認|場合があります|紹介|専門店。|レストラン。|モチーフ|きらめく|販売している|点在しています|内観|ロゴ|デザート店|フード店|スナック・スタンド|経営の|専門店$/.test(cleaned)) score -= 42;
  if (/フォト・オポチュニティ|カップケーキ・ドリーム|ハチャメチャ・アイス|ハチャメチャ・ライド|プレイランド|アドベンチャー|ツアー|アトラクション/.test(cleaned)) score -= 55;
  if (/price amount|Url Title|Swimlane|SEOKeywords|tion SEOKeywords/i.test(cleaned)) score -= 55;
  if (/チェス|スライド|ライド|レース|ショー|パレード/.test(cleaned) && !/(プレート|バーガー|ドリンク|ケーキ|チキン|ピザ|カレー|チュリ|ポップコーン|アイス|パフェ|サンド)/.test(cleaned)) score -= 45;
  if (/https?:\/\/|\.js|\.css|\.json|\.html|[{}[\]<>]/i.test(cleaned)) score -= 50;
  if (symbolRatio(cleaned) > 0.24) score -= 24;
  if (shopOnlyPattern.test(cleaned) && !productKeywordPattern.test(cleaned)) score -= 34;
  if (!/[ァ-ヶー一-龠A-Za-z0-9]/.test(cleaned)) score -= 40;
  return Math.max(0, Math.min(100, score));
}

export function inferCategory(text: string): FoodCategory {
  const value = text.toLowerCase();
  if (/チュリ|チュロ|churro|churr/.test(value)) return "churro";
  if (/レモネード|カクテル/.test(value)) return "drink";
  if (/ポップコーン|popcorn/.test(value)) return "popcorn";
  if (/キッズ|お子さま|おこさま|kids|child/.test(value)) return "kids";
  if (/ラザニア|lasagna/.test(value)) return "noodle";
  if (/ブリトー|burrito/.test(value)) return "set";
  if (/(チキン|ポーク|ビーフ|ロティサリー|スモーク|シェパーズ).*(パイ|pie)/.test(value)) return "chicken";
  if (/ケーキ|パフェ|アイス|クッキー|スイーツ|デザート|プリン|プディング|ティラミス|チョコ|ワッフル|サンデー|パイ|シュークリーム|cake|dessert|cookie|sweets|ice|pudding|cream puff/.test(value)) return "dessert";
  if (/ドリンク|drink|ソーダ|レモネード|ジュース|コーヒー|ラテ|ビール|カクテル|シェイク|ティー|tea|beer|shake|フラッペ/.test(value)) return "drink";
  if (/pizza|ピザ|ピッツァ/.test(value)) return "pizza";
  if (/バーガー|ハンバーガー|サンド|burger|sandwich/.test(value)) return "burger";
  if (/ラーメン|ヌードル|パスタ|スパゲ|noodle|pasta/.test(value)) return "noodle";
  if (/カレー|丼|ライス|rice|curry/.test(value)) return "rice";
  if (/ターキー|チキン|ビーフ|ポーク|肉|ステーキ|ソーセージ|リブ|ロースト|chicken|turkey|beef|pork|meat/.test(value)) return "chicken";
  if (/スナック|フライ|ポテト|ナゲット|プレッツェル|ホットドッグ|snack|fries/.test(value)) return "snack";
  if (/セット|プレート|コンボ|コース|set|combo|meal|platter/.test(value)) return "set";
  if (/限定|季節|スペシャル|フェア|summer|winter|halloween|christmas|cool japan|one piece|コラボ/.test(value)) return "seasonal";
  return "unknown";
}

export function inferLimited(text: string) {
  return /限定|期間|季節|イベント|フェア|コラボ|summer|winter|halloween|christmas|cool japan|one piece|special/i.test(text);
}

export function inferStatus(startDate?: string, endDate?: string, now = new Date()): FoodStatus {
  const today = now.toISOString().slice(0, 10);
  if (startDate && startDate > today) return "scheduled";
  if (endDate && today > endDate) return "ended";
  if (startDate || endDate) return "active";
  return "unknown";
}

export function looksLikeFoodName(text: string) {
  const cleaned = cleanFoodName(text);
  return scoreFoodNameQuality(cleaned) >= 64 && !isBadFoodName(cleaned);
}

export function levenshteinDistance(a: string, b: string) {
  const left = normalizeFoodName(a);
  const right = normalizeFoodName(b);
  const matrix = Array.from({ length: left.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[left.length][right.length];
}

export function similarity(a: string, b: string) {
  const left = normalizeFoodName(a);
  const right = normalizeFoodName(b);
  const max = Math.max(left.length, right.length);
  if (max === 0) return 1;
  return 1 - levenshteinDistance(left, right) / max;
}

function symbolRatio(text: string) {
  if (text.length === 0) return 1;
  const symbols = text.replace(/[ァ-ヶー一-龠a-zA-Z0-9ぁ-ん\s・ー〜&!！'".()（）-]/g, "").length;
  return symbols / text.length;
}
