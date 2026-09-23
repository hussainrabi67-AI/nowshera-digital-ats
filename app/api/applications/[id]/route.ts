import { NextRequest, NextResponse } from "next/server";
import { assertApplicationAccess, requireAuth } from "@/lib/auth/server";
import { getApplicationDetails } from "@/lib/services/applications";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id } = await context.params;

    // Verify ownership or job assignment
    await assertApplicationAccess(id, profile.id, profile.role);

    const details = await getApplicationDetails(id, profile.role);

    return NextResponse.json({ success: true, data: details });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
