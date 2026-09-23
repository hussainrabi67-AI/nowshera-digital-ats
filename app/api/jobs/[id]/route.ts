import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/server";
import { getJobById, updateJob } from "@/lib/services/jobs";
import { updateJobSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Job not found" } },
        { status: 404 }
      );
    }

    const profile = await getCurrentProfile();

    // If candidate or unauthenticated, job must be open and unexpired (PRD Section 25)
    if (!profile || profile.role === "candidate") {
      if (job.status !== "open" || new Date(job.deadline).getTime() <= Date.now()) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Job is not available" } },
          { status: 404 }
        );
      }
    }

    // If recruiter, must be assigned or admin
    if (profile && profile.role === "recruiter") {
      const isAssigned = (job.assigned_recruiters || []).some((r) => r.id === profile.id);
      if (!isAssigned && job.status !== "open") {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "You are not assigned to this job" } },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "INTERNAL_ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateJobSchema.parse(body);

    const updated = await updateJob(id, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const statusCode = error.statusCode || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || (error.name === "ZodError" ? "VALIDATION_ERROR" : "INTERNAL_ERROR"),
          message: error.message,
          details: error.errors || undefined,
        },
      },
      { status: statusCode }
    );
  }
}
