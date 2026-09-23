import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { getAllEmailEventsAdmin, formatEmailContent } from "@/lib/services/email";
import { Mail, CheckCircle, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  let authResult;
  try {
    authResult = await requireAdmin();
  } catch {
    redirect("/login");
  }

  const events = await getAllEmailEventsAdmin();

  const sentCount = events.filter((e) => e.sent_at !== null).length;
  const pendingCount = events.filter((e) => e.sent_at === null).length;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Email Automation &amp; Outbox
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Guaranteed idempotent event log for n8n workflow triggers and candidate notifications.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Logged Events</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{events.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Delivered / Sent</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{sentCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Queued for n8n</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{pendingCount}</div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Email Outbox Log</h2>
          <span className="text-xs text-slate-400">
            Protected endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">/api/n8n/email-events</code>
          </span>
        </div>

        {events.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No email events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3">Sent At</th>
                  <th className="py-3 px-3">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((e) => {
                  const isSent = e.sent_at !== null;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 uppercase text-[11px]">
                          {e.event_type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {e.recipient_email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Sent
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-500" /> Queued
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {e.sent_at ? new Date(e.sent_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {e.application_id.slice(0, 8)}:{e.event_type}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
