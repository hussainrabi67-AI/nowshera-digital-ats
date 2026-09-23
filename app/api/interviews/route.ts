import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { getAllInterviewsAdmin, getRecruiterInterviews } from "@/lib/services/interviews";

export async function GET(_request: NextRequest) {
  try {
    const { profile } = await requireAuth();

    if (profile.role === "candidate") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Candidates cannot access interview schedule API directly" } },
        { status: 403 }
      );
    }

    if (profile.role === "admin") {
      const interviews = await getAllInterviewsAdmin();
      return NextResponse.json({ success: true, data: interviews });
    }

    if (profile.role === "recruiter") {
      const interviews = await getRecruiterInterviews(profile.id);
      return NextResponse.json({ success: true, data: interviews });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: error.code || "ERROR", message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
