import { createClient } from "@/lib/supabase/server";
import { Job, JobStatus, Profile } from "@/lib/types";
import { CreateJobInput, UpdateJobInput } from "@/lib/validations";

export async function getOpenJobs(filters?: {
  search?: string;
  department?: string;
  location?: string;
  employment_type?: string;
}): Promise<Job[]> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .gt("deadline", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.location) {
    query = query.eq("location", filters.location);
  }
  if (filters?.employment_type) {
    query = query.eq("employment_type", filters.employment_type);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching open jobs:", error);
    return [];
  }

  return (data || []) as Job[];
}

export async function getJobById(id: string): Promise<Job | null> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) {
    return null;
  }

  // Fetch assigned recruiters
  const { data: recruitersData } = await supabase
    .from("job_recruiters")
    .select("recruiter_id, profiles:recruiter_id(*)")
    .eq("job_id", id);

  const assigned_recruiters = (recruitersData || [])
    .map((r: any) => r.profiles)
    .filter(Boolean) as Profile[];

  // Fetch counts
  const { count: applicationCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", id);

  const { count: hiredCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", id)
    .eq("stage", "hired");

  return {
    ...(job as Job),
    assigned_recruiters,
    application_count: applicationCount || 0,
    hired_count: hiredCount || 0,
  };
}

export async function getAdminJobs(): Promise<Job[]> {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !jobs) {
    return [];
  }

  // Fetch recruiters and application counts for all jobs
  const jobsWithDetails = await Promise.all(
    jobs.map(async (job) => {
      const { data: recruitersData } = await supabase
        .from("job_recruiters")
        .select("profiles:recruiter_id(*)")
        .eq("job_id", job.id);

      const { count: applicationCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id);

      const { count: hiredCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("stage", "hired");

      return {
        ...(job as Job),
        assigned_recruiters: (recruitersData || []).map((r: any) => r.profiles).filter(Boolean),
        application_count: applicationCount || 0,
        hired_count: hiredCount || 0,
      };
    })
  );

  return jobsWithDetails;
}

export async function getRecruiterJobs(recruiterId: string): Promise<Job[]> {
  const supabase = await createClient();

  const { data: recruiterJobs, error } = await supabase
    .from("job_recruiters")
    .select("job_id")
    .eq("recruiter_id", recruiterId);

  if (error || !recruiterJobs || recruiterJobs.length === 0) {
    return [];
  }

  const jobIds = recruiterJobs.map((rj) => rj.job_id);

  const { data: jobs, error: jobsErr } = await supabase
    .from("jobs")
    .select("*")
    .in("id", jobIds)
    .order("created_at", { ascending: false });

  if (jobsErr || !jobs) {
    return [];
  }

  const jobsWithDetails = await Promise.all(
    jobs.map(async (job) => {
      const { count: applicationCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id);

      const { count: hiredCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("stage", "hired");

      return {
        ...(job as Job),
        application_count: applicationCount || 0,
        hired_count: hiredCount || 0,
      };
    })
  );

  return jobsWithDetails;
}

export async function createJob(input: CreateJobInput, createdBy: string): Promise<Job> {
  const supabase = await createClient();

  const { recruiter_ids, ...jobPayload } = input;

  const { data: newJob, error } = await supabase
    .from("jobs")
    .insert({
      ...jobPayload,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error || !newJob) {
    throw new Error(error?.message || "Failed to create job");
  }

  if (recruiter_ids && recruiter_ids.length > 0) {
    const assignments = recruiter_ids.map((recruiter_id) => ({
      job_id: newJob.id,
      recruiter_id,
    }));
    await supabase.from("job_recruiters").insert(assignments);
  }

  return newJob as Job;
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const supabase = await createClient();

  const { recruiter_ids, ...updatePayload } = input;

  const { data: updatedJob, error } = await supabase
    .from("jobs")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !updatedJob) {
    throw new Error(error?.message || "Failed to update job");
  }

  if (recruiter_ids !== undefined) {
    // Replace assignments
    await supabase.from("job_recruiters").delete().eq("job_id", id);
    if (recruiter_ids.length > 0) {
      const assignments = recruiter_ids.map((recruiter_id) => ({
        job_id: id,
        recruiter_id,
      }));
      await supabase.from("job_recruiters").insert(assignments);
    }
  }

  return updatedJob as Job;
}

export async function setJobStatus(id: string, status: JobStatus): Promise<Job> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || `Failed to set job status to ${status}`);
  }

  return data as Job;
}
