import { PublicStateCard } from "@/components/public-state";

export default function StoreNotFound() {
  return (
    <PublicStateCard
      eyebrow="STORE"
      title="この店舗は表示できません"
      description="店舗情報が見つかりませんでした。店舗一覧からもう一度選んでください。"
      action={{ href: "/stores", label: "店舗一覧へ戻る" }}
      secondaryAction={{ href: "/", label: "ホームへ戻る" }}
    />
  );
}

