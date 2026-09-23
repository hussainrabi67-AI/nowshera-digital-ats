import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { assertJobRecruiter, requireRecruiter } from "@/lib/auth/server";
import { getJobById } from "@/lib/services/jobs";
import { getApplicationsForJob } from "@/lib/services/applications";
import { StageBadge } from "@/components/stage-badge";
import {
  ArrowLeft,
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruiterJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let authResult;
  try {
    authResult = await requireRecruiter();
  } catch {
    redirect("/login");
  }

  const { profile } = authResult;
  const { id } = await params;

  try {
    await assertJobRecruiter(id, profile.id, profile.role);
  } catch {
    notFound();
  }

  const job = await getJobById(id);
  if (!job) notFound();

  const applications = await getApplicationsForJob(id);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assigned Jobs
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                job.status === "open"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {job.status}
            </span>
            <span className="text-xs text-slate-400">ID: {job.id.slice(0, 8)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {job.employment_type}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href={`/recruiter/pipeline?job_id=${job.id}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm"
          >
            <Layers className="w-4 h-4" />
            Open Kanban Pipeline
          </Link>
        </div>
      </div>

      {/* Applications List for this Job */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Applications ({applications.length})
          </h2>
          <span className="text-xs text-slate-500">
            Hired: {job.hired_count || 0} / {job.openings}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No candidates have applied for this job yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-base">
                    {app.candidate?.full_name || "Applicant"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {app.candidate?.email} • Applied on{" "}
                    {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <StageBadge stage={app.stage} />
                  <Link
                    href={`/recruiter/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    Manage <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
