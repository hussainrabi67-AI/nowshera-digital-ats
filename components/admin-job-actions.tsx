"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Job, Profile } from "@/lib/types";
import {
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AdminJobActionsProps {
  job: Job;
  allRecruiters: Profile[];
}

export function AdminJobActions({ job, allRecruiters }: AdminJobActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedNewRecruiter, setSelectedNewRecruiter] = useState("");

  const assignedIds = (job.assigned_recruiters || []).map((r) => r.id);
  const unassignedRecruiters = allRecruiters.filter((r) => !assignedIds.includes(r.id));

  async function handleStatusChange(action: "open" | "close") {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to ${action} job`);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to ${action} job`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignRecruiter(recruiterId: string) {
    if (!recruiterId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/recruiters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiter_id: recruiterId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to assign recruiter");
      }
      setSelectedNewRecruiter("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to assign recruiter");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnassignRecruiter(recruiterId: string) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/recruiters?recruiter_id=${recruiterId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to remove recruiter assignment");
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove recruiter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Publishing & Lifecycle Controls
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {job.status === "draft" && (
            <button
              onClick={() => handleStatusChange("open")}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Publish &amp; Open to Candidates
            </button>
          )}

          {job.status === "open" && (
            <button
              onClick={() => handleStatusChange("close")}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              Close Position (Reject New Applications)
            </button>
          )}

          {job.status === "closed" && (
            <button
              onClick={() => handleStatusChange("open")}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Reopen Position
            </button>
          )}
        </div>
      </div>

      {/* Assigned Recruiters Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Assigned Recruiters
            </h3>
            <p className="text-xs text-slate-500">
              Recruiters with evaluation and interviewing privileges for this position.
            </p>
          </div>
        </div>

        {/* Current list */}
        <div className="space-y-2">
          {(!job.assigned_recruiters || job.assigned_recruiters.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No recruiters assigned to this position.</p>
          ) : (
            job.assigned_recruiters.map((recruiter) => (
              <div
                key={recruiter.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{recruiter.full_name}</div>
                  <div className="text-[11px] text-slate-500">{recruiter.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnassignRecruiter(recruiter.id)}
                  disabled={loading}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                  title="Remove assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add new recruiter assignment */}
        {unassignedRecruiters.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <select
              value={selectedNewRecruiter}
              onChange={(e) => setSelectedNewRecruiter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select recruiter to assign...</option>
              {unassignedRecruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name} ({r.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleAssignRecruiter(selectedNewRecruiter)}
              disabled={loading || !selectedNewRecruiter}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Assign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
