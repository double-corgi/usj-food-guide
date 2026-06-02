import { unofficialNotice } from "@/lib/constants";

export function UnofficialNotice() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950">
      {unofficialNotice}
    </p>
  );
}
