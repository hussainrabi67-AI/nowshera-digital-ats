import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { getJobById } from "@/lib/services/jobs";
import { getApplicationsForJob } from "@/lib/services/applications";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import { StageBadge } from "@/components/stage-badge";
import { AdminJobActions } from "@/components/admin-job-actions";
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let authResult;
  try {
    authResult = await requireAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const supabase = await createClient();
  const { data: allRecruiters } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "recruiter")
    .order("full_name", { ascending: true });

  const applications = await getApplicationsForJob(id);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Jobs
        </Link>
      </div>

      {/* Main Job Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
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
              <span className="text-xs text-slate-400">Position ID: {job.id.slice(0, 8)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
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

          <div className="text-right text-xs text-slate-500 space-y-1">
            <div>
              Openings: <strong className="text-slate-800">{job.openings}</strong>
            </div>
            <div>
              Hired: <strong className="text-emerald-600">{job.hired_count || 0}</strong>
            </div>
            <div>
              Applications: <strong className="text-blue-600">{applications.length}</strong>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <AdminJobActions
          job={job}
          allRecruiters={(allRecruiters || []) as Profile[]}
        />

        {/* Specifications */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Description
            </h3>
            <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Requirements
            </h3>
            <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
              {job.requirements}
            </p>
          </div>
        </div>
      </div>

      {/* Applications Directory for this Job */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Candidate Applications ({applications.length})
          </h2>
          <span className="text-xs text-slate-400">
            All candidates submitted for this position
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No applications submitted for this job yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Applied At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {app.candidate?.full_name || "Applicant"}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{app.candidate?.email}</td>
                    <td className="py-3 px-3">
                      <StageBadge stage={app.stage} />
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/recruiter/applications/${app.id}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
