import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import { AdminRecruiterManager } from "@/components/admin-recruiter-manager";

export const dynamic = "force-dynamic";

export default async function AdminRecruitersPage() {
  let authResult;
  try {
    authResult = await requireAdmin();
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: recruiters } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "recruiter")
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Recruiter Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Provision recruiter accounts and view personnel authorized to manage recruitment pipelines.
        </p>
      </div>

      <AdminRecruiterManager initialRecruiters={(recruiters || []) as Profile[]} />
    </div>
  );
}
