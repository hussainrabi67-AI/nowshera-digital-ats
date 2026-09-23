"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";

interface AdminChartsProps {
  funnel: { stage: string; count: number }[];
}

const COLORS = [
  "#2563EB", // Applied: Blue
  "#0EA5E9", // Shortlisted: Sky
  "#6366F1", // Interview: Indigo
  "#F59E0B", // Offer: Amber
  "#10B981", // Hired: Emerald
];

export function AdminCharts({ funnel }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hiring Funnel Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Hiring Pipeline Funnel</h3>
          <p className="text-xs text-slate-500">
            Candidate progression across active recruitment stages
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnel}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="stage"
                tick={{ fill: "#64748B", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {funnel.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Distribution Metric Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Funnel Conversion Breakdown</h3>
          <p className="text-xs text-slate-500">
            Stage-by-stage candidate volume
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {funnel.map((item, idx) => (
            <div
              key={item.stage}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-xs font-semibold text-slate-600">{item.stage}</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
