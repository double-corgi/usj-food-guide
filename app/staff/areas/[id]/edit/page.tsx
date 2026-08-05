import { StaffConsole } from "@/components/staff/staff-console";

export const dynamic = "force-dynamic";

export default async function StaffEditAreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffConsole editorKind="areas" editorId={id} mode="edit" />;
}
