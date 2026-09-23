import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminDashboardStats } from "@/lib/services/stats";
import { AdminCharts } from "@/components/admin-charts";
import {
  Briefcase,
  Layers,
  Calendar,
  Gift,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Users,
  Mail,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let authResult;
  try {
    authResult = await requireAdmin();
  } catch {
    redirect("/login?redirect=/admin/dashboard");
  }

  const { profile } = authResult;
  const stats = await getAdminDashboardStats();

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Nowshera Digital ATS Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live recruitment intelligence calculated directly from PostgreSQL database records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Job
          </Link>
          <Link
            href="/admin/recruiters"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-sm"
          >
            <Users className="w-4 h-4 text-slate-500" />
            Recruiter Accounts
          </Link>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Jobs</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalJobs}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.openJobs} Open</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Applications</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.totalApplications}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.activeApplications} Active</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Interviews</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.interviewsScheduled}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scheduled</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Offers</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.offersMade}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Extended</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Hired</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.hiredCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Completed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Rejected</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{stats.rejectedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Not selected</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Withdrawn</div>
          <div className="text-2xl font-extrabold text-slate-600 mt-1">{stats.withdrawnCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Candidate initiated</div>
        </div>
      </div>

      {/* Recharts Funnel Visualization */}
      <AdminCharts funnel={stats.funnel} />

      {/* Per-Job Breakdown Table (PRD Section 36 & Test Case 10) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Job Breakdown & Pipeline Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative real-time candidate distributions for each position.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {stats.jobsBreakdown.length} Positions Analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Job Title</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Openings</th>
                <th className="py-3 px-2">Total</th>
                <th className="py-3 px-2">Applied</th>
                <th className="py-3 px-2">Shortlist</th>
                <th className="py-3 px-2">Interview</th>
                <th className="py-3 px-2">Offer</th>
                <th className="py-3 px-2 text-emerald-600 font-bold">Hired</th>
                <th className="py-3 px-2 text-rose-600">Rejected</th>
                <th className="py-3 px-2 text-slate-500">Withdrawn</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {stats.jobsBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No jobs created yet.
                  </td>
                </tr>
              ) : (
                stats.jobsBreakdown.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.title}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.status === "open"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "draft"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium">{row.openings}</td>
                    <td className="py-3 px-2 font-bold text-blue-600">{row.total}</td>
                    <td className="py-3 px-2">{row.applied}</td>
                    <td className="py-3 px-2">{row.shortlisted}</td>
                    <td className="py-3 px-2">{row.interview}</td>
                    <td className="py-3 px-2">{row.offer}</td>
                    <td className="py-3 px-2 font-bold text-emerald-600">{row.hired}</td>
                    <td className="py-3 px-2 text-rose-600">{row.rejected}</td>
                    <td className="py-3 px-2 text-slate-400">{row.withdrawn}</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/jobs/${row.id}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
