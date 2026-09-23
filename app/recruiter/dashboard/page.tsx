import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRecruiter } from "@/lib/auth/server";
import { getRecruiterStats } from "@/lib/services/stats";
import { getRecruiterJobs } from "@/lib/services/jobs";
import { getRecruiterInterviews } from "@/lib/services/interviews";
import {
  Briefcase,
  Users,
  Calendar,
  Gift,
  CheckCircle2,
  ArrowRight,
  Clock,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruiterDashboardPage() {
  let authResult;
  try {
    authResult = await requireRecruiter();
  } catch {
    redirect("/login?redirect=/recruiter/dashboard");
  }

  const { profile } = authResult;
  const stats = await getRecruiterStats(profile.id);
  const assignedJobs = await getRecruiterJobs(profile.id);
  const interviews = await getRecruiterInterviews(profile.id);

  const upcomingInterviews = interviews.filter(
    (i) => new Date(i.starts_at).getTime() > Date.now()
  );

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Recruiter Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome back, {profile.full_name || "Recruiter"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review candidate applications for your assigned positions and manage your interview calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/recruiter/pipeline"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Layers className="w-4 h-4" />
            Open Kanban Pipeline
          </Link>
          <Link
            href="/recruiter/interviews"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-sm"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            Interviews
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Jobs</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.assignedJobsCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Candidates</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.activeCandidatesCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Interviews Today</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2">
            {stats.interviewsTodayCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Offers Extended</span>
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.offersCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Hired</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.hiredCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assigned Jobs List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Assigned Jobs</h2>
            <Link
              href="/recruiter/jobs"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all ({assignedJobs.length})
            </Link>
          </div>

          {assignedJobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No jobs assigned yet</p>
              <p className="text-xs text-slate-500 mt-1">
                You will see jobs here once the ATS administrator assigns you to open roles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          job.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{job.openings} Openings</span>
                      <span>•</span>
                      <span>{job.application_count || 0} Total Applications</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">
                        {job.hired_count || 0} Hired
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/recruiter/pipeline?job_id=${job.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-xs transition"
                    >
                      <Layers className="w-3.5 h-3.5" /> Pipeline
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Interviews</h2>
            <Link
              href="/recruiter/interviews"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Calendar
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">
                No upcoming interviews scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.slice(0, 5).map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {interview.application?.candidate?.full_name || "Candidate"}
                    </span>
                    <span className="text-indigo-600 font-semibold">60 mins</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {interview.application?.job?.title}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(interview.starts_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
