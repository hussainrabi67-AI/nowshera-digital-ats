import Link from "next/link";
import { getOpenJobs } from "@/lib/services/jobs";
import { Briefcase, MapPin, Calendar, Search, ArrowRight, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    location?: string;
    employment_type?: string;
  }>;
}) {
  const params = await searchParams;
  const jobs = await getOpenJobs(params);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Career Opportunities
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Join Nowshera Digital. Browse open roles, review job requirements, and submit your application with a PDF CV.
        </p>
      </div>

      {/* Search & Filter Bar */}
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
            placeholder="Search by job title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="w-full md:w-48 relative">
          <input
            type="text"
            name="location"
            defaultValue={params.location || ""}
            placeholder="Location..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="w-full md:w-48 relative">
          <select
            name="employment_type"
            defaultValue={params.employment_type || ""}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm"
        >
          <Filter className="w-4 h-4" />
          Filter Jobs
        </button>
      </form>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No open positions found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {params.search || params.location || params.employment_type
              ? "Try adjusting your search filters to find available positions."
              : "There are currently no active job postings. Please check back later."}
          </p>
          {(params.search || params.location || params.employment_type) && (
            <Link
              href="/jobs"
              className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const deadlineDate = new Date(job.deadline).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">
                      {job.title}
                    </h2>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {job.openings} {job.openings === 1 ? "opening" : "openings"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-sm"
                  >
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
