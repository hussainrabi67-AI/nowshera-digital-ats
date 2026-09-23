import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/server";
import { createJob, getAdminJobs, getOpenJobs, getRecruiterJobs } from "@/lib/services/jobs";
import { createJobSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const location = searchParams.get("location") || undefined;
    const employment_type = searchParams.get("employment_type") || undefined;

    // Public / Candidate view
    if (!profile || profile.role === "candidate") {
      const jobs = await getOpenJobs({ search, location, employment_type });
      return NextResponse.json({ success: true, data: jobs });
    }

    if (profile.role === "admin") {
      const jobs = await getAdminJobs();
      return NextResponse.json({ success: true, data: jobs });
    }

    if (profile.role === "recruiter") {
      const jobs = await getRecruiterJobs(profile.id);
      return NextResponse.json({ success: true, data: jobs });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code || "INTERNAL_ERROR", message: error.message },
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await requireAdmin();

    const body = await request.json();
    const validated = createJobSchema.parse(body);

    const newJob = await createJob(validated, profile.id);

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error: any) {
    const statusCode = error.statusCode || (error.name === "ZodError" ? 400 : 500);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || (error.name === "ZodError" ? "VALIDATION_ERROR" : "INTERNAL_ERROR"),
          message: error.message || "Failed to create job",
          details: error.errors || undefined,
        },
      },
      { status: statusCode }
    );
  }
}
