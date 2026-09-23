import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { assertApplicationAccess, requireAuth } from "@/lib/auth/server";
import { getApplicationDetails } from "@/lib/services/applications";
import { StageBadge } from "@/components/stage-badge";
import { StageHistoryTimeline } from "@/components/stage-history-timeline";
import { CandidateApplicationActions } from "@/components/candidate-application-actions";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  MapPin,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CandidateApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let authResult;
  try {
    authResult = await requireAuth();
  } catch {
    redirect("/login");
  }

  const { profile } = authResult;
  const { id } = await params;

  try {
    await assertApplicationAccess(id, profile.id, profile.role);
  } catch {
    notFound();
  }

  const details = await getApplicationDetails(id, profile.role);
  const { application, history, interview } = details;

  const appliedDate = new Date(application.applied_at).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Back to Applications */}
      <div>
        <Link
          href="/candidate/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Applications
        </Link>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Application Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {application.job?.title || "Job Application"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {application.job?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {application.job.location}
                </span>
              )}
              {application.job?.employment_type && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {application.job.employment_type}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Applied: {appliedDate}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-2">
            <StageBadge stage={application.stage} className="text-sm px-3.5 py-1.5" />
            <span className="text-[11px] text-slate-400">Application ID: {application.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Scheduled Interview Callout if scheduled */}
        {interview && (
          <div className="p-5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Interview Scheduled
            </div>
            <p className="text-xs text-indigo-700">
              You have been invited for a 60-minute interview with Nowshera Digital.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-950 flex flex-wrap items-center gap-4">
              <span>
                Start: {new Date(interview.starts_at).toLocaleString()}
              </span>
              <span>
                End: {new Date(interview.ends_at).toLocaleTimeString()}
              </span>
              {interview.recruiter && (
                <span>Interviewer: {interview.recruiter.full_name}</span>
              )}
            </div>
          </div>
        )}

        {/* CV & Actions Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Submitted Resume & Documents
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {application.cv_original_name}
                </div>
                <div className="text-xs text-slate-500">
                  {(application.cv_size_bytes / 1024).toFixed(1)} KB • PDF Document
                </div>
              </div>
            </div>

            <CandidateApplicationActions application={application} />
          </div>
        </div>
      </div>

      {/* Stage History & Audit Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Application Progress Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full audit log of stage updates since your submission.
          </p>
        </div>

        <StageHistoryTimeline history={history} />
      </div>
    </div>
  );
}
