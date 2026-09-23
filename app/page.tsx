import Link from "next/link";
import { getOpenJobs } from "@/lib/services/jobs";
import {
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jobs = await getOpenJobs();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Nowshera Digital Hiring Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Empowering Careers. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
              Transforming Recruitment.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-lg sm:text-xl font-normal leading-relaxed">
            Welcome to Nowshera Digital ATS. A modern recruitment ecosystem replacing scattered emails and spreadsheets with real-time pipelines, conflict-free interview scheduling, and private document security.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            >
              <Briefcase className="w-5 h-5" />
              Explore Open Positions ({jobs.length})
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-base transition"
            >
              Create Candidate Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-left">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-sky-400">{jobs.length}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Open Positions</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Encrypted CV Vault</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-blue-400">Conflict-Free</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Smart Interview Scheduler</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-2xl font-bold text-purple-400">Instant</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Status Notifications</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured Opportunities
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Apply online with your PDF CV in less than 2 minutes.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            View all jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800">No open positions at this moment</h3>
            <p className="text-sm text-slate-500 mt-1">
              Check back soon for exciting career opportunities at Nowshera Digital.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.slice(0, 6).map((job) => {
              const deadlineDate = new Date(job.deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={job.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {job.title}
                      </h3>
                      <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {job.openings} {job.openings === 1 ? "opening" : "openings"}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2">
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {job.employment_type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {deadlineDate}
                      </span>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Nowshera Digital
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs hover:bg-blue-600 hover:text-white transition"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Role Portals Information */}
      <section className="bg-slate-100/70 border-t border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Designed For Every Stakeholder
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Strict role-based access control protecting candidate privacy and recruiter workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Candidate Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Candidates</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Browse open positions, upload your PDF resume, monitor application progress in real-time, and manage scheduled interviews.
                </p>
              </div>
              <div className="pt-6 mt-4">
                <Link
                  href="/jobs"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  Start applying <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Recruiter Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Recruiters</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Manage assigned jobs, move candidates through the interactive Kanban pipeline, schedule 60-minute interviews with overlap detection, and record private evaluation notes.
                </p>
              </div>
              <div className="pt-6 mt-4">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  Recruiter sign in <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Admin Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Admins</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gain complete visibility across the hiring funnel, assign recruiters to open jobs, create drafts, monitor automated emails, and review live ATS analytics.
                </p>
              </div>
              <div className="pt-6 mt-4">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                >
                  Admin dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-slate-400 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            &copy; {new Date().getFullYear()} Nowshera Digital ATS. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Server-Validated ATS</span>
            <span>•</span>
            <span>Private Storage Vault</span>
            <span>•</span>
            <span>n8n Integrated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
