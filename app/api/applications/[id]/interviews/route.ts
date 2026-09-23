import { NextRequest, NextResponse } from "next/server";
import { assertApplicationAccess, requireAuth } from "@/lib/auth/server";
import { scheduleInterview } from "@/lib/services/interviews";
import { scheduleInterviewSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id } = await context.params;

    if (profile.role === "candidate") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Candidates cannot schedule interviews" },
        },
        { status: 403 }
      );
    }

    // Verify recruiter assignment or admin status
    await assertApplicationAccess(id, profile.id, profile.role);

    const body = await request.json();
    const { starts_at } = scheduleInterviewSchema.parse(body);

    const interview = await scheduleInterview(id, starts_at);

    return NextResponse.json({ success: true, data: interview }, { status: 201 });
  } catch (error: any) {
    const statusCode =
      error.statusCode || (error.name === "ZodError" ? 400 : 400);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || (error.name === "ZodError" ? "VALIDATION_ERROR" : "INTERVIEW_FAILED"),
          message: error.message,
        },
      },
      { status: statusCode }
    );
  }
}
