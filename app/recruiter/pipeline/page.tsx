import { redirect } from "next/navigation";
import { requireRecruiter } from "@/lib/auth/server";
import { getRecruiterJobs } from "@/lib/services/jobs";
import { getAllApplicationsAdmin } from "@/lib/services/applications";
import { KanbanPipeline } from "@/components/kanban-pipeline";

export const dynamic = "force-dynamic";

export default async function RecruiterPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>;
}) {
  let authResult;
  try {
    authResult = await requireRecruiter();
  } catch {
    redirect("/login");
  }

  const { profile } = authResult;
  const params = await searchParams;

  const jobs = await getRecruiterJobs(profile.id);
  const applications = await getAllApplicationsAdmin(); // Scoped by RLS to assigned jobs

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recruitment Kanban Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage candidates across hiring stages. All movements adhere strictly to the recruitment state machine.
          </p>
        </div>
      </div>

      <KanbanPipeline
        jobs={jobs}
        initialApplications={applications}
        selectedJobId={params.job_id}
      />
    </div>
  );
}
