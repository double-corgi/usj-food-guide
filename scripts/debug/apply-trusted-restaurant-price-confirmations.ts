import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type PriceSource = "official" | "menu_photo" | "trusted_report" | "social_report";

type PriceConfirmation = {
  foodId: string;
  name: string;
  price: number;
  sourceUrl: string;
  sourceName: string;
  sourceType: PriceSource;
  sourceQuote: string;
};

const confirmations: PriceConfirmation[] = [
  {
    foodId: "food-1efoz95",
    name: "スタジオ・スターズ 25周年スペシャルプレート",
    price: 25000,
    sourceUrl: "https://usj.opus21.net/restaurant/studio-stars.html",
    sourceName: "USJ情報サイト スタジオスターズレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "スタジオ・スターズ 25周年スペシャルプレート （４名分）¥25,000"
  },
  {
    foodId: "food-1hhn874",
    name: "BBQ ポークリブ&フライドチキン・プレート",
    price: 2600,
    sourceUrl: "https://usj.opus21.net/restaurant/studio-stars.html",
    sourceName: "USJ情報サイト スタジオスターズレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "BBQ ポークリブ＆フライドチキン・プレート ¥2,600"
  },
  {
    foodId: "food-ehewed",
    name: "スタジオ・スターズ BLT バーガー・プレート",
    price: 2500,
    sourceUrl: "https://usj.opus21.net/restaurant/studio-stars.html",
    sourceName: "USJ情報サイト スタジオスターズレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "スタジオ・スターズ BLT バーガー・プレート ¥2,500"
  },
  {
    foodId: "food-1f1v45i",
    name: "チキンレッグカレー・プレート",
    price: 2500,
    sourceUrl: "https://usj.opus21.net/restaurant/studio-stars.html",
    sourceName: "USJ情報サイト スタジオスターズレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "チキンレッグカレー・プレート ¥2,500"
  },
  {
    foodId: "food-ajq9zg",
    name: "クラムチャウダーグラタン・プレート",
    price: 2500,
    sourceUrl: "https://usj.opus21.net/restaurant/studio-stars.html",
    sourceName: "USJ情報サイト スタジオスターズレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "クラムチャウダーグラタン・プレート ¥2,500"
  },
  {
    foodId: "food-19tglum",
    name: "T-REX・ガーリックトマト・ビーフバーガーセット",
    price: 4500,
    sourceUrl: "https://usj.opus21.net/restaurant/discovery-restaurant.html",
    sourceName: "USJ情報サイト ディスカバリーレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "T-REX・ガーリックトマト・ビーフバーガーセット ¥4,500"
  },
  {
    foodId: "food-1x0ir52",
    name: "プテラノドン・フライドチキンバーガーセット",
    price: 2300,
    sourceUrl: "https://usj.opus21.net/restaurant/discovery-restaurant.html",
    sourceName: "USJ情報サイト ディスカバリーレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "プテラノドン・フライドチキンバーガーセット ¥2,300"
  },
  {
    foodId: "food-yhtmyt",
    name: "モササウルス・フィッシュバーガーセット",
    price: 2200,
    sourceUrl: "https://usj.opus21.net/restaurant/discovery-restaurant.html",
    sourceName: "USJ情報サイト ディスカバリーレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "モササウルス・フィッシュバーガーセット ¥2,200"
  },
  {
    foodId: "food-9s2577",
    name: "ジュラシックパーク・ケーキ ~チョコ&ダークチェリー~",
    price: 2000,
    sourceUrl: "https://usj.opus21.net/restaurant/discovery-restaurant.html",
    sourceName: "USJ情報サイト ディスカバリーレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ジュラシックパークケーキ～チョコ＆ダークチェリー～ ¥2,000"
  },
  {
    foodId: "food-15hqyi6",
    name: "フライングダイナソー・カップケーキ ~チョコ&ラズベリー~",
    price: 900,
    sourceUrl: "https://usj.opus21.net/restaurant/discovery-restaurant.html",
    sourceName: "USJ情報サイト ディスカバリーレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "フライングダイナソー・カップケーキ ～チョコ＆ラズベリー～ ¥900"
  },
  {
    foodId: "food-rvos7a",
    name: "プルドポークバーガー 25周年コースターセット",
    price: 2300,
    sourceUrl: "https://usj.opus21.net/restaurant/mels-drivein.html",
    sourceName: "USJ情報サイト メルズドライブイン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "プルドポークバーガー 25周年コースターセット ¥2,300"
  },
  {
    foodId: "food-hyfchi",
    name: "BBQベーコンチーズバーガーセット",
    price: 2000,
    sourceUrl: "https://usj.opus21.net/restaurant/mels-drivein.html",
    sourceName: "USJ情報サイト メルズドライブイン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "BBQ ベーコン チーズバーガーセット ¥2,000"
  },
  {
    foodId: "food-1ulknep",
    name: "クラシックチーズバーガーセット",
    price: 1900,
    sourceUrl: "https://usj.opus21.net/restaurant/mels-drivein.html",
    sourceName: "USJ情報サイト メルズドライブイン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "クラシックチーズバーガーセット ¥1,900"
  },
  {
    foodId: "food-14hntqo",
    name: "アメリカン・アップルクランブルパイ",
    price: 600,
    sourceUrl: "https://usj.opus21.net/restaurant/mels-drivein.html",
    sourceName: "USJ情報サイト メルズドライブイン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "アメリカン・アップルクランブルパイ ¥600"
  },
  {
    foodId: "food-ei17e1",
    name: "スパイシーシュリンプ・ブリトーセット",
    price: 2600,
    sourceUrl: "https://usj.opus21.net/restaurant/amity-landing.html",
    sourceName: "USJ情報サイト アミティランディングレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "スパイシーシュリンプ・ブリトーセット ¥2,600"
  },
  {
    foodId: "food-k6pr7l",
    name: "チキン&アボカド・ブリトーセット",
    price: 2200,
    sourceUrl: "https://usj.opus21.net/restaurant/amity-landing.html",
    sourceName: "USJ情報サイト アミティランディングレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "チキン＆アボカド・ブリトーセット ¥2,200"
  },
  {
    foodId: "food-1mjhxhz",
    name: "バーベキューポーク・ブリトーセット",
    price: 2100,
    sourceUrl: "https://usj.opus21.net/restaurant/amity-landing.html",
    sourceName: "USJ情報サイト アミティランディングレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "バーベキューポーク・ブリトーセット ¥2,100"
  },
  {
    foodId: "food-1u4li6v",
    name: "チリコンカンビーンズ・ブリトーセット",
    price: 2000,
    sourceUrl: "https://usj.opus21.net/restaurant/amity-landing.html",
    sourceName: "USJ情報サイト アミティランディングレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "チリコンカンビーンズ・ブリトーセット ¥2,000"
  },
  {
    foodId: "food-1hcq7im",
    name: "モンスターハンター・ワイルズ×USJ限定コースターセット",
    price: 3500,
    sourceUrl: "https://usj.opus21.net/restaurant/lost-world.html",
    sourceName: "USJ情報サイト ロストワールドレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "モンスターハンターワイルズ×USJ限定コースターセット ¥3,500"
  },
  {
    foodId: "food-11pjv41",
    name: "オトモアイルーのチョコレートプリン マグカップ付",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/lost-world.html",
    sourceName: "USJ情報サイト ロストワールドレストラン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "オトモアイルーのチョコレートプリン マグカップ付 ¥1,600"
  },
  {
    foodId: "food-11urhsj",
    name: "チキンとトマトクリーム・スパゲティセット",
    price: 1800,
    sourceUrl: "https://usj.opus21.net/restaurant/snoopy-cafe.html",
    sourceName: "USJ情報サイト スヌーピーバックロットカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "チキンとトマトクリーム・スパゲティセット ¥1,800"
  },
  {
    foodId: "food-14ut653",
    name: "ミートスパゲティセット",
    price: 1700,
    sourceUrl: "https://usj.opus21.net/restaurant/snoopy-cafe.html",
    sourceName: "USJ情報サイト スヌーピーバックロットカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ミートスパゲティセット ¥1,700"
  },
  {
    foodId: "food-1ufz462",
    name: "テリヤキビーフバーガーセット",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/snoopy-cafe.html",
    sourceName: "USJ情報サイト スヌーピーバックロットカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "テリヤキビーフバーガーセット ¥1,600"
  },
  {
    foodId: "food-15u1343",
    name: "エビカツバーガーセット",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/snoopy-cafe.html",
    sourceName: "USJ情報サイト スヌーピーバックロットカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "エビカツバーガーセット ¥1,600"
  },
  {
    foodId: "food-1swgjnq",
    name: "ウッドストックのふんわりケーキ ~レモン&リンゴ~",
    price: 850,
    sourceUrl: "https://usj.opus21.net/restaurant/snoopy-cafe.html",
    sourceName: "USJ情報サイト スヌーピーバックロットカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ウッドストックのふんわりケーキ ～レモン＆リンゴ～ ¥850"
  },
  {
    foodId: "food-1ojz6jw",
    name: "ボブのワッフルチキンプレート",
    price: 2600,
    sourceUrl: "https://usj.opus21.net/restaurant/happiness-cafe.html",
    sourceName: "USJ情報サイト ハピネスカフェ",
    sourceType: "trusted_report",
    sourceQuote: "ボブのワッフルチキンプレート ¥2,600"
  },
  {
    foodId: "food-1435vjy",
    name: "スチュアートのベーコンチーズ・バーガープレート",
    price: 2400,
    sourceUrl: "https://usj.opus21.net/restaurant/happiness-cafe.html",
    sourceName: "USJ情報サイト ハピネスカフェ",
    sourceType: "trusted_report",
    sourceQuote: "スチュアートのベーコンチーズ・バーガープレート ¥2,400"
  },
  {
    foodId: "food-1fcbolg",
    name: "デイブのキーマカレープレート",
    price: 2200,
    sourceUrl: "https://usj.opus21.net/restaurant/happiness-cafe.html",
    sourceName: "USJ情報サイト ハピネスカフェ",
    sourceType: "trusted_report",
    sourceQuote: "デイブのキーマカレープレート ¥2,200"
  },
  {
    foodId: "food-5ib5k3",
    name: "パンケーキ・サンド マリオの帽子 ~いちごのショートケーキ~",
    price: 950,
    sourceUrl: "https://usj.opus21.net/restaurant/mario-cafe.html",
    sourceName: "USJ情報サイト マリオカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "パンケーキ・サンド マリオの帽子 ～いちごのショートケーキ～ ¥950"
  },
  {
    foodId: "food-nzx6eb",
    name: "マリオの帽子 パンケーキサンド ~いちごのショートケーキ~",
    price: 950,
    sourceUrl: "https://usj.opus21.net/restaurant/mario-cafe.html",
    sourceName: "USJ情報サイト マリオカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "パンケーキ・サンド マリオの帽子 ～いちごのショートケーキ～ ¥950"
  },
  {
    foodId: "food-176nkkn",
    name: "アンガス牛と阿波尾鶏のグリルプレート ガーリックライス添え",
    price: 3500,
    sourceUrl: "https://usj.opus21.net/restaurant/parkside-grill.html",
    sourceName: "USJ情報サイト パークサイドグリル 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "アンガス牛と阿波尾鶏のグリルプレート ガーリックライス添え ¥3,500"
  },
  {
    foodId: "food-frqwfd",
    name: "サーモンと有頭エビのグリルプレート ガーリックライス添え",
    price: 3500,
    sourceUrl: "https://usj.opus21.net/restaurant/parkside-grill.html",
    sourceName: "USJ情報サイト パークサイドグリル 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "サーモンと有頭エビのグリルプレート ガーリックライス添え ¥3,500"
  },
  {
    foodId: "food-1kx2jev",
    name: "ツナマヨ&サクラエビ ピッツァ・デニッシュセット",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/boardwalk-snacks.html",
    sourceName: "USJ情報サイト ボードウォークスナック 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ツナマヨ＆サクラエビ ピッツァ・デニッシュセット ¥1,600"
  },
  {
    foodId: "food-xagefj",
    name: "ピッツァ・デニッシュセット~ツナマヨ&サクラエビ~",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/boardwalk-snacks.html",
    sourceName: "USJ情報サイト ボードウォークスナック 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ツナマヨ＆サクラエビ ピッツァ・デニッシュセット ¥1,600"
  },
  {
    foodId: "food-1ocz8a8",
    name: "照り焼きチキン ピッツァ・デニッシュセット",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/boardwalk-snacks.html",
    sourceName: "USJ情報サイト ボードウォークスナック 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "照り焼きチキン ピッツァ・デニッシュセット ¥1,600"
  },
  {
    foodId: "food-1rsazo8",
    name: "ピッツァ・デニッシュセット ~照り焼きチキン~",
    price: 1600,
    sourceUrl: "https://usj.opus21.net/restaurant/boardwalk-snacks.html",
    sourceName: "USJ情報サイト ボードウォークスナック 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "照り焼きチキン ピッツァ・デニッシュセット ¥1,600"
  },
  {
    foodId: "food-fypsmi",
    name: "海鮮丼御膳",
    price: 3800,
    sourceUrl: "https://usj.opus21.net/restaurant/saido.html",
    sourceName: "USJ情報サイト SAIDO 彩道 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "海鮮丼御膳 ¥3,800"
  },
  {
    foodId: "food-9i5pia",
    name: "牛ステーキ丼御膳",
    price: 3800,
    sourceUrl: "https://usj.opus21.net/restaurant/saido.html",
    sourceName: "USJ情報サイト SAIDO 彩道 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "牛ステーキ丼御膳 ¥3,800"
  },
  {
    foodId: "food-1nthc13",
    name: "NYチーズケーキ&ほうじ茶の和風パフェ",
    price: 1500,
    sourceUrl: "https://usj.opus21.net/restaurant/saido.html",
    sourceName: "USJ情報サイト SAIDO 彩道 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "NYチーズケーキ＆ほうじ茶の和風パフェ ¥1,500"
  },
  {
    foodId: "food-1ksr7hg",
    name: "アイスクリーム スチュアート・バケツ スプーン付き",
    price: 950,
    sourceUrl: "https://usj.opus21.net/restaurant/amity-icecream.html",
    sourceName: "USJ情報サイト アミティアイスクリーム 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "アイスクリーム スチュアート・バケツ スプーン付き シングル ¥950"
  },
  {
    foodId: "food-1qcrkg3",
    name: "アイスクリーム スチュアート・バケツ スプーン",
    price: 950,
    sourceUrl: "https://usj.opus21.net/restaurant/amity-icecream.html",
    sourceName: "USJ情報サイト アミティアイスクリーム 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "アイスクリーム スチュアート・バケツ スプーン付き シングル ¥950"
  },
  {
    foodId: "food-26b5s0",
    name: "ホットドッグ&ドリンクセット",
    price: 1150,
    sourceUrl: "https://usj.opus21.net/restaurant/wharf-cafe.html",
    sourceName: "USJ情報サイト ワーフカフェ 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ホットドッグ＆ドリンクセット ¥1,150"
  },
  {
    foodId: "food-7nyguw",
    name: "ミニオン・クッキーサンド ストロベリーレアチーズ",
    price: 700,
    sourceUrl: "https://usj.opus21.net/restaurant/minions-delicious-me.html",
    sourceName: "USJ情報サイト デリシャス・ミー ザ・クッキー・キッチン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ミニオン・クッキーサンド ストロベリーレアチーズ ¥700"
  },
  {
    foodId: "food-1rqbb9j",
    name: "ミニオン・クッキーサンド バナナアイス&フルーツ",
    price: 700,
    sourceUrl: "https://usj.opus21.net/restaurant/minions-delicious-me.html",
    sourceName: "USJ情報サイト デリシャス・ミー ザ・クッキー・キッチン 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ミニオン・クッキーサンド バナナアイス＆フルーツ ¥700"
  },
  {
    foodId: "food-qx91pr",
    name: "彩り野菜のミックスサンドウィッチセット",
    price: 1800,
    sourceUrl: "https://usj.opus21.net/restaurant/beverlyhills-boulangerie.html",
    sourceName: "USJ情報サイト ビバリーヒルズブランジェリー",
    sourceType: "trusted_report",
    sourceQuote: "彩り野菜のミックスサンドウィッチセット ¥1,800"
  },
  {
    foodId: "food-mioln1",
    name: "ヒンメルのオムレツプレート",
    price: 2800,
    sourceUrl: "https://mmmemousj.com/index.php/2026/05/30/usj-frieren-beyond-journeys-end/",
    sourceName: "mmmmemo USJフリーレンコラボ現地レポート",
    sourceType: "trusted_report",
    sourceQuote: "ヒンメルのオムレツプレート 2800円"
  },
  {
    foodId: "food-1u1wwri",
    name: "アイゼン&ハイターのハンバーグとフィッシュ&チップスプレート",
    price: 2800,
    sourceUrl: "https://mmmemousj.com/index.php/2026/05/30/usj-frieren-beyond-journeys-end/",
    sourceName: "mmmmemo USJフリーレンコラボ現地レポート",
    sourceType: "trusted_report",
    sourceQuote: "アイゼン＆ハイターのハンバーグとフィッシュ＆チップスプレート 2800円"
  },
  {
    foodId: "food-xitytu",
    name: "たのしい旅の宝箱 キッズセット",
    price: 1400,
    sourceUrl: "https://mmmemousj.com/index.php/2026/05/30/usj-frieren-beyond-journeys-end/",
    sourceName: "mmmmemo USJフリーレンコラボ現地レポート",
    sourceType: "trusted_report",
    sourceQuote: "たのしい旅の宝箱 キッズセット 1400円"
  },
  {
    foodId: "food-1fmms6w",
    name: "フェルンのチェリー&ブルーベリーパフェ(蝶のスプーン付)",
    price: 2200,
    sourceUrl: "https://mmmemousj.com/index.php/2026/05/30/usj-frieren-beyond-journeys-end/",
    sourceName: "mmmmemo USJフリーレンコラボ現地レポート",
    sourceType: "trusted_report",
    sourceQuote: "フェルンのチェリー＆ブルーベリーパフェ（蝶のスプーン付き） 2200円"
  },
  {
    foodId: "food-1rhhv0e",
    name: "シュタルクのショコラ&ラズベリーケーキ",
    price: 1000,
    sourceUrl: "https://mmmemousj.com/index.php/2026/05/30/usj-frieren-beyond-journeys-end/",
    sourceName: "mmmmemo USJフリーレンコラボ現地レポート",
    sourceType: "trusted_report",
    sourceQuote: "シュタルクのショコラ＆ラズベリーケーキ 1000円"
  },
  {
    foodId: "food-13ex3cf",
    name: "花香る フリーレンのホワイトソーダ(フリーレンコースター付)",
    price: 1400,
    sourceUrl: "https://mmmemousj.com/index.php/2026/05/30/usj-frieren-beyond-journeys-end/",
    sourceName: "mmmmemo USJフリーレンコラボ現地レポート",
    sourceType: "trusted_report",
    sourceQuote: "花香る フリーレンのホワイトソーダ（フリーレンコースター付き） 単品 1400円"
  },
  {
    foodId: "food-1pc1exr",
    name: "黒閃! チキンピザブレッド ~旨辛ガーリック~",
    price: 1000,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-crawl.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "黒閃！ チキンピザブレッド ～旨辛ガーリック～ ¥1,000"
  },
  {
    foodId: "food-mvm1if",
    name: "呪術高専1年ズのサンドウィッチセット",
    price: 2100,
    sourceUrl: "https://nonno.hpplus.jp/lifestyle/travel/331397/",
    sourceName: "non-no web USJ呪術廻戦フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "呪術高専1年ズのサンドウィッチセット ￥2100"
  },
  {
    foodId: "food-1t33gzj",
    name: "呪術高専のグレープフルーツ・レモネード(アイス/ホット)",
    price: 800,
    sourceUrl: "https://nonno.hpplus.jp/lifestyle/travel/331397/",
    sourceName: "non-no web USJ呪術廻戦フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "呪術高専のグレープフルーツ・レモネード（アイス/ホット）￥800"
  },
  {
    foodId: "food-5wzkg2",
    name: "呪術高専のグレープフルーツ・レモネード(ホット/アイス)",
    price: 800,
    sourceUrl: "https://nonno.hpplus.jp/lifestyle/travel/331397/",
    sourceName: "non-no web USJ呪術廻戦フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "呪術高専のグレープフルーツ・レモネード（アイス/ホット）￥800"
  },
  {
    foodId: "food-1tt4lsm",
    name: "蝶ネクタイ型サンドウィッチ ボックス",
    price: 1500,
    sourceUrl: "https://anna-media.jp/archives/1134040",
    sourceName: "anna 名探偵コナン・ワールド フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "蝶ネクタイ型サンドウィッチ ボックス（1,500円）"
  },
  {
    foodId: "food-6vmlhh",
    name: "フルーツサングリアティー&シェリービネガー(アイス/ホット)",
    price: 800,
    sourceUrl: "https://anna-media.jp/archives/1134040",
    sourceName: "anna 名探偵コナン・ワールド フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "フルーツサングリアティー＆シェリービネガー（800円）"
  },
  {
    foodId: "food-5o6h85",
    name: "マリオカート・ポップコーンバケツ",
    price: 5500,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "マリオカート ポップコーンバケツ ¥5,500"
  },
  {
    foodId: "food-c2z2tz",
    name: "めざせ大悪党! デイブ・ポップコーンバケツ",
    price: 4500,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ティム＆デイブミニオンポップコーンバケツ 各¥4,500"
  },
  {
    foodId: "food-19w9xaa",
    name: "ティム・ポップコーンバケツ",
    price: 4500,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ティム＆デイブミニオンポップコーンバケツ 各¥4,500"
  },
  {
    foodId: "food-1n8s9rw",
    name: "ターキーレッグ",
    price: 1400,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ターキーレッグ ¥1,400"
  },
  {
    foodId: "food-84qjxm",
    name: "ブラックペッパー・ポークリブ",
    price: 1000,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ブラックペッパー・ポークリブ ¥1,000"
  },
  {
    foodId: "food-bsvsuj",
    name: "チャイニーズ・ポークリブ",
    price: 1000,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "チャイニーズ・ポークリブ ¥1,000"
  },
  {
    foodId: "food-19nx8rb",
    name: "ターキーレッグ!? まん",
    price: 850,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ターキーレッグ!? まん ¥850"
  },
  {
    foodId: "food-103cri5",
    name: "ミニオンまん ~ハチャメチャカレー~",
    price: 800,
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト 食べ歩きフード 2026年版",
    sourceType: "trusted_report",
    sourceQuote: "ミニオンまん ¥800"
  },
  {
    foodId: "food-62sv4l",
    name: "スーパースター・アニバーサリープレート ~マッシュルーム・ラザニア&フライドチキン~",
    price: 3500,
    sourceUrl: "https://www.lmaga.jp/news/2026/03/1037375/?cv=p",
    sourceName: "Lmaga.jp USJ 25周年フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "スーパースター・アニバーサリープレート ～マッシュルーム・ラザニア＆フライドチキン～（3500円）"
  },
  {
    foodId: "food-cygfys",
    name: "スーパー・ニンテンドー・ワールド・アニバーサリーケーキ(4名様分)",
    price: 6000,
    sourceUrl: "https://www.lmaga.jp/news/2026/03/1037375/?cv=p",
    sourceName: "Lmaga.jp USJ 25周年フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "スーパー・ニンテンドー・ワールド・アニバーサリーケーキ（4名分・6000円）"
  },
  {
    foodId: "food-161ftzo",
    name: "JAWSがくるぞ!~クリームソーダ・ロールケーキ~",
    price: 600,
    sourceUrl: "https://castel.jp/item/93831/",
    sourceName: "CASTEL USJフード商品情報",
    sourceType: "trusted_report",
    sourceQuote: "JAWSがくるぞ！～クリームソーダ・ロールケーキ～（600円）"
  },
  {
    foodId: "food-u2l4ko",
    name: "DK クラッシュサンデー ~トロピカルバナナ・フレーバー~",
    price: 1500,
    sourceUrl: "https://usj.opus21.net/restaurant/nintendoworld-jungle-beat-shakes.html",
    sourceName: "USJ情報サイト ジャングル・ビート・シェイク メニュー",
    sourceType: "trusted_report",
    sourceQuote: "DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ ¥1,500"
  },
  {
    foodId: "food-1yi0toj",
    name: "DK クラッシュサンデー ~トロピカルバナナ・フレーバー~ マグカップ付き",
    price: 2200,
    sourceUrl: "https://usj.opus21.net/restaurant/nintendoworld-jungle-beat-shakes.html",
    sourceName: "USJ情報サイト ジャングル・ビート・シェイク メニュー",
    sourceType: "trusted_report",
    sourceQuote: "DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き ¥2,200"
  },
  {
    foodId: "food-1wc5ggu",
    name: "DK クラッシュサンデー ~トロピカルバナナ・フレーバー~ マグカップ付き",
    price: 2200,
    sourceUrl: "https://usj.opus21.net/restaurant/nintendoworld-jungle-beat-shakes.html",
    sourceName: "USJ情報サイト ジャングル・ビート・シェイク メニュー",
    sourceType: "trusted_report",
    sourceQuote: "DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き ¥2,200"
  },
  {
    foodId: "food-fcx2hy",
    name: "スーパーキノコ・ドリンクボトル",
    price: 2700,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2029147.html",
    sourceName: "GAME Watch USJスーパーマリオ・ドリンクボトル紹介",
    sourceType: "trusted_report",
    sourceQuote: "ヨッシー&タマゴ/1UPキノコ/スーパーキノコ ドリンクボトル 価格：各2,700円"
  },
  {
    foodId: "food-1tt1au7",
    name: "アメリカン・ホットドッグ",
    price: 600,
    sourceUrl: "https://castel.jp/p/1805",
    sourceName: "CASTEL USJランチ・食べ歩きメニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "ワーフカフェは、ボリューミーなアメリカン・ホットドッグ（600円）やドリンクを販売"
  },
  {
    foodId: "food-r24nsm",
    name: "大悪党のためのドーナツ・バーガー ~BBQ ポーク&ベーコン~",
    price: 1200,
    sourceUrl: "https://castel.jp/p/5611",
    sourceName: "CASTEL 2026年ミニオンフードまとめ",
    sourceType: "trusted_report",
    sourceQuote: "大悪党のためのドーナツ・バーガー～BBQ ポーク&ベーコン～：1,200円"
  },
  {
    foodId: "food-1kvqau2",
    name: "憧れの大悪党? ボブ・ドリンクボトル",
    price: 2300,
    sourceUrl: "https://castel.jp/p/5611",
    sourceName: "CASTEL 2026年ミニオンフードまとめ",
    sourceType: "trusted_report",
    sourceQuote: "憧れの大悪党？ボブ・ドリンクボトル：2,300円"
  },
  {
    foodId: "food-bcbp5u",
    name: "スチュアートのビッグベーコンチーズ・バーガープレート",
    price: 2300,
    sourceUrl: "https://castel.jp/p/5611",
    sourceName: "CASTEL 2026年ミニオンフードまとめ",
    sourceType: "trusted_report",
    sourceQuote: "スチュアートのベーコンチーズ・バーガープレート：2,300円"
  },
  {
    foodId: "food-12tnz7b",
    name: "ミニオンズ・カップデザート",
    price: 600,
    sourceUrl: "https://castel.jp/p/5611",
    sourceName: "CASTEL 2026年ミニオンフードまとめ",
    sourceType: "trusted_report",
    sourceQuote: "ミニオンズ・カップデザート：各600円"
  },
  {
    foodId: "food-uqw79q",
    name: "デザート&ドリンクバーセット",
    price: 950,
    sourceUrl: "https://www.usj.co.jp/tridiondata/usj/zh/tw/files/documents/usj-pdf-restaurant-other-menu-happiness-cafe.pdf",
    sourceName: "USJ公式 ハピネス・カフェ メニューPDF",
    sourceType: "official",
    sourceQuote: "デザート＆ドリンクバーセット 950円"
  },
  {
    foodId: "food-dfcoum",
    name: "シェアカクテル ~スパークリング・サングリア~",
    price: 3500,
    sourceUrl: "https://castel.jp/p/3322",
    sourceName: "CASTEL パークサイド・グリルメニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "シェアカクテル〜スパークリング・サングリア〜：3,500円"
  },
  {
    foodId: "food-116rf8q",
    name: "T-REX・バーガーセット",
    price: 3500,
    sourceUrl: "https://magazine.atnavi.net/articles/81792",
    sourceName: "あとなびマガジン ディスカバリー・レストラン新メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "T-REX・バーガーセット（3,500円）"
  },
  {
    foodId: "food-e0few1",
    name: "ラプトル・バーガーセット",
    price: 2300,
    sourceUrl: "https://magazine.atnavi.net/articles/81792",
    sourceName: "あとなびマガジン ディスカバリー・レストラン新メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "ラプトル・バーガーセット（2,300円）"
  },
  {
    foodId: "food-wn7ivo",
    name: "プテラノドン・バーガーセット",
    price: 2100,
    sourceUrl: "https://magazine.atnavi.net/articles/81792",
    sourceName: "あとなびマガジン ディスカバリー・レストラン新メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "プテラノドン・バーガーセット（2,100円）"
  },
  {
    foodId: "food-9un9k0",
    name: "モササウルス・バーガーセット",
    price: 2000,
    sourceUrl: "https://magazine.atnavi.net/articles/81792",
    sourceName: "あとなびマガジン ディスカバリー・レストラン新メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "モササウルス・バーガーセット（2,000円）"
  },
  {
    foodId: "food-19z617n",
    name: "パワーアップ! マリオのストロベリーソーダ",
    price: 900,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2094284.html",
    sourceName: "GAME Watch マリオ・カフェ＆ストア5周年メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "パワーアップ！ マリオのストロベリーソーダ 900円"
  },
  {
    foodId: "food-804x7o",
    name: "パワーアップ! ルイージのマスカットソーダ",
    price: 900,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2094284.html",
    sourceName: "GAME Watch マリオ・カフェ＆ストア5周年メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "パワーアップ！ ルイージのマスカットソーダ 900円"
  },
  {
    foodId: "food-1lvypnn",
    name: "パワーアップ! ピーチ姫のピーチソーダ",
    price: 900,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2094284.html",
    sourceName: "GAME Watch マリオ・カフェ＆ストア5周年メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "パワーアップ！ ピーチ姫のピーチソーダ 900円"
  },
  {
    foodId: "food-uftmep",
    name: "無敵! スーパースター・パンケーキサンド ~マンゴー~",
    price: 1100,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2094284.html",
    sourceName: "GAME Watch マリオ・カフェ＆ストア5周年メニュー紹介",
    sourceType: "trusted_report",
    sourceQuote: "無敵！ スーパースター・パンケーキサンド ～マンゴー～ 1,100円"
  },
  {
    foodId: "food-6dk3cs",
    name: "ファイアフラワー×ハテナブロック・ドリンクボトル",
    price: 2700,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2029147.html",
    sourceName: "GAME Watch USJスーパーマリオ・ドリンクボトル紹介",
    sourceType: "trusted_report",
    sourceQuote: "ドリンクボトル 価格：各2,700円"
  },
  {
    foodId: "food-15srg5l",
    name: "スーパースター・プラザ・アイス ~ベリー&りんご~(無果汁)",
    price: 600,
    sourceUrl: "https://castel.jp/p/3157",
    sourceName: "CASTEL USJアイス・冷たいスイーツまとめ",
    sourceType: "trusted_report",
    sourceQuote: "スーパースター・プラザ・アイス〜ベリー&りんご〜：600円"
  },
  {
    foodId: "food-1m8i41b",
    name: "バタービールTM・シュークリーム",
    price: 1000,
    sourceUrl: "https://mahoukai.com/article/usj-butterbeer-cream-puff-010420262230007.html",
    sourceName: "魔法界ドットコム バタービール・シュークリーム食レポ",
    sourceType: "trusted_report",
    sourceQuote: "バタービール・シュークリーム 価格 1,000円（税込）"
  },
  {
    foodId: "food-dn0p3s",
    name: "25周年アニバーサリー・ドリンクカップ",
    price: 1800,
    sourceUrl: "https://news.livedoor.com/article/detail/30703624/",
    sourceName: "ライブドアニュース USJ25周年フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "25周年アニバーサリー・ドリンクカップ（右）1800円"
  },
  {
    foodId: "food-alnomv",
    name: "ジュラシック・パーク・ドリンクボトル",
    price: 2300,
    sourceUrl: "https://travel.watch.impress.co.jp/docs/news/2090649.html",
    sourceName: "トラベル Watch USJ25周年フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "ジュラシック・パークボトル（2300円）"
  },
  {
    foodId: "food-13uu2tv",
    name: "ジョーズ・スプラッシュ ~ブルーハワイ&ソーダ~",
    price: 700,
    sourceUrl: "https://map.yahoo.co.jp/v3/place/uGBwtAsKFgc/menu",
    sourceName: "Yahoo!マップ ボードウォーク・スナック メニュー",
    sourceType: "menu_photo",
    sourceQuote: "ジョーズスプラッシュ700円"
  },
  {
    foodId: "food-exqw6q",
    name: "ボムへい ポップコーンバケツ",
    price: 5500,
    sourceUrl: "https://game.watch.impress.co.jp/docs/news/2024730.html",
    sourceName: "GAME Watch ボムへい ポップコーンバケツ発売記事",
    sourceType: "trusted_report",
    sourceQuote: "ボムへい ポップコーンバケツ 価格：5,500円"
  },
  {
    foodId: "food-p0tpmw",
    name: "アニバーサリー・スーパースター・ポップコーンバケツ",
    price: 4800,
    sourceUrl: "https://travel.watch.impress.co.jp/docs/news/2094323.html",
    sourceName: "トラベル Watch スーパースター・ポップコーンバケツ紹介",
    sourceType: "trusted_report",
    sourceQuote: "アニバーサリー限定仕様のポップコーンバケツ（4800円）"
  },
  {
    foodId: "food-mt4krf",
    name: "ハローキティ・アップルパイ ~マスカルポーネ~",
    price: 750,
    sourceUrl: "https://usj365.com/2024/11/11/winter2024-food/",
    sourceName: "USJ365 2024冬フードまとめ",
    sourceType: "trusted_report",
    sourceQuote: "ハローキティ・アップルパイ 〜マスカルポーネ〜 価格 750円"
  },
  {
    foodId: "food-8wrsbw",
    name: "ハローキティ・ドリンク ~ホワイトウォーター&いちご~",
    price: 700,
    sourceUrl: "https://ameblo.jp/yourpal-micey/entry-12906404759.html",
    sourceName: "まっちゃんのおでかけ日記 現地レポート",
    sourceType: "social_report",
    sourceQuote: "ハローキティのイースタードリンク ～ホワイトウォーター&いちご～ 700円"
  },
  {
    foodId: "food-dmnp8a",
    name: "ヤクルト・ソフトクリームサンデー ~マンゴー~",
    price: 1100,
    sourceUrl: "https://www.sanin-chuo.co.jp/articles/-/1009246",
    sourceName: "山陰中央新報デジタル USJ25周年フード紹介",
    sourceType: "trusted_report",
    sourceQuote: "ヤクルト・ソフトクリームサンデー～マンゴー～ 1100円"
  },
  {
    foodId: "food-12eyica",
    name: "スペシャルドリンク&コースターセット",
    price: 1300,
    sourceUrl: "https://travel.watch.impress.co.jp/docs/news/2082286.html",
    sourceName: "トラベル Watch 名探偵コナン・ミステリー・レストラン体験レポート",
    sourceType: "trusted_report",
    sourceQuote: "スペシャルドリンク＆コースターセット（全4種、各1300円）"
  },
  {
    foodId: "food-yf0vco",
    name: "フリーレンのビーフプレート ~赤ワイン香るデミグラスソース~",
    price: 3500,
    sourceUrl: "https://travel.watch.impress.co.jp/docs/news/2113077.html",
    sourceName: "トラベル Watch 葬送のフリーレン追憶のレストラン紹介",
    sourceType: "trusted_report",
    sourceQuote: "フリーレンのビーフプレート～赤ワイン香るデミグラスソース～（3500円）"
  },
  {
    foodId: "food-1qzo3v2",
    name: "メルズ・クラシックバーガーセット",
    price: 1380,
    sourceUrl: "https://usjguide.com/mels-drivein/",
    sourceName: "USJ攻略ガイド メルズドライブイン メニュー",
    sourceType: "trusted_report",
    sourceQuote: "メルズ・クラシックバーガーセット 1380円"
  },
  {
    foodId: "food-2n4el4",
    name: "アイスクリームフロート",
    price: 500,
    sourceUrl: "https://usjguide.com/amity-icecream/",
    sourceName: "USJ攻略ガイド アミティアイスクリーム メニュー",
    sourceType: "trusted_report",
    sourceQuote: "アイスクリームフロート | 500円"
  },
  {
    foodId: "food-v999yl",
    name: "フルーティ・カクテル",
    price: 1200,
    sourceUrl: "https://news.livedoor.com/article/detail/28190785/",
    sourceName: "ライブドアニュース パークサイド・グリル リニューアル紹介",
    sourceType: "trusted_report",
    sourceQuote: "フルーティ・カクテル 価格：1,200円"
  },
  {
    foodId: "food-2p64jq",
    name: "トラウトサーモンとミニアスパラのサンドウィッチセット",
    price: 1900,
    sourceUrl: "https://usjdiary.com/2026/03/20/%E3%83%96%E3%83%A9%E3%83%B3%E3%82%B8%E3%82%A7%E3%83%AA%E3%83%BC%E3%81%A7%E6%98%A5%E3%83%A1%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%92%E9%A3%9F%E3%81%B9%E3%81%9F%E8%A9%B1%E3%80%802026%E5%B9%B43%E6%9C%88/",
    sourceName: "日めくりUSJ 現地メニュー確認レポート",
    sourceType: "social_report",
    sourceQuote: "トラウトサーモンとミニアスパラのサンドウィッチセット お値段は1,900円"
  }
];

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const manualDecisionPath = path.join(outputDir, "manual-price-decisions.json");
const reportPath = path.join(outputDir, "trusted-restaurant-price-confirmations.generated.json");
const applyChanges = process.argv.includes("--apply");

const dataset = readJson<GeneratedDataset>(datasetPath);
const manualDecisions = readJson<Record<string, Record<string, unknown>>>(manualDecisionPath, {});
const before = summarize(dataset.foods);
const beforeImages = imageSnapshot(dataset.foods);
const updates: Array<PriceConfirmation & { previousPrice?: number }> = [];
const skipped: Array<{ foodId: string; name: string; reason: string }> = [];

for (const confirmation of confirmations) {
  const food = dataset.foods.find((item) => item.id === confirmation.foodId);
  if (!food) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: "food-not-found" });
    continue;
  }
  if (!isSafeNameMatch(food.name, confirmation.name)) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: `name-mismatch:${food.name}` });
    continue;
  }
  if (!isTrustedSource(confirmation.sourceUrl)) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: "source-not-trusted" });
    continue;
  }
  if (!Number.isInteger(confirmation.price) || confirmation.price < 100 || confirmation.price > 30000) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: "invalid-price" });
    continue;
  }

  updates.push({ ...confirmation, previousPrice: food.price ?? food.priceMin ?? food.price_min });
  if (applyChanges) {
    applyPrice(food, confirmation);
    manualDecisions[confirmation.foodId] = {
      ...(manualDecisions[confirmation.foodId] ?? {}),
      status: "confirmed",
      price: confirmation.price,
      sourceUrl: confirmation.sourceUrl,
      sourceName: confirmation.sourceName,
      sourceType: confirmation.sourceType,
      reason: confirmation.sourceQuote,
      reasonCode: "trusted_exact_price_found",
      updatedAt: new Date().toISOString()
    };
  }
}

const imageRegressions = compareImages(beforeImages, imageSnapshot(dataset.foods));
if (applyChanges && imageRegressions.length > 0) {
  throw new Error(`Image regression detected: ${imageRegressions.map((item) => item.foodId).join(", ")}`);
}

if (applyChanges && updates.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  writeJson(datasetPath, dataset);
  writeJson(manualDecisionPath, manualDecisions);
}

const after = summarize(dataset.foods);
const report = {
  mode: applyChanges ? "apply" : "audit",
  generatedAt: new Date().toISOString(),
  before,
  after,
  newPrices: updates.filter((update) => !update.previousPrice).length,
  imageRegressionCount: imageRegressions.length,
  imageRegressions,
  updates,
  skipped
};

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));

function applyPrice(food: GeneratedFood, confirmation: PriceConfirmation) {
  const now = new Date().toISOString();
  const note = `${confirmation.sourceName}で確認: ${confirmation.sourceQuote}`;
  food.price = confirmation.price;
  food.priceMin = confirmation.price;
  food.price_min = confirmation.price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = note;
  food.price_note = note;
  food.priceSource = confirmation.sourceType;
  food.price_source = confirmation.sourceType;
  food.priceSourceUrl = confirmation.sourceUrl;
  food.price_source_url = confirmation.sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore =
    confirmation.sourceType === "official" ? 98 :
    confirmation.sourceType === "menu_photo" ? 90 :
    confirmation.sourceType === "trusted_report" ? 86 :
    74;
  food.price_confidence_score = food.priceConfidenceScore;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
  for (const location of food.locations ?? []) {
    location.price = confirmation.price;
    location.lastCheckedAt = now;
  }
}

function summarize(foods: GeneratedFood[]) {
  const visible = foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
  const priceKnown = visible.filter(hasKnownPrice).length;
  const imageTotal = visible.filter((food) => Boolean(food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled))).length;
  const placeholderCount = visible.filter((food) => (food.imageUrl ?? food.representativeImageUrl ?? "").startsWith("/placeholders/")).length;
  return {
    foodTotal: visible.length,
    imageTotal,
    placeholderCount,
    priceKnown,
    priceUnknown: visible.length - priceKnown,
    priceRate: `${((priceKnown / visible.length) * 100).toFixed(1)}%`
  };
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function imageSnapshot(foods: GeneratedFood[]) {
  return new Map(
    foods.map((food) => [
      food.id,
      JSON.stringify({
        imageUrl: food.imageUrl,
        representativeImageUrl: food.representativeImageUrl,
        images: food.images?.map((image) => ({
          imageUrl: image.imageUrl,
          enabled: image.enabled,
          imageVerified: image.imageVerified,
          imageApproved: image.imageApproved,
          manuallyAdded: image.manuallyAdded
        }))
      })
    ])
  );
}

function compareImages(before: Map<string, string>, after: Map<string, string>) {
  return Array.from(before.entries())
    .filter(([foodId, snapshot]) => snapshot !== after.get(foodId))
    .map(([foodId, beforeSnapshot]) => ({ foodId, before: JSON.parse(beforeSnapshot), after: JSON.parse(after.get(foodId) ?? "{}") }));
}

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[〜~・!！?？™®©()（）【】「」『』、，,\s]/g, "")
    .replace(/&/g, "＆")
    .replace(/メニュー|セット|プレート/g, (match) => match);
}

function isSafeNameMatch(actual: string, expected: string) {
  const left = normalizeName(actual);
  const right = normalizeName(expected);
  return left === right || left.includes(right) || right.includes(left);
}

function isTrustedSource(sourceUrl: string) {
  return (
    /^https:\/\/usj\.opus21\.net\/restaurant\//i.test(sourceUrl) ||
    /^https:\/\/www\.usj\.co\.jp\//i.test(sourceUrl) ||
    /^https:\/\/travel\.watch\.impress\.co\.jp\//i.test(sourceUrl) ||
    /^https:\/\/news\.livedoor\.com\//i.test(sourceUrl) ||
    /^https:\/\/mahoukai\.com\//i.test(sourceUrl) ||
    /^https:\/\/map\.yahoo\.co\.jp\//i.test(sourceUrl) ||
    /^https:\/\/www\.sanin-chuo\.co\.jp\//i.test(sourceUrl) ||
    /^https:\/\/usj365\.com\//i.test(sourceUrl) ||
    /^https:\/\/ameblo\.jp\//i.test(sourceUrl) ||
    /^https:\/\/usjguide\.com\//i.test(sourceUrl) ||
    /^https:\/\/usjdiary\.com\//i.test(sourceUrl) ||
    /^https:\/\/tabelog\.com\//i.test(sourceUrl) ||
    /^https:\/\/www\.lmaga\.jp\//i.test(sourceUrl) ||
    /^https:\/\/castel\.jp\//i.test(sourceUrl) ||
    /^https:\/\/game\.watch\.impress\.co\.jp\//i.test(sourceUrl) ||
    /^https:\/\/magazine\.atnavi\.net\//i.test(sourceUrl) ||
    /^https:\/\/mmmemousj\.com\//i.test(sourceUrl) ||
    /^https:\/\/nonno\.hpplus\.jp\//i.test(sourceUrl) ||
    /^https:\/\/anna-media\.jp\//i.test(sourceUrl)
  );
}

function readJson<T>(filePath: string, fallback?: T): T {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing JSON: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
