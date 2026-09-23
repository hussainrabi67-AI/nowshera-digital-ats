import { NextRequest, NextResponse } from "next/server";
import { assertApplicationAccess, requireAuth } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth();
    const { id: applicationId } = await context.params;

    // 1. Verify access (Candidate owns it, recruiter is assigned to job, or admin)
    await assertApplicationAccess(applicationId, profile.id, profile.role);

    // 2. Fetch application CV details
    const supabase = await createClient();
    const { data: application, error } = await supabase
      .from("applications")
      .select("cv_path, cv_original_name")
      .eq("id", applicationId)
      .single();

    if (error || !application || !application.cv_path) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "CV document not found" } },
        { status: 404 }
      );
    }

    // 3. Generate a short-lived signed URL (valid for 5 minutes / 300 seconds)
    const adminClient = createAdminClient();
    const { data: signedUrlData, error: signError } = await adminClient.storage
      .from("cv-files")
      .createSignedUrl(application.cv_path, 300, {
        download: application.cv_original_name,
      });

    if (signError || !signedUrlData) {
      console.error("Signed URL creation error:", signError);
      return NextResponse.json(
        { success: false, error: { code: "STORAGE_ERROR", message: "Failed to generate signed CV download URL" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: signedUrlData.signedUrl,
        fileName: application.cv_original_name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "FORBIDDEN", message: error.message } },
      { status: error.statusCode || 403 }
    );
  }
}
