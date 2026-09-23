"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Application, ApplicationStage, Job } from "@/lib/types";
import { StageBadge } from "@/components/stage-badge";
import {
  Calendar,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  Gift,
  AlertCircle,
  Loader2,
  Filter,
  Eye,
} from "lucide-react";

interface KanbanPipelineProps {
  jobs: Job[];
  initialApplications: Application[];
  selectedJobId?: string;
}

const PIPELINE_COLUMNS: {
  stage: ApplicationStage;
  title: string;
  color: string;
}[] = [
  { stage: "applied", title: "Applied", color: "border-blue-500" },
  { stage: "shortlisted", title: "Shortlisted", color: "border-sky-500" },
  { stage: "interview", title: "Interview", color: "border-indigo-500" },
  { stage: "offer", title: "Offer", color: "border-amber-500" },
  { stage: "hired", title: "Hired", color: "border-emerald-500" },
  { stage: "rejected", title: "Rejected", color: "border-rose-500" },
  { stage: "withdrawn", title: "Withdrawn", color: "border-slate-400" },
];

export function KanbanPipeline({
  jobs,
  initialApplications,
  selectedJobId,
}: KanbanPipelineProps) {
  const router = useRouter();

  const [currentJobId, setCurrentJobId] = useState<string>(
    selectedJobId || ""
  );

  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interview modal
  const [interviewModalApp, setInterviewModalApp] =
    useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [interviewTime, setInterviewTime] = useState<string>("");
  const [schedulingInterview, setSchedulingInterview] = useState(false);

  // Hiring modal
  const [hiringModalApp, setHiringModalApp] =
    useState<Application | null>(null);
  const [confirmingHire, setConfirmingHire] = useState(false);

  // Rejection modal
  const [rejectionModalApp, setRejectionModalApp] =
    useState<Application | null>(null);
  const [confirmingReject, setConfirmingReject] = useState(false);

  const filteredApps = currentJobId
    ? initialApplications.filter((a) => a.job_id === currentJobId)
    : initialApplications;

  async function handleTransition(
    applicationId: string,
    newStage: ApplicationStage
  ) {
    setLoadingAppId(applicationId);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_stage: newStage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || "Failed to update application stage"
        );
      }

      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Stage transition failed");
    } finally {
      setLoadingAppId(null);
    }
  }

  async function handleScheduleInterviewSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!interviewModalApp || !interviewDate || !interviewTime) {
      return;
    }

    setSchedulingInterview(true);
    setErrorMsg(null);

    try {
      const combinedDateTime = new Date(
        `${interviewDate}T${interviewTime}:00`
      );

      if (
        isNaN(combinedDateTime.getTime()) ||
        combinedDateTime.getTime() <= Date.now()
      ) {
        throw new Error("Interview must be scheduled in the future");
      }

      const res = await fetch(
        `/api/applications/${interviewModalApp.id}/interviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            starts_at: combinedDateTime.toISOString(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || "Failed to schedule interview"
        );
      }

      setInterviewModalApp(null);
      setInterviewDate("");
      setInterviewTime("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule interview");
    } finally {
      setSchedulingInterview(false);
    }
  }

  async function handleHireSubmit() {
    if (!hiringModalApp) {
      return;
    }

    setConfirmingHire(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/applications/${hiringModalApp.id}/stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_stage: "hired",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || "Hiring capacity reached or failed"
        );
      }

      setHiringModalApp(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Hiring failed");
    } finally {
      setConfirmingHire(false);
    }
  }

  async function handleRejectSubmit() {
    if (!rejectionModalApp) {
      return;
    }

    setConfirmingReject(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/applications/${rejectionModalApp.id}/stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_stage: "rejected",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || "Failed to reject application"
        );
      }

      setRejectionModalApp(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Rejection failed");
    } finally {
      setConfirmingReject(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />

          <span className="text-xs font-semibold text-slate-600">
            Filter Position:
          </span>

          <select
            value={currentJobId}
            onChange={(e) => {
              const value = e.target.value;

              setCurrentJobId(value);

              router.push(
                value
                  ? `/recruiter/pipeline?job_id=${value}`
                  : "/recruiter/pipeline"
              );
            }}
            className="flex-1 sm:w-64 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">
              All Assigned Positions ({jobs.length})
            </option>

            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.status})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredApps.length}</strong> candidates in
          pipeline
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>

          <button
            onClick={() => setErrorMsg(null)}
            className="font-bold hover:underline text-rose-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1400px]">
          {PIPELINE_COLUMNS.map((col) => {
            const columnApps = filteredApps.filter(
              (a) => a.stage === col.stage
            );

            return (
              <div
                key={col.stage}
                className="w-72 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[78vh]"
              >
                {/* Column Header */}
                <div
                  className={`p-3 bg-white rounded-xl border-t-4 ${col.color} border-slate-200/80 shadow-sm mb-3 flex items-center justify-between`}
                >
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    {col.title}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {columnApps.length}
                  </span>
                </div>

                {/* Candidates */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnApps.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      No candidates
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const isLoading = loadingAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition"
                        >
                          {/* Candidate Header */}
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                {app.candidate?.full_name || "Applicant"}
                              </h4>

                              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {app.candidate?.email}
                              </p>
                            </div>

                            <Link
                              href={`/recruiter/applications/${app.id}`}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                              title="View Application Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>

                          {/* Application Information */}
                          <div className="text-[10px] text-slate-400 space-y-0.5">
                            <div>Role: {app.job?.title}</div>

                            <div>
                              Applied:{" "}
                              {new Date(app.applied_at)
                                .toISOString()
                                .slice(0, 10)}
                            </div>

                            {app.interview && (
                              <div className="text-indigo-600 font-semibold flex items-center gap-1 pt-0.5">
                                <Calendar className="w-3 h-3" />

                                {new Date(app.interview.starts_at)
                                  .toISOString()
                                  .slice(0, 16)
                                  .replace("T", " ")}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {isLoading ? (
                              <div className="w-full py-1 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Updating...
                              </div>
                            ) : (
                              <>
                                {/* Applied */}
                                {app.stage === "applied" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleTransition(
                                          app.id,
                                          "shortlisted"
                                        )
                                      }
                                      className="flex-1 py-1 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-[11px] transition flex items-center justify-center gap-1"
                                    >
                                      <UserCheck className="w-3 h-3" />
                                      Shortlist
                                    </button>

                                    <button
                                      onClick={() =>
                                        setRejectionModalApp(app)
                                      }
                                      className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                                      title="Reject candidate"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                  </>
                                )}

                                {/* Shortlisted */}
                                {app.stage === "shortlisted" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setInterviewModalApp(app);

                                        setInterviewDate(
                                          new Date(Date.now() + 86400000)
                                            .toISOString()
                                            .split("T")[0]
                                        );

                                        setInterviewTime("10:00");
                                      }}
                                      className="flex-1 py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition flex items-center justify-center gap-1"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      Schedule
                                    </button>

                                    <button
                                      onClick={() =>
                                        setRejectionModalApp(app)
                                      }
                                      className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                  </>
                                )}

                                {/* Interview */}
                                {app.stage === "interview" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleTransition(app.id, "offer")
                                      }
                                      className="flex-1 py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] transition flex items-center justify-center gap-1"
                                    >
                                      <Gift className="w-3 h-3" />
                                      Extend Offer
                                    </button>

                                    <button
                                      onClick={() =>
                                        setRejectionModalApp(app)
                                      }
                                      className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                  </>
                                )}

                                {/* Offer */}
                                {app.stage === "offer" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        setHiringModalApp(app)
                                      }
                                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition flex items-center justify-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Mark Hired
                                    </button>

                                    <button
                                      onClick={() =>
                                        setRejectionModalApp(app)
                                      }
                                      className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                  </>
                                )}

                                {/* Hired */}
                                {app.stage === "hired" && (
                                  <span className="text-[10px] text-emerald-600 font-semibold">
                                    Hired Candidate
                                  </span>
                                )}

                                {/* Rejected */}
                                {app.stage === "rejected" && (
                                  <span className="text-[10px] text-rose-500 font-medium">
                                    Rejected
                                  </span>
                                )}

                                {/* Withdrawn */}
                                {app.stage === "withdrawn" && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Candidate Withdrawn
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {interviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Schedule 60-Min Interview
                </h4>

                <p className="text-xs text-slate-500">
                  Candidate:{" "}
                  {interviewModalApp.candidate?.full_name}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleScheduleInterviewSubmit}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interview Date
                </label>

                <input
                  type="date"
                  required
                  value={interviewDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Time
                </label>

                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                <p className="text-[11px] text-slate-400 mt-1">
                  Duration is strictly 60 minutes. End time will be
                  calculated automatically.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInterviewModalApp(null)}
                  disabled={schedulingInterview}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={schedulingInterview}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {schedulingInterview ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Confirm Schedule"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Hire Modal */}
      {hiringModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Mark Candidate as Hired?
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to mark{" "}
                <strong>
                  {hiringModalApp.candidate?.full_name}
                </strong>{" "}
                as Hired?
                <br />
                This action is final. If the total hired count reaches
                the job openings, the position will automatically close
                to new applicants.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHiringModalApp(null)}
                disabled={confirmingHire}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleHireSubmit}
                disabled={confirmingHire}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {confirmingHire ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Yes, Mark Hired"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reject Modal */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Reject Candidate?
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to reject{" "}
                <strong>
                  {rejectionModalApp.candidate?.full_name}
                </strong>
                ?
                <br />
                This decision will be recorded in the audit history and
                a polite rejection notification email will be queued.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalApp(null)}
                disabled={confirmingReject}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={confirmingReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {confirmingReject ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Yes, Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}