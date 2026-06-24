"use client";

import { useFormStatus } from "react-dom";

export function ManualFoodVisibilityButton({
  foodId,
  hidden,
  action
}: {
  foodId: string;
  hidden: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const intent = hidden ? "show" : "hide";
  const label = hidden ? "再表示する" : "非表示にする";
  const confirmMessage = hidden
    ? "この商品を公開ページに再表示しますか？"
    : "この商品を公開ページから非表示にしますか？管理画面には残ります。";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="foodId" value={foodId} />
      <input type="hidden" name="intent" value={intent} />
      <SubmitButton hidden={hidden} label={label} />
    </form>
  );
}

function SubmitButton({ hidden, label }: { hidden: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-9 w-full items-center justify-center rounded-full px-3 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
        hidden ? "bg-mint text-park" : "border border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {pending ? "処理中..." : label}
    </button>
  );
}
