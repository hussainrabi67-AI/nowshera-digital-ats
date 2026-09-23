import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { assertApplicationAccess, requireRecruiter } from "@/lib/auth/server";
import { getApplicationDetails } from "@/lib/services/applications";
import { getApplicationNotes } from "@/lib/services/notes";
import { StageBadge } from "@/components/stage-badge";
import { StageHistoryTimeline } from "@/components/stage-history-timeline";
import { RecruiterApplicationPanel } from "@/components/recruiter-application-panel";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruiterApplicationDetailPage({
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
    await assertApplicationAccess(id, profile.id, profile.role);
  } catch {
    notFound();
  }

  const details = await getApplicationDetails(id, profile.role);
  const notes = await getApplicationNotes(id);
  const { application, history, interview } = details;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <Link
          href={`/recruiter/pipeline?job_id=${application.job_id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </Link>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Candidate Evaluation
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {application.candidate?.full_name || "Applicant Name"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {application.candidate?.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {application.job?.title}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Applied: {new Date(application.applied_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-2">
            <StageBadge stage={application.stage} className="text-sm px-3.5 py-1.5" />
            <span className="text-[11px] text-slate-400">ID: {application.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Scheduled Interview Banner if any */}
        {interview && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Interview Scheduled:</span>
              <span>
                {new Date(interview.starts_at).toLocaleString()} -{" "}
                {new Date(interview.ends_at).toLocaleTimeString()}
              </span>
            </div>
            <span className="text-indigo-700">60-minute session</span>
          </div>
        )}

        {/* Interactive Recruiter Panel */}
        <RecruiterApplicationPanel
          application={application}
          initialNotes={notes}
        />
      </div>

      {/* Stage History & Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Application Stage Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically audited record of transitions and responsible evaluators.
          </p>
        </div>

        <StageHistoryTimeline history={history} />
      </div>
    </div>
  );
}
