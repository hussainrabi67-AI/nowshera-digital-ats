import { createClient } from "@/lib/supabase/server";
import { AppRole, Profile } from "@/lib/types";

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 401, code: string = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as Profile;
}

export async function requireAuth(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; profile: Profile }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("You must be signed in to perform this action", 401, "UNAUTHORIZED");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    throw new AuthError("User profile not found", 401, "PROFILE_NOT_FOUND");
  }

  return { user, profile };
}

export async function requireRole(allowedRoles: AppRole[]): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; profile: Profile }> {
  const { user, profile } = await requireAuth();

  if (!allowedRoles.includes(profile.role)) {
    throw new AuthError(
      `Access denied. Required role: ${allowedRoles.join(" or ")}, but you are '${profile.role}'.`,
      403,
      "FORBIDDEN"
    );
  }

  return { user, profile };
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireRecruiter() {
  return requireRole(["recruiter", "admin"]);
}

export async function requireCandidate() {
  return requireRole(["candidate"]);
}

export async function assertJobRecruiter(jobId: string, userId: string, role: AppRole): Promise<boolean> {
  if (role === "admin") return true;

  if (role !== "recruiter") {
    throw new AuthError("Forbidden: Only assigned recruiters or admins can access this job", 403, "FORBIDDEN");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_recruiters")
    .select("recruiter_id")
    .eq("job_id", jobId)
    .eq("recruiter_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new AuthError("Forbidden: You are not assigned to this job", 403, "FORBIDDEN");
  }

  return true;
}

export async function assertApplicationAccess(
  applicationId: string,
  userId: string,
  role: AppRole
): Promise<{ applicationId: string; jobId: string; candidateId: string }> {
  const supabase = await createClient();
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, job_id, candidate_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !application) {
    throw new AuthError("Application not found", 404, "NOT_FOUND");
  }

  if (role === "admin") {
    return {
      applicationId: application.id,
      jobId: application.job_id,
      candidateId: application.candidate_id,
    };
  }

  if (role === "candidate") {
    if (application.candidate_id !== userId) {
      throw new AuthError("Forbidden: You can only access your own applications", 403, "FORBIDDEN");
    }
    return {
      applicationId: application.id,
      jobId: application.job_id,
      candidateId: application.candidate_id,
    };
  }

  if (role === "recruiter") {
    await assertJobRecruiter(application.job_id, userId, role);
    return {
      applicationId: application.id,
      jobId: application.job_id,
      candidateId: application.candidate_id,
    };
  }

  throw new AuthError("Forbidden: Invalid role", 403, "FORBIDDEN");
}
