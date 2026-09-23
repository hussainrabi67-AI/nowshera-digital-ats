import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function DashboardRedirectPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (profile.role === "recruiter") {
    redirect("/recruiter/dashboard");
  }

  redirect("/candidate/dashboard");
}
