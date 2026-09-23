import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminJobs } from "@/lib/services/jobs";
import {
  Briefcase,
  PlusCircle,
  Calendar,
  Users,
  MapPin,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminJobsListPage() {
  let authResult;
  try {
    authResult = await requireAdmin();
  } catch {
    redirect("/login");
  }

  const jobs = await getAdminJobs();

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create drafts, open positions to candidates, assign recruiters, and manage hiring limits.
          </p>
        </div>

        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Position
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No jobs created yet</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Get started by posting your first job opening for Nowshera Digital.
          </p>
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Position
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    {job.title}
                  </h2>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      job.status === "open"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : job.status === "draft"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </div>
                  <div>
                    Openings: <strong className="text-slate-800">{job.openings}</strong> • Hired:{" "}
                    <strong className="text-emerald-600">{job.hired_count || 0}</strong>
                  </div>
                  <div>
                    Total Applicants:{" "}
                    <strong className="text-blue-600">{job.application_count || 0}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Recruiters:{" "}
                    {job.assigned_recruiters && job.assigned_recruiters.length > 0
                      ? job.assigned_recruiters.map((r) => r.full_name).join(", ")
                      : "None assigned"}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Manage Position <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
