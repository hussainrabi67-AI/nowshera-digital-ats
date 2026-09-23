import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobById } from "@/lib/services/jobs";
import { getCurrentProfile } from "@/lib/auth/server";
import { ApplyModal } from "@/components/apply-modal";
import {
  Briefcase,
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  const profile = await getCurrentProfile();

  if (!job) {
    notFound();
  }

  // Draft jobs are invisible to candidates (PRD Section 9 & 25)
  if (job.status === "draft" && profile?.role !== "admin") {
    notFound();
  }

  const isExpired = new Date(job.deadline).getTime() <= Date.now();
  const isClosed = job.status !== "open" || isExpired;

  const deadlineDate = new Date(job.deadline).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to open jobs
        </Link>
      </div>

      {/* Main Job Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header banner */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-100 text-blue-700">
              Nowshera Digital
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isClosed
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {isClosed ? "Applications Closed" : "Actively Hiring"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pt-1">
            {job.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {job.employment_type}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              {job.openings} {job.openings === 1 ? "opening" : "openings"}
            </span>
          </div>
        </div>

        {/* Status Callout if closed or expired */}
        {isClosed && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex items-center gap-3 text-xs sm:text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              {isExpired
                ? `The application deadline for this role passed on ${deadlineDate}. New applications are closed.`
                : "This position is currently marked as closed. We are no longer accepting new submissions."}
            </span>
          </div>
        )}

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Job Description</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Requirements & Qualifications</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </div>
          </div>

          {/* Deadline info box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Application Deadline:</span>
              <strong className="text-slate-800">{deadlineDate}</strong>
            </div>
          </div>

          {/* Apply Section */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              PDF CV required (Max 2 MB). Your CV is encrypted and kept private.
            </div>
            <ApplyModal job={job} profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}
