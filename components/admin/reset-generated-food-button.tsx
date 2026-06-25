"use client";

import { useFormStatus } from "react-dom";

export function ResetGeneratedFoodButton({
  foodId,
  action
}: {
  foodId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("この商品の修正内容をすべて取り消して、元データに戻しますか？")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="foodId" value={foodId} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 w-full items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-800 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "処理中..." : "元データに戻す"}
    </button>
  );
}
