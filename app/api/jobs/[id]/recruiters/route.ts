import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: jobId } = await context.params;
    const body = await request.json();
    const { recruiter_id } = body;

    if (!recruiter_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "recruiter_id is required" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("job_recruiters").upsert({
      job_id: jobId,
      recruiter_id,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "ASSIGN_FAILED", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Recruiter assigned" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: jobId } = await context.params;
    const { searchParams } = new URL(request.url);
    const recruiter_id = searchParams.get("recruiter_id");

    if (!recruiter_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "recruiter_id query parameter is required" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("job_recruiters")
      .delete()
      .eq("job_id", jobId)
      .eq("recruiter_id", recruiter_id);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "UNASSIGN_FAILED", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Recruiter unassigned" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
