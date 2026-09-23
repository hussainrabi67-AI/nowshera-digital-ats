import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRecruiter } from "@/lib/auth/server";
import { getRecruiterJobs } from "@/lib/services/jobs";
import { Briefcase, ArrowRight, Layers, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruiterJobsPage() {
  let authResult;
  try {
    authResult = await requireRecruiter();
  } catch {
    redirect("/login");
  }

  const { profile } = authResult;
  const jobs = await getRecruiterJobs(profile.id);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Assigned Positions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Jobs you are assigned to evaluate and interview candidates for.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No jobs assigned to you yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Once an administrator assigns you to a job posting, it will appear in your workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    {job.title}
                  </h2>
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

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div>
                    Openings: <strong className="text-slate-800">{job.openings}</strong>
                  </div>
                  <div>
                    Applications:{" "}
                    <strong className="text-slate-800">{job.application_count || 0}</strong>
                  </div>
                  <div>
                    Hired:{" "}
                    <strong className="text-emerald-600">{job.hired_count || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/recruiter/pipeline?job_id=${job.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  <Layers className="w-3.5 h-3.5" /> Pipeline View
                </Link>
                <Link
                  href={`/recruiter/jobs/${job.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Overview <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
