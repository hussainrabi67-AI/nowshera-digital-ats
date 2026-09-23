import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { getCandidateApplications } from "@/lib/services/applications";
import { StageBadge } from "@/components/stage-badge";
import {
  Briefcase,
  FileText,
  Calendar,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CandidateDashboardPage() {
  let authResult;
  try {
    authResult = await requireAuth();
  } catch {
    redirect("/login?redirect=/candidate/dashboard");
  }

  const { profile } = authResult;
  const applications = await getCandidateApplications(profile.id);

  const activeApps = applications.filter((a) => !["withdrawn", "rejected"].includes(a.stage));
  const upcomingInterviews = applications
    .filter((a) => a.interview && new Date(a.interview.starts_at).getTime() > Date.now())
    .map((a) => ({
      appId: a.id,
      jobTitle: a.job?.title || "Job Position",
      startsAt: a.interview!.starts_at,
      endsAt: a.interview!.ends_at,
    }));

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Candidate Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile.full_name || "Candidate"}!
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            Track your submitted applications, view upcoming interview schedules, and explore new open career opportunities.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm transition shadow-sm self-start sm:self-auto shrink-0"
        >
          <Briefcase className="w-4 h-4" />
          Browse Open Jobs
        </Link>
      </div>

      {/* Upcoming Interview Callout if any */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
            <Calendar className="w-5 h-5 text-amber-600" />
            Upcoming Scheduled Interview
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingInterviews.map((item) => (
              <div
                key={item.appId}
                className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{item.jobTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled Duration: Exactly 60 minutes
                  </p>
                  <div className="mt-2 text-sm text-amber-900 font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>
                      {new Date(item.startsAt).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(item.endsAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/candidate/applications/${item.appId}`}
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  View Application Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Applications
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {applications.length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active in Pipeline
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">
            {activeApps.length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Interviews Scheduled
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">
            {upcomingInterviews.length}
          </div>
        </div>
      </div>

      {/* My Applications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Applications</h2>
            <p className="text-xs text-slate-500">
              Live status and history for every position you've applied for.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                You haven&apos;t applied for any jobs yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Explore available opportunities at Nowshera Digital and submit your first application.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
            >
              Browse Open Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => {
              const appliedDate = new Date(app.applied_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">
                        {app.job?.title || "Position Title"}
                      </h3>
                      <StageBadge stage={app.stage} />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Applied on {appliedDate}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        CV: {app.cv_original_name}
                      </div>
                      {app.interview && (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          Interview:{" "}
                          {new Date(app.interview.starts_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/candidate/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      Track Application <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
