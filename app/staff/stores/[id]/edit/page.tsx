import { StaffConsole } from "@/components/staff/staff-console";

export const dynamic = "force-dynamic";

export default async function StaffEditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffConsole editorKind="stores" editorId={id} mode="edit" />;
}
