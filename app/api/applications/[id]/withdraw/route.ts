import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { withdrawApplication } from "@/lib/services/applications";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id } = await context.params;

    if (profile.role !== "candidate") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Only candidates can withdraw applications" },
        },
        { status: 403 }
      );
    }

    const withdrawn = await withdrawApplication(id, profile.id);
    return NextResponse.json({ success: true, data: withdrawn });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code || "WITHDRAW_FAILED", message: error.message },
      },
      { status: error.statusCode || 400 }
    );
  }
}
