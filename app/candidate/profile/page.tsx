import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { User, Mail, Shield, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  let authResult;
  try {
    authResult = await requireAuth();
  } catch {
    redirect("/login");
  }

  const { profile } = authResult;

  const joinedDate = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Candidate Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your account details and applicant credentials.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
            {profile.full_name ? profile.full_name[0].toUpperCase() : "C"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {profile.full_name || "Applicant"}
            </h2>
            <p className="text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Mail className="w-4 h-4 text-slate-400" />
              Email Address
            </div>
            <div className="mt-1 font-semibold text-slate-800">{profile.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-slate-400" />
              Account Role
            </div>
            <div className="mt-1 font-semibold text-blue-600 uppercase text-xs">
              {profile.role}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-slate-400" />
              Member Since
            </div>
            <div className="mt-1 font-semibold text-slate-800">{joinedDate}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <User className="w-4 h-4 text-slate-400" />
              Account Status
            </div>
            <div className="mt-1 font-semibold text-emerald-600 text-xs uppercase">
              Verified Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
