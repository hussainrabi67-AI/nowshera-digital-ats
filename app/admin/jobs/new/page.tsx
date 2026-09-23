import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import { CreateJobForm } from "@/components/create-job-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNewJobPage() {
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
    .order("full_name", { ascending: true });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Management
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create New Position
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Post an open position or prepare a draft. Assign recruiters who will manage the application pipeline.
        </p>
      </div>

      <CreateJobForm recruiters={(recruiters || []) as Profile[]} />
    </div>
  );
}
