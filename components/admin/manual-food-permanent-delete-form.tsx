"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export function ManualFoodPermanentDeleteForm({
  foodId,
  foodName,
  action
}: {
  foodId: string;
  foodName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [confirmationName, setConfirmationName] = useState("");
  return (
    <form action={action} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <input type="hidden" name="foodId" value={foodId} />
      <p className="text-sm font-black text-rose-900">完全削除</p>
      <p className="mt-1 text-xs font-bold leading-5 text-rose-800">
        この商品を完全に削除します。元に戻せません。削除済みにした手動商品だけ、管理者が実行できます。
      </p>
      <label className="mt-3 block">
        <span className="text-xs font-black text-rose-900">確認のため商品名を入力</span>
        <input
          name="confirmationName"
          value={confirmationName}
          onChange={(event) => setConfirmationName(event.currentTarget.value)}
          className="mt-2 h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder={foodName}
        />
      </label>
      <SubmitButton disabled={confirmationName !== foodName} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full bg-rose-700 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-rose-200 disabled:text-rose-700"
    >
      {pending ? "完全削除中..." : "完全削除する"}
    </button>
  );
}
