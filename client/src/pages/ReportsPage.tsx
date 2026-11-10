import { useEffect, useState } from "react";
import axios from "axios";
import { Activity, Clock, FileText, Loader2, Users } from "lucide-react";
import AdminPageLayout from "@/components/AdminPageLayout.js";
import { reportsApi, type ReportStats } from "@/services/api.js";

interface ReportsPageProps {
  admin: { email: string; role: string };
  onLogout: () => void;
}

export default function ReportsPage({ admin, onLogout }: ReportsPageProps): JSX.Element {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    reportsApi.accreditation()
      .then(({ data }) => {
        if (active) setStats(data);
      })
      .catch((err: unknown) => {
        if (active) setError(getRequestError(err, "Could not load report statistics."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const downloadPDF = async (): Promise<void> => {
    setPdfLoading(true);
    setError("");
    try {
      const { data } = await reportsApi.pdf();
      if (!(data instanceof Blob) || data.size === 0) throw new Error("The server returned an empty PDF.");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(stats?.event || "workers-ball").replace(/[^a-z0-9-]+/gi, "-")}-Accreditation-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(getRequestError(err, "Failed to generate PDF report."));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AdminPageLayout admin={admin} onLogout={onLogout} activePage="reports">
      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#d97706]" /> Loading report...
        </div>
      ) : error && !stats ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300" role="alert">{error}</div>
      ) : stats ? (
        <div className="space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#d97706]">Accreditation Report</h1>
              <p className="mt-1 text-sm text-gray-400">{stats.event} · {stats.eventDate}</p>
            </div>
            <button type="button" onClick={() => void downloadPDF()} disabled={pdfLoading} className="flex items-center justify-center gap-2 rounded-lg bg-[#d97706] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f0a52e] disabled:cursor-not-allowed disabled:opacity-60">
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {pdfLoading ? "Generating PDF..." : "Download PDF report"}
            </button>
          </header>

          {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Total Registered", value: stats.total, icon: Users, color: "text-blue-400" },
              { title: "Accredited", value: stats.accredited, icon: Clock, color: "text-green-400" },
              { title: "Pending", value: stats.pending, icon: Clock, color: "text-[#d97706]" },
              { title: "Accreditation Rate", value: `${stats.percentage}%`, icon: Activity, color: "text-purple-400" },
            ].map(({ title, value, icon: Icon, color }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
                <p className="text-sm uppercase tracking-wide text-gray-400">{title}</p>
                <div className={`mt-2 flex items-center gap-3 text-2xl font-bold ${color}`}><Icon className="h-5 w-5" />{value}</div>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5 text-[#d97706]" /> Surge hours</h2>
            {stats.surgeHours.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left">
                  <thead><tr className="border-b border-white/10 text-xs uppercase text-gray-400"><th className="pb-3">Rank</th><th className="pb-3">Hour</th><th className="pb-3 text-right">Accreditations</th></tr></thead>
                  <tbody>{stats.surgeHours.map((hour, index) => (
                    <tr key={`${hour.hour}-${index}`} className="border-b border-white/5">
                      <td className="py-3 font-mono text-gray-400">#{index + 1}</td>
                      <td className="py-3 font-mono">{String(hour.hour).padStart(2, "0")}:00</td>
                      <td className="py-3 text-right font-mono text-[#f0a52e]">{hour.count}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400">No accreditations recorded yet.</p>}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent accreditations</h2>
            {stats.recent.length ? (
              <div className="divide-y divide-white/5">
                {stats.recent.map((guest) => (
                  <div key={guest.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{guest.full_name}</p>
                      <p className="text-xs text-gray-500">{guest.ticket_id}</p>
                    </div>
                    <p className="shrink-0 text-sm text-green-400">{guest.accredited_at ? new Date(guest.accredited_at).toLocaleString() : ""}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No recent accreditations.</p>}
          </section>
        </div>
      ) : null}
    </AdminPageLayout>
  );
}

const getRequestError = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message || err.response?.data?.error;
    if (typeof message === "string") return message;
  }
  return err instanceof Error ? err.message : fallback;
};
