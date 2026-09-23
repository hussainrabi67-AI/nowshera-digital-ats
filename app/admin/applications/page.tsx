import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { getAllApplicationsAdmin } from "@/lib/services/applications";
import { getAdminJobs } from "@/lib/services/jobs";
import { StageBadge } from "@/components/stage-badge";
import { Filter, Search, ArrowRight, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; job_id?: string; search?: string }>;
}) {
  let authResult;
  try {
    authResult = await requireAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const allApplications = await getAllApplicationsAdmin();
  const jobs = await getAdminJobs();

  let filtered = allApplications;
  if (params.stage) {
    filtered = filtered.filter((a) => a.stage === params.stage);
  }
  if (params.job_id) {
    filtered = filtered.filter((a) => a.job_id === params.job_id);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.candidate?.full_name?.toLowerCase().includes(q) ||
        a.candidate?.email?.toLowerCase().includes(q) ||
        a.job?.title?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Application Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Master registry of all candidate submissions across every department and stage.
        </p>
      </div>

      {/* Filter Bar */}
      <form
        method="GET"
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch"
      >
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="search"
            defaultValue={params.search || ""}
            placeholder="Search candidate name, email, or position..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            name="stage"
            defaultValue={params.stage || ""}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Stages</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>

        <div className="w-full md:w-56">
          <select
            name="job_id"
            defaultValue={params.job_id || ""}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Positions</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
        >
          <Filter className="w-3.5 h-3.5" /> Apply Filter
        </button>
      </form>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Displaying <strong>{filtered.length}</strong> of {allApplications.length} submissions
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No applications match the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Applicant</th>
                  <th className="py-3 px-3">Position</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Applied</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {app.candidate?.full_name || "Applicant"}
                      </div>
                      <div className="text-[11px] text-slate-400">{app.candidate?.email}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {app.job?.title}
                    </td>
                    <td className="py-3 px-3">
                      <StageBadge stage={app.stage} />
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/recruiter/applications/${app.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                      >
                        Review <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
