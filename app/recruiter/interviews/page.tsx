import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRecruiter } from "@/lib/auth/server";
import { getRecruiterInterviews } from "@/lib/services/interviews";
import { Calendar, Clock, User, Briefcase, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruiterInterviewsPage() {
  let authResult;
  try {
    authResult = await requireRecruiter();
  } catch {
    redirect("/login");
  }

  const { profile } = authResult;
  const interviews = await getRecruiterInterviews(profile.id);

  const now = Date.now();
  const upcoming = interviews.filter((i) => new Date(i.starts_at).getTime() >= now);
  const past = interviews.filter((i) => new Date(i.starts_at).getTime() < now);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Interview Schedule & Calendar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          All interviews are scheduled in fixed 60-minute blocks with overlap prevention.
        </p>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Upcoming Interviews ({upcoming.length})
        </h2>

        {upcoming.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-500">
            No upcoming interviews scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-sm hover:border-indigo-400 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      60 Minutes
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">
                    {item.application?.candidate?.full_name || "Applicant"}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {item.application?.job?.title}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.application?.candidate?.email}
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-semibold text-indigo-950 flex items-center gap-1.5 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>
                      {new Date(item.starts_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(item.ends_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/recruiter/applications/${item.application_id}`}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-2 border-t border-slate-100"
                >
                  View Candidate Application <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Section */}
      {past.length > 0 && (
        <div className="space-y-4 pt-6">
          <h2 className="text-base font-bold text-slate-700">Past Interviews ({past.length})</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {past.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    {item.application?.candidate?.full_name} ({item.application?.job?.title})
                  </div>
                  <div className="text-slate-400">
                    {new Date(item.starts_at).toLocaleString()}
                  </div>
                </div>

                <Link
                  href={`/recruiter/applications/${item.application_id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  View Notes &amp; Status &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
