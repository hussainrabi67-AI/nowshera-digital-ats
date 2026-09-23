"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  Briefcase,
  LayoutDashboard,
  Calendar,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Mail,
  Shield,
  Layers,
  Users,
} from "lucide-react";

interface NavbarProps {
  initialProfile: Profile | null;
}

export function Navbar({ initialProfile }: NavbarProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  React.useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    router.refresh();
  });

  return () => subscription.unsubscribe();
}, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
    router.refresh();
  }

  const role = profile?.role;

  const candidateLinks = [
    { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
    { href: "/candidate/dashboard", label: "My Applications", icon: LayoutDashboard },
  ];

  const recruiterLinks = [
    { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recruiter/jobs", label: "Assigned Jobs", icon: Briefcase },
    { href: "/recruiter/pipeline", label: "Kanban Pipeline", icon: Layers },
    { href: "/recruiter/interviews", label: "Interviews", icon: Calendar },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Analytics", icon: LayoutDashboard },
    { href: "/admin/jobs", label: "Manage Jobs", icon: Briefcase },
    { href: "/admin/jobs/new", label: "Post Job", icon: PlusCircle },
    { href: "/admin/applications", label: "Applications", icon: Layers },
    { href: "/admin/recruiters", label: "Recruiters", icon: Users },
    { href: "/admin/emails", label: "Email Outbox", icon: Mail },
  ];

  const activeLinks =
    role === "admin"
      ? adminLinks
      : role === "recruiter"
      ? recruiterLinks
      : role === "candidate"
      ? candidateLinks
      : [{ href: "/jobs", label: "Browse Jobs", icon: Briefcase }];

  return (
    <nav className="sticky top-0 z-50 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-inner">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight text-white font-semibold text-base">Nowshera Digital</span>
                <span className="text-[10px] text-sky-400 font-medium tracking-wider uppercase">ATS Platform</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {activeLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <div className="flex items-center gap-3">
                {/* Role Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 border border-slate-700">
                  <Shield className="w-3 h-3 text-sky-400" />
                  <span
                    className={
                      role === "admin"
                        ? "text-purple-400"
                        : role === "recruiter"
                        ? "text-emerald-400"
                        : "text-sky-400"
                    }
                  >
                    {profile.role}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-slate-100">{profile.full_name || profile.email}</div>
                  <div className="text-xs text-slate-400">{profile.email}</div>
                </div>

                <button
  onClick={handleSignOut}
  title="Sign Out"
  aria-label="Sign Out"
  className="px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
>
  Sign Out
</button>
                
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-5 space-y-2">
          {profile && (
            <div className="p-3 mb-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{profile.full_name || profile.email}</div>
                <div className="text-xs text-slate-400">{profile.email}</div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/30 text-sky-300 uppercase">
                {profile.role}
              </span>
            </div>
          )}

          {activeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800">
            {profile ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-slate-800 rounded-lg text-base font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg border border-slate-700 text-slate-200 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-blue-600 text-white font-medium shadow"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
