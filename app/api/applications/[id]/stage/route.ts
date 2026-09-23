import { NextRequest, NextResponse } from "next/server";
import { assertApplicationAccess, requireAuth } from "@/lib/auth/server";
import { transitionApplicationStage } from "@/lib/services/applications";
import { stageTransitionSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id } = await context.params;

    // Reject candidates directly attempting stage manipulation (Test Case 8)
    if (profile.role === "candidate") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Candidates are not permitted to change application stages",
          },
        },
        { status: 403 }
      );
    }

    // Verify recruiter assignment or admin status (Test Case 8)
    await assertApplicationAccess(id, profile.id, profile.role);

    const body = await request.json();
    const { new_stage } = stageTransitionSchema.parse(body);

    const updated = await transitionApplicationStage(id, new_stage);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const statusCode =
      error.statusCode || (error.name === "ZodError" ? 400 : 400);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || (error.name === "ZodError" ? "VALIDATION_ERROR" : "STAGE_TRANSITION_FAILED"),
          message: error.message,
        },
      },
      { status: statusCode }
    );
  }
}
