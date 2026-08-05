import { StaffConsole } from "@/components/staff/staff-console";

export const dynamic = "force-dynamic";

export default async function StaffEditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffConsole editorKind="collections" editorId={id} mode="edit" />;
}
