import { createClient } from "@/lib/supabase/server";
import { DashboardStats, RecruiterStats } from "@/lib/types";

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // 1. Total & Open jobs
  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, title, status, openings, deadline")
    .order("created_at", { ascending: false });

  const jobs = allJobs || [];
  const totalJobs = jobs.length;
  const openJobs = jobs.filter((j) => j.status === "open").length;

  // 2. All applications with stage
  const { data: allApps } = await supabase
    .from("applications")
    .select("id, job_id, stage, applied_at");

  const apps = allApps || [];
  const totalApplications = apps.length;

  // Group by stage
  const stageCounts: Record<string, number> = {
    applied: 0,
    shortlisted: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  };

  apps.forEach((a) => {
    if (stageCounts[a.stage] !== undefined) {
      stageCounts[a.stage]++;
    }
  });

  const activeApplications =
    stageCounts.applied +
    stageCounts.shortlisted +
    stageCounts.interview +
    stageCounts.offer;

  // 3. Funnel data
  const funnel = [
    { stage: "Applied", count: stageCounts.applied },
    { stage: "Shortlisted", count: stageCounts.shortlisted },
    { stage: "Interview", count: stageCounts.interview },
    { stage: "Offer", count: stageCounts.offer },
    { stage: "Hired", count: stageCounts.hired },
  ];

  // 4. Job-level breakdown
  const jobsBreakdown = jobs.map((job) => {
    const jobApps = apps.filter((a) => a.job_id === job.id);
    const jCounts: Record<string, number> = {
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };
    jobApps.forEach((a) => {
      if (jCounts[a.stage] !== undefined) {
        jCounts[a.stage]++;
      }
    });

    return {
      id: job.id,
      title: job.title,
      status: job.status,
      openings: job.openings,
      total: jobApps.length,
      applied: jCounts.applied,
      shortlisted: jCounts.shortlisted,
      interview: jCounts.interview,
      offer: jCounts.offer,
      hired: jCounts.hired,
      rejected: jCounts.rejected,
      withdrawn: jCounts.withdrawn,
    };
  });

  return {
    totalJobs,
    openJobs,
    totalApplications,
    activeApplications,
    interviewsScheduled: stageCounts.interview,
    offersMade: stageCounts.offer,
    hiredCount: stageCounts.hired,
    rejectedCount: stageCounts.rejected,
    withdrawnCount: stageCounts.withdrawn,
    funnel,
    jobsBreakdown,
  };
}

export async function getRecruiterStats(recruiterId: string): Promise<RecruiterStats> {
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("job_recruiters")
    .select("job_id")
    .eq("recruiter_id", recruiterId);

  const assignedJobIds = (assignments || []).map((a) => a.job_id);

  if (assignedJobIds.length === 0) {
    return {
      assignedJobsCount: 0,
      activeCandidatesCount: 0,
      interviewsTodayCount: 0,
      offersCount: 0,
      hiredCount: 0,
    };
  }

  const { data: apps } = await supabase
    .from("applications")
    .select("id, stage")
    .in("job_id", assignedJobIds);

  const appList = apps || [];
  const activeCandidatesCount = appList.filter((a) =>
    ["applied", "shortlisted", "interview", "offer"].includes(a.stage)
  ).length;
  const offersCount = appList.filter((a) => a.stage === "offer").length;
  const hiredCount = appList.filter((a) => a.stage === "hired").length;

  // Interviews today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { count: interviewsTodayCount } = await supabase
    .from("interviews")
    .select("*", { count: "exact", head: true })
    .eq("recruiter_id", recruiterId)
    .gte("starts_at", todayStart.toISOString())
    .lte("starts_at", todayEnd.toISOString());

  return {
    assignedJobsCount: assignedJobIds.length,
    activeCandidatesCount,
    interviewsTodayCount: interviewsTodayCount || 0,
    offersCount,
    hiredCount,
  };
}
