"use client";

import { useFormStatus } from "react-dom";

export function ManualFoodDeleteButton({
  foodId,
  deleted,
  action
}: {
  foodId: string;
  deleted: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const intent = deleted ? "restore" : "delete";
  const label = deleted ? "復元する" : "削除する";
  const confirmMessage = deleted
    ? "この商品を復元しますか？"
    : "この商品を削除済みにしますか？公開ページと通常の管理一覧から消えますが、あとで復元できます。";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="foodId" value={foodId} />
      <input type="hidden" name="intent" value={intent} />
      <SubmitButton deleted={deleted} label={label} />
    </form>
  );
}

function SubmitButton({ deleted, label }: { deleted: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-9 w-full items-center justify-center rounded-full px-3 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
        deleted ? "bg-mint text-park" : "border border-slate-300 bg-slate-100 text-slate-700"
      }`}
    >
      {pending ? "処理中..." : label}
    </button>
  );
}
