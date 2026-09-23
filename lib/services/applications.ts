import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Application, ApplicationStage, ApplicationStageHistory } from "@/lib/types";

export class ApplicationError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = "APPLICATION_ERROR", statusCode: number = 400) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function submitApplication(params: {
  jobId: string;
  candidateId: string;
  fileBuffer: Buffer;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<Application> {
  const { jobId, candidateId, fileBuffer, fileName, fileSize, mimeType } = params;

  // 1. File size validation (Max 2MB = 2,097,152 bytes)
  if (fileSize <= 0 || fileSize > 2 * 1024 * 1024) {
    throw new ApplicationError("CV must be less than or equal to 2 MB", "CV_TOO_LARGE", 400);
  }

  // 2. MIME type & extension validation
  const lowerName = fileName.toLowerCase();
  if (!lowerName.endsWith(".pdf") || mimeType !== "application/pdf") {
    throw new ApplicationError("Only PDF documents are accepted", "INVALID_CV", 400);
  }

  // 3. Magic bytes validation (%PDF- in ASCII: 0x25, 0x50, 0x44, 0x46)
  if (
    fileBuffer.length < 4 ||
    fileBuffer[0] !== 0x25 ||
    fileBuffer[1] !== 0x50 ||
    fileBuffer[2] !== 0x44 ||
    fileBuffer[3] !== 0x46
  ) {
    throw new ApplicationError("Invalid file content. Must be a valid PDF document", "INVALID_CV", 400);
  }

  const supabase = await createClient();

  // 4. Job status & deadline validation
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, status, deadline")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    throw new ApplicationError("Job not found", "NOT_FOUND", 404);
  }

  if (job.status !== "open") {
    throw new ApplicationError("This job is not currently open for applications", "JOB_NOT_OPEN", 400);
  }

  if (new Date(job.deadline).getTime() <= Date.now()) {
    throw new ApplicationError("The application deadline for this job has passed", "APPLICATION_DEADLINE_PASSED", 400);
  }

  // 5. Active application check (Test Case 3)
  const { data: existingApp } = await supabase
    .from("applications")
    .select("id, stage")
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId)
    .neq("stage", "withdrawn")
    .maybeSingle();

  if (existingApp) {
    throw new ApplicationError("You already have an active application for this job.", "DUPLICATE_APPLICATION", 409);
  }

  // 6. Upload file to private cv-files bucket
  // Unique application folder ensures CV versions are never overwritten (Test Case 6 & Section 12)
  const appUniqueId = crypto.randomUUID();
  const safeOriginalName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const cvPath = `${candidateId}/${appUniqueId}/${safeOriginalName}`;

  const { error: uploadError } = await supabase.storage
    .from("cv-files")
    .upload(cvPath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new ApplicationError("Failed to upload CV document", "STORAGE_ERROR", 500);
  }

  // 7. Insert application
  const { data: newApplication, error: insertError } = await supabase
    .from("applications")
    .insert({
      id: appUniqueId,
      job_id: jobId,
      candidate_id: candidateId,
      stage: "applied",
      cv_path: cvPath,
      cv_original_name: fileName,
      cv_size_bytes: fileSize,
      cv_mime_type: "application/pdf",
    })
    .select()
    .single();

  if (insertError || !newApplication) {
    // Attempt rollback of uploaded file
    await supabase.storage.from("cv-files").remove([cvPath]);
    throw new ApplicationError(insertError?.message || "Failed to submit application", "INSERT_FAILED", 500);
  }

  // 8. Record initial stage in history
  await supabase.from("application_stage_history").insert({
    application_id: newApplication.id,
    from_stage: null,
    to_stage: "applied",
    changed_by: candidateId,
  });

  return newApplication as Application;
}

export async function transitionApplicationStage(
  applicationId: string,
  newStage: ApplicationStage
): Promise<Application> {
  const supabase = await createClient();

  // Call the database function to ensure atomic transactional stage transition,
  // capacity enforcement, auto job closure, stage history, and email events.
  const { data, error } = await supabase.rpc("transition_application_stage", {
    p_application_id: applicationId,
    p_new_stage: newStage,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("Invalid application transition")) {
      throw new ApplicationError(msg, "INVALID_STAGE_TRANSITION", 400);
    }
    if (msg.includes("no remaining openings")) {
      throw new ApplicationError(msg, "HIRING_CAPACITY_REACHED", 400);
    }
    if (msg.includes("not authorized")) {
      throw new ApplicationError(msg, "FORBIDDEN", 403);
    }
    throw new ApplicationError(msg, "TRANSITION_FAILED", 400);
  }

  return data as Application;
}

export async function withdrawApplication(
  applicationId: string,
  candidateId: string
): Promise<Application> {
  return transitionApplicationStage(applicationId, "withdrawn");
}

export async function getCandidateApplications(candidateId: string): Promise<Application[]> {
  const supabase = await createClient();

  const { data: apps, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:job_id (
        id,
        title,
        location,
        employment_type,
        status,
        deadline
      ),
      interview:interviews (
        id,
        starts_at,
        ends_at
      )
    `)
    .eq("candidate_id", candidateId)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidate applications:", error);
    return [];
  }

  return (apps || []).map((app: any) => ({
    ...app,
    interview: Array.isArray(app.interview) ? app.interview[0] || null : app.interview,
  })) as Application[];
}

export async function getApplicationDetails(
  applicationId: string,
  role: "candidate" | "recruiter" | "admin"
): Promise<{
  application: Application;
  history: ApplicationStageHistory[];
  interview: any | null;
}> {
  const supabase = await createClient();

  const { data: app, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:job_id (*),
      candidate:candidate_id (
        id,
        full_name,
        email
      )
    `)
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    throw new ApplicationError("Application not found", "NOT_FOUND", 404);
  }

  const { data: history } = await supabase
    .from("application_stage_history")
    .select(`
      *,
      changer:changed_by (
        id,
        full_name,
        role
      )
    `)
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  const { data: interview } = await supabase
    .from("interviews")
    .select(`
      *,
      recruiter:recruiter_id (
        id,
        full_name,
        email
      )
    `)
    .eq("application_id", applicationId)
    .maybeSingle();

  return {
    application: app as Application,
    history: (history || []) as ApplicationStageHistory[],
    interview: interview || null,
  };
}

export async function getApplicationsForJob(jobId: string): Promise<Application[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      candidate:candidate_id (
        id,
        full_name,
        email
      ),
      interview:interviews (
        id,
        starts_at,
        ends_at
      )
    `)
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("Error fetching job applications:", error);
    return [];
  }

  return (data || []).map((app: any) => ({
    ...app,
    interview: Array.isArray(app.interview) ? app.interview[0] || null : app.interview,
  })) as Application[];
}

export async function getAllApplicationsAdmin(): Promise<Application[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:job_id (
        id,
        title,
        location,
        status
      ),
      candidate:candidate_id (
        id,
        full_name,
        email
      ),
      interview:interviews (
        id,
        starts_at,
        ends_at
      )
    `)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("Error fetching all applications:", error);
    return [];
  }

  return (data || []).map((app: any) => ({
    ...app,
    interview: Array.isArray(app.interview) ? app.interview[0] || null : app.interview,
  })) as Application[];
}
