import { PublicStateCard } from "@/components/public-state";

export default function AreaNotFound() {
  return (
    <PublicStateCard
      eyebrow="AREA"
      title="このエリアは表示できません"
      description="エリア情報が見つかりませんでした。エリア一覧からもう一度選んでください。"
      action={{ href: "/areas", label: "エリア一覧へ戻る" }}
      secondaryAction={{ href: "/", label: "ホームへ戻る" }}
    />
  );
}

