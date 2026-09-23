import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminDashboardStats } from "@/lib/services/stats";

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    const stats = await getAdminDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
