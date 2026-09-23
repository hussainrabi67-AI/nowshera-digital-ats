"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/types";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface CreateJobFormProps {
  recruiters: Profile[];
}

export function CreateJobForm({ recruiters }: CreateJobFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("Nowshera, KPK");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [openings, setOpenings] = useState<number>(1);
  // Default deadline 30 days ahead
  const defaultDeadline = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];
  const [deadlineDate, setDeadlineDate] = useState(defaultDeadline);
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [status, setStatus] = useState<"draft" | "open">("draft");
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRecruiter(recruiterId: string) {
    if (selectedRecruiters.includes(recruiterId)) {
      setSelectedRecruiters(selectedRecruiters.filter((id) => id !== recruiterId));
    } else {
      setSelectedRecruiters([...selectedRecruiters, recruiterId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const combinedDeadline = new Date(`${deadlineDate}T${deadlineTime}:00`);
      if (isNaN(combinedDeadline.getTime()) || combinedDeadline.getTime() <= Date.now()) {
        throw new Error("Deadline must be a valid future date");
      }

      if (openings < 1) {
        throw new Error("Openings must be at least 1");
      }

      const payload = {
        title,
        description,
        requirements,
        location: location || null,
        employment_type: employmentType || null,
        openings: Number(openings),
        deadline: combinedDeadline.toISOString(),
        status,
        recruiter_ids: selectedRecruiters,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create job");
      }

      router.push("/admin/jobs");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Position Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Full Stack Engineer"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Job Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          minLength={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role responsibilities and mission..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
        />
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Requirements & Qualifications <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          minLength={5}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="List key technical skills, experience levels, education..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
        />
      </div>

      {/* Location & Employment Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nowshera, Hybrid, Remote"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Employment Type
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Openings & Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Number of Openings <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            required
            min={1}
            value={openings}
            onChange={(e) => setOpenings(parseInt(e.target.value, 10) || 1)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Job automatically closes once this number is filled.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Application Deadline Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deadline Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="time"
            required
            value={deadlineTime}
            onChange={(e) => setDeadlineTime(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
          />
        </div>
      </div>

      {/* Initial Status: Draft vs Open */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Publishing Status
        </label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span>Draft (Invisible to candidates until opened)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="open"
              checked={status === "open"}
              onChange={() => setStatus("open")}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span>Open (Immediately accepting candidate applications)</span>
          </label>
        </div>
      </div>

      {/* Recruiter Assignment */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Assign Recruiters
          </label>
          <p className="text-xs text-slate-500">
            Assigned recruiters will be authorized to view applications, move pipeline stages, and schedule interviews.
          </p>
        </div>

        {recruiters.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No recruiter accounts created yet. You can assign recruiters later from the job management view.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recruiters.map((r) => {
              const isSelected = selectedRecruiters.includes(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => toggleRecruiter(r.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 text-blue-900 font-semibold"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <div>{r.full_name || "Recruiter"}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{r.email}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating Position...
            </>
          ) : (
            "Save Position"
          )}
        </button>
      </div>
    </form>
  );
}
