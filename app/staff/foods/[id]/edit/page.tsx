import { StaffConsole } from "@/components/staff/staff-console";

export const dynamic = "force-dynamic";

export default async function StaffEditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffConsole editorKind="foods" editorId={id} mode="edit" />;
}
