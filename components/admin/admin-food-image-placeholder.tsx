import { AlertTriangle, ImageOff, Loader2 } from "lucide-react";

export type AdminFoodImagePlaceholderState = "empty" | "unconfirmed" | "loading" | "error" | "no-image";

const placeholderCopy: Record<AdminFoodImagePlaceholderState, { title: string; description: string; tone: string; icon: "image" | "alert" | "loader" }> = {
  empty: {
    title: "画像未登録",
    description: "画像URLがありません",
    tone: "bg-slate-100 text-slate-600",
    icon: "image"
  },
  unconfirmed: {
    title: "画像未確認",
    description: "誤った画像より画像なしを優先します",
    tone: "bg-slate-100 text-slate-600",
    icon: "image"
  },
  loading: {
    title: "画像を読み込み中",
    description: "固定サイズで表示を準備しています",
    tone: "bg-mint text-park",
    icon: "loader"
  },
  error: {
    title: "画像を読み込めません",
    description: "URLを確認してください",
    tone: "bg-rose-50 text-rose-700",
    icon: "alert"
  },
  "no-image": {
    title: "画像なしで運用",
    description: "公式画像が存在しない商品です",
    tone: "bg-slate-100 text-slate-600",
    icon: "image"
  }
};

export function AdminFoodImagePlaceholder({
  state = "unconfirmed",
  className,
  title,
  description
}: {
  state?: AdminFoodImagePlaceholderState;
  className?: string;
  title?: string;
  description?: string;
}) {
  const copy = placeholderCopy[state];

  return (
    <div className={joinClass("grid place-items-center p-4 text-center", copy.tone, className)}>
      <div>
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white/85 shadow-soft">
          {copy.icon === "alert" ? <AlertTriangle size={20} aria-hidden /> : null}
          {copy.icon === "loader" ? <Loader2 size={20} aria-hidden /> : null}
          {copy.icon === "image" ? <ImageOff size={20} aria-hidden /> : null}
        </span>
        <p className="mt-3 text-sm font-black leading-5">{title ?? copy.title}</p>
        <p className="mt-1 text-xs font-bold leading-5 opacity-80">{description ?? copy.description}</p>
      </div>
    </div>
  );
}

function joinClass(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
