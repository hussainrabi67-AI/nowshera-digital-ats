import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { setJobStatus } from "@/lib/services/jobs";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const updated = await setJobStatus(id, "open");
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
