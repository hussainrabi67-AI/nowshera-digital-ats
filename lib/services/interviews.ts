import { createClient } from "@/lib/supabase/server";
import { Interview } from "@/lib/types";

export class InterviewError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = "INTERVIEW_ERROR", statusCode: number = 400) {
    super(message);
    this.name = "InterviewError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function scheduleInterview(
  applicationId: string,
  startsAtIso: string
): Promise<Interview> {
  const startsAt = new Date(startsAtIso);
  if (isNaN(startsAt.getTime())) {
    throw new InterviewError("Invalid interview date and time", "VALIDATION_ERROR", 400);
  }

  if (startsAt.getTime() <= Date.now()) {
    throw new InterviewError("Interview must be scheduled in the future", "INTERVIEW_IN_PAST", 400);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("schedule_application_interview", {
    p_application_id: applicationId,
    p_starts_at: startsAt.toISOString(),
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("overlapping interview")) {
      throw new InterviewError("This recruiter already has an overlapping interview at this time", "INTERVIEW_CONFLICT", 409);
    }
    if (msg.includes("in the future")) {
      throw new InterviewError("Interview must be scheduled in the future", "INTERVIEW_IN_PAST", 400);
    }
    if (msg.includes("Shortlisted")) {
      throw new InterviewError("Application must be in Shortlisted stage before scheduling an interview", "INVALID_STAGE_TRANSITION", 400);
    }
    if (msg.includes("not authorized")) {
      throw new InterviewError("You are not authorized to schedule an interview for this application", "FORBIDDEN", 403);
    }
    if (msg.includes("already has an interview")) {
      throw new InterviewError("An interview has already been scheduled for this application", "INTERVIEW_ALREADY_EXISTS", 400);
    }
    throw new InterviewError(msg, "INTERVIEW_SCHEDULE_FAILED", 400);
  }

  return data as Interview;
}

export async function getRecruiterInterviews(recruiterId: string): Promise<Interview[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .select(`
      *,
      application:application_id (
        id,
        stage,
        job:job_id (
          id,
          title,
          location
        ),
        candidate:candidate_id (
          id,
          full_name,
          email
        )
      )
    `)
    .eq("recruiter_id", recruiterId)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Error fetching recruiter interviews:", error);
    return [];
  }

  return (data || []) as Interview[];
}

export async function getAllInterviewsAdmin(): Promise<Interview[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .select(`
      *,
      recruiter:recruiter_id (
        id,
        full_name,
        email
      ),
      application:application_id (
        id,
        stage,
        job:job_id (
          id,
          title,
          location
        ),
        candidate:candidate_id (
          id,
          full_name,
          email
        )
      )
    `)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Error fetching all interviews:", error);
    return [];
  }

  return (data || []) as Interview[];
}
