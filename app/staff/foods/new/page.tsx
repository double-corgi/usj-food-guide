import { StaffConsole } from "@/components/staff/staff-console";

export const dynamic = "force-dynamic";

export default function StaffNewFoodPage() {
  return <StaffConsole editorKind="foods" mode="new" />;
}
