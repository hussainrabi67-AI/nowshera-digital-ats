import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import {
  getAllApplicationsAdmin,
  getCandidateApplications,
  getApplicationsForJob,
  submitApplication,
} from "@/lib/services/applications";

export async function GET(request: NextRequest) {
  try {
    const { profile } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("job_id");

    if (profile.role === "candidate") {
      const apps = await getCandidateApplications(profile.id);
      return NextResponse.json({ success: true, data: apps });
    }

    if (profile.role === "admin") {
      if (jobId) {
        const apps = await getApplicationsForJob(jobId);
        return NextResponse.json({ success: true, data: apps });
      }
      const apps = await getAllApplicationsAdmin();
      return NextResponse.json({ success: true, data: apps });
    }

    if (profile.role === "recruiter") {
      if (jobId) {
        const apps = await getApplicationsForJob(jobId);
        return NextResponse.json({ success: true, data: apps });
      }
      // Return all applications for recruiter's assigned jobs
      const apps = await getAllApplicationsAdmin(); // RLS will filter down to assigned jobs
      return NextResponse.json({ success: true, data: apps });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await requireAuth();

    // Only candidates can apply for jobs
    if (profile.role !== "candidate") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only candidates can submit job applications",
          },
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const jobId = formData.get("job_id") as string;
    const file = formData.get("cv") as File | null;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "job_id is required" },
        },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_CV", message: "A PDF CV file is required" },
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const application = await submitApplication({
      jobId,
      candidateId: profile.id,
      fileBuffer: buffer,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "APPLICATION_FAILED",
          message: error.message || "Failed to submit application",
        },
      },
      { status: error.statusCode || 400 }
    );
  }
}
