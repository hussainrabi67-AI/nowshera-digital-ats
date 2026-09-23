import React from "react";
import { ApplicationStageHistory } from "@/lib/types";
import { StageBadge } from "@/components/stage-badge";
import { ArrowRight, Clock, User } from "lucide-react";

interface StageHistoryTimelineProps {
  history: ApplicationStageHistory[];
}

export function StageHistoryTimeline({ history }: StageHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-4 text-center">
        No stage history recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
        {history.map((record) => {
          const dateStr = new Date(record.created_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={record.id} className="relative group">
              {/* Bullet dot */}
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow" />

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm transition hover:border-slate-300">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {record.from_stage ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <StageBadge stage={record.from_stage} />
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Initial</span>
                  )}
                  <StageBadge stage={record.to_stage} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{record.changer?.full_name || record.changer?.email || "System"}</span>
                    {record.changer?.role && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 uppercase font-medium">
                        {record.changer.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
