"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Application, ApplicationStage } from "@/lib/types";
import {
  Download,
  AlertTriangle,
  Loader2,
  FileText,
  XCircle,
} from "lucide-react";

interface CandidateApplicationActionsProps {
  application: Application;
}

export function CandidateApplicationActions({
  application,
}: CandidateApplicationActionsProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canWithdraw = !["withdrawn", "rejected", "hired"].includes(
    application.stage
  );

  async function handleDownloadCv() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${application.id}/cv`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to get CV download URL");
      }

      // Open signed URL
      window.open(data.data.signedUrl, "_blank");
    } catch (err: any) {
      setError(err.message || "Failed to download CV");
    } finally {
      setDownloading(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${application.id}/withdraw`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to withdraw application");
      }

      setConfirmWithdrawOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownloadCv}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4 text-slate-500" />
          )}
          Download Submitted CV ({application.cv_original_name})
        </button>

        {canWithdraw && (
          <button
            onClick={() => setConfirmWithdrawOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
          >
            <XCircle className="w-4 h-4" />
            Withdraw Application
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Withdraw Application?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to withdraw your application? Your current submission and CV version will be archived. You will be able to reapply for this role with a new CV if the job is still open.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmWithdrawOpen(false)}
                disabled={withdrawing}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  "Yes, Withdraw"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
