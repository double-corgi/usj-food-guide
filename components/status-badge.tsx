import { statusLabels, statusTone } from "@/lib/constants";
import type { FoodStatus } from "@/types/domain";

export function StatusBadge({ status }: { status: FoodStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
