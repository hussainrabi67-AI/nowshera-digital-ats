"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CvDropzone } from "@/components/cv-dropzone";
import { Job, Profile } from "@/lib/types";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  X,
  Send,
} from "lucide-react";

interface ApplyModalProps {
  job: Job;
  profile: Profile | null;
}

export function ApplyModal({ job, profile }: ApplyModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isExpired = new Date(job.deadline).getTime() <= Date.now();
  const isClosed = job.status !== "open" || isExpired;

  function handleOpen() {
    if (!profile) {
      router.push(`/login?redirect=/jobs/${job.id}`);
      return;
    }
    setIsOpen(true);
    setError(null);
    setSuccess(false);
    setSelectedFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please attach a valid PDF CV document.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("job_id", job.id);
      formData.append("cv", selectedFile);

      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to submit application");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isClosed}
        className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 ${
          isClosed
            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-blue-600/30"
        }`}
      >
        <Send className="w-4 h-4" />
        {isClosed ? "Applications Closed" : "Apply for this Position"}
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submit Application
                </h3>
                <p className="text-xs text-slate-500">{job.title}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {success ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      Application Submitted!
                    </h4>
                    <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                      Thank you for applying. Your application is now under review. A confirmation email has been logged.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => router.push("/candidate/dashboard")}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
                    >
                      View My Applications
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Candidate Info Summary */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800">
                      Applicant: {profile?.full_name}
                    </div>
                    <div>Email: {profile?.email}</div>
                  </div>

                  {/* CV Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">
                      Upload Resume / CV <span className="text-rose-500">*</span>
                    </label>
                    <CvDropzone
                      onFileSelect={(file) => setSelectedFile(file)}
                      disabled={loading}
                    />
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedFile}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
