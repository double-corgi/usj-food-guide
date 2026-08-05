import { NextResponse } from "next/server";
import { buildPublicCatalog } from "@/lib/repositories/public-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildPublicCatalog());
}
