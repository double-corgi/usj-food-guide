import { PublicStateCard } from "@/components/public-state";

export default function FoodDetailNotFound() {
  return (
    <PublicStateCard
      eyebrow="FOOD"
      title="このフードは表示できません"
      description="公開が終了したか、現在は表示対象ではない可能性があります。ほかのフードを一覧から探してみてください。"
      action={{ href: "/foods", label: "フード一覧へ戻る" }}
      secondaryAction={{ href: "/", label: "ホームへ戻る" }}
    />
  );
}

