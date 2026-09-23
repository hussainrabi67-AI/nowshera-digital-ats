import React from "react";
import { ApplicationStage } from "@/lib/types";
import {
  FileText,
  UserCheck,
  Calendar,
  Gift,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface StageBadgeProps {
  stage: ApplicationStage;
  className?: string;
}

const STAGE_CONFIG: Record<
  ApplicationStage,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  applied: {
    label: "Applied",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: FileText,
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: UserCheck,
  },
  interview: {
    label: "Interview",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: Calendar,
  },
  offer: {
    label: "Offer",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Gift,
  },
  hired: {
    label: "Hired",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: Clock,
  },
};

export function StageBadge({ stage, className = "" }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage] || {
    label: stage,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: FileText,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
