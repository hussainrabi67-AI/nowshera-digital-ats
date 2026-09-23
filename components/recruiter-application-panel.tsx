"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Application, ApplicationNote, ApplicationStage } from "@/lib/types";
import {
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Gift,
  UserCheck,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface RecruiterApplicationPanelProps {
  application: Application;
  initialNotes: ApplicationNote[];
}

export function RecruiterApplicationPanel({
  application,
  initialNotes,
}: RecruiterApplicationPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<ApplicationNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [stageLoading, setStageLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interview scheduling modal state
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [scheduling, setScheduling] = useState(false);

  // Download CV
  async function handleDownloadCv() {
    setDownloadingCv(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/applications/${application.id}/cv`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to download CV");
      }
      window.open(data.data.signedUrl, "_blank");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to download CV");
    } finally {
      setDownloadingCv(false);
    }
  }

  // Change stage
  async function handleStageChange(newStage: ApplicationStage) {
    setStageLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/applications/${application.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_stage: newStage }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update stage");
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update stage");
    } finally {
      setStageLoading(false);
    }
  }

  // Schedule interview
  async function handleScheduleInterview(e: React.FormEvent) {
    e.preventDefault();
    setScheduling(true);
    setErrorMsg(null);
    try {
      const combinedDateTime = new Date(`${interviewDate}T${interviewTime}:00`);
      if (isNaN(combinedDateTime.getTime()) || combinedDateTime.getTime() <= Date.now()) {
        throw new Error("Interview must be scheduled in the future");
      }

      const res = await fetch(`/api/applications/${application.id}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starts_at: combinedDateTime.toISOString() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to schedule interview");
      }

      setInterviewModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule interview");
    } finally {
      setScheduling(false);
    }
  }

  // Add private note
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/applications/${application.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to add note");
      }

      setNotes([data.data, ...notes]);
      setNewNote("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  }

  const stage = application.stage;

  return (
    <div className="space-y-8">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stage Actions Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Hiring Workflow Controls
          </h2>
          <button
            onClick={handleDownloadCv}
            disabled={downloadingCv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition disabled:opacity-50"
          >
            {downloadingCv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            Download Resume ({application.cv_original_name})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          {stageLoading ? (
            <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Updating application stage...
            </div>
          ) : (
            <>
              {stage === "applied" && (
                <button
                  onClick={() => handleStageChange("shortlisted")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Shortlist Candidate
                </button>
              )}

              {stage === "shortlisted" && (
                <button
                  onClick={() => setInterviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule 60-Min Interview
                </button>
              )}

              {stage === "interview" && (
                <button
                  onClick={() => handleStageChange("offer")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <Gift className="w-3.5 h-3.5" /> Extend Job Offer
                </button>
              )}

              {stage === "offer" && (
                <button
                  onClick={() => handleStageChange("hired")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Hire
                </button>
              )}

              {!["hired", "rejected", "withdrawn"].includes(stage) && (
                <button
                  onClick={() => handleStageChange("rejected")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Candidate
                </button>
              )}

              {stage === "hired" && (
                <span className="text-xs font-semibold text-emerald-700 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                  Candidate successfully hired
                </span>
              )}

              {stage === "rejected" && (
                <span className="text-xs font-semibold text-rose-700 px-3 py-1 bg-rose-50 rounded-lg border border-rose-200">
                  Candidate rejected
                </span>
              )}

              {stage === "withdrawn" && (
                <span className="text-xs font-semibold text-slate-600 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                  Candidate withdrew application
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recruiter Private Notes Section (Strictly private from candidate!) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Private Recruiter Notes
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confidential internal feedback visible only to assigned recruiters and administrators. Never exposed to candidates.
          </p>
        </div>

        {/* Note creation input */}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            required
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add internal evaluation feedback or interview impressions..."
            className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addingNote || !newNote.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50 shadow-sm"
            >
              {addingNote ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Save Private Note
                </>
              )}
            </button>
          </div>
        </form>

        {/* Existing Notes list */}
        <div className="space-y-3 pt-2">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {note.note}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span>{note.recruiter?.full_name || "Recruiter"}</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {interviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Schedule 60-Min Interview</h4>
                <p className="text-xs text-slate-500">
                  Candidate: {application.candidate?.full_name}
                </p>
              </div>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-4 pt-2">
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
                  Duration is strictly 60 minutes. Server will verify that you have no conflicting interviews.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(false)}
                  disabled={scheduling}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {scheduling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scheduling...
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
    </div>
  );
}
