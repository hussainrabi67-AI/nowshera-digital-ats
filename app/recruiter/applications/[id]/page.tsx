import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { assertApplicationAccess, requireRecruiter } from "@/lib/auth/server";
import { getApplicationDetails } from "@/lib/services/applications";
import { getApplicationNotes } from "@/lib/services/notes";
import { createClient } from "@/lib/supabase/server";
import { StageBadge } from "@/components/stage-badge";
import { StageHistoryTimeline } from "@/components/stage-history-timeline";
import { RecruiterApplicationPanel } from "@/components/recruiter-application-panel";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
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

  // Security: make sure this recruiter/admin is allowed
  // to access this application.
  try {
    await assertApplicationAccess(id, profile.id, profile.role);
  } catch {
    notFound();
  }

  const details = await getApplicationDetails(id, profile.role);
  const notes = await getApplicationNotes(id);

  const { application, history, interview } = details;

    // ---------------------------------------------------------
  // AI SUMMARY
  // ---------------------------------------------------------

  const supabase = await createClient();

  const { data: aiSummary, error: aiSummaryError } = await supabase
    .from("application_ai_summaries")
    .select(`
      id,
      application_id,
      summary,
      requirements_found,
      requirements_not_found,
      interview_questions,
      created_at,
      updated_at
    `)
    .eq("application_id", id)
    .maybeSingle();

  console.log("========== AI SUMMARY DEBUG ==========");
  console.log("APPLICATION ID:", id);
  console.log("AI SUMMARY:", aiSummary);
  console.log("AI SUMMARY ERROR:", aiSummaryError);
  console.log("======================================");

  function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }

      return [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }

  return [];
}

const summaryItems = parseJsonArray(aiSummary?.summary);

const requirementsFound = parseJsonArray(
  aiSummary?.requirements_found
);

const requirementsNotFound = parseJsonArray(
  aiSummary?.requirements_not_found
);

const interviewQuestions = parseJsonArray(
  aiSummary?.interview_questions
);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Back */}
      <div>
        <Link
          href={`/recruiter/pipeline?job_id=${application.job_id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </Link>
      </div>

      {/* Candidate Profile Header */}
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
                Applied:{" "}
                {new Date(application.applied_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-2">
            <StageBadge
              stage={application.stage}
              className="text-sm px-3.5 py-1.5"
            />

            <span className="text-[11px] text-slate-400">
              ID: {application.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Scheduled Interview */}
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

            <span className="text-indigo-700">
              60-minute session
            </span>
          </div>
        )}

        {/* -------------------------------------------------
            AI-GENERATED SUMMARY
        ------------------------------------------------- */}
        <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
          {/* AI Header */}
          <div className="flex items-center justify-between gap-4 border-b border-blue-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  AI-Generated Summary
                </h2>

                <p className="text-xs text-slate-500">
                  AI-assisted information for recruiter review
                </p>
              </div>
            </div>

            {aiSummary && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Written by AI
              </span>
            )}
          </div>

          {!aiSummary ? (
            /* AI unavailable */
            <div className="px-6 py-8">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                  <div>
                    <h3 className="font-semibold text-amber-900">
                      Summary not available
                    </h3>

                    <p className="mt-1 text-sm text-amber-800">
                      The AI summary has not been generated yet or could
                      not be loaded.
                    </p>

                    <p className="mt-3 text-xs text-amber-700">
                      You can try again after the AI processing has
                      completed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 p-6">
              {/* Profile */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Candidate Profile
                </h3>

                <div className="space-y-2">
                  {summaryItems.length > 0 ? (
                    summaryItems.map(
                      (item: string, index: number) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-lg bg-white border border-slate-200 p-3"
                        >
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />

                          <p className="text-sm leading-6 text-slate-700">
                            {item}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No profile summary available.
                    </p>
                  )}
                </div>
              </div>

              {/* Requirements */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Found */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Requirements Found
                  </h3>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    {requirementsFound.length > 0 ? (
                      <ul className="space-y-2">
                        {requirementsFound.map(
                          (item: string, index: number) => (
                            <li
                              key={index}
                              className="flex gap-2 text-sm text-emerald-900"
                            >
                              <span>✓</span>
                              <span>{item}</span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-emerald-800">
                        No specific requirements were identified.
                      </p>
                    )}
                  </div>
                </div>

                {/* Not Found */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Requirements Not Found
                  </h3>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    {requirementsNotFound.length > 0 ? (
                      <ul className="space-y-2">
                        {requirementsNotFound.map(
                          (item: string, index: number) => (
                            <li
                              key={index}
                              className="flex gap-2 text-sm text-amber-900"
                            >
                              <span>•</span>
                              <span>{item}</span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-800">
                        No missing requirements were identified.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Interview Questions */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  Interview Questions
                </h3>

                <div className="space-y-3">
                  {interviewQuestions.length > 0 ? (
                    interviewQuestions.map(
                      (question: string, index: number) => (
                        <div
                          key={index}
                          className="flex gap-4 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                            {index + 1}
                          </div>

                          <p className="text-sm leading-6 text-slate-700">
                            {question}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No interview questions are available.
                    </p>
                  )}
                </div>
              </div>

              {/* AI disclaimer */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  AI provides supporting information only. It does not
                  score, rank, recommend hiring or rejection, or change
                  the application stage. Recruitment decisions are made
                  by people.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Interactive Recruiter Panel */}
        <RecruiterApplicationPanel
          application={application}
          initialNotes={notes}
        />
      </div>

      {/* Stage History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Application Stage Audit Trail
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically audited record of transitions and
            responsible evaluators.
          </p>
        </div>

        <StageHistoryTimeline history={history} />
      </div>
    </div>
  );
}