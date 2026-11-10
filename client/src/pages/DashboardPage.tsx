import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Users, CheckCircle, Clock, Mail, Activity, Plus, FileText, Download, Scan, LogOut } from "lucide-react";
import { guestApi, ticketApi, type Guest } from "@/services/api.js";

type Section = "overview" | "attendees" | "reports" | "settings";

interface DashboardPageProps {
  admin: { email: string; role: string };
  onLogout: () => void;
  initialSection?: Section;
}

export default function DashboardPage({
  admin,
  onLogout,
  initialSection = "overview",
}: DashboardPageProps): JSX.Element {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [accreditedFilter, setAccreditedFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>(initialSection);
  const [sendingBatch, setSendingBatch] = useState(false);
  const [sendingRsvp, setSendingRsvp] = useState<string | null>(null);
  const [sendingTicket, setSendingTicket] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const res = await guestApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search,
        accredited: accreditedFilter || undefined,
      });
      setGuests(res.data.guests);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setNotice(err.response?.data?.error || "Failed to load guests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const first_name = formData.get("first_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    if (!first_name) return;
    setCreating(true);
    try {
      await guestApi.create({ full_name: first_name, email: email || undefined, phone: phone || undefined });
      setNotice("Guest created successfully");
      loadGuests();
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      setNotice(err.response?.data?.error || "Failed to create guest");
    } finally {
      setCreating(false);
    }
  };

  const handleSendTicket = async (ticketId: string) => {
    setSendingTicket(ticketId);
    try {
      await ticketApi.send(ticketId);
      setNotice("Ticket email sent");
      loadGuests();
    } catch (err: any) {
      setNotice(err.response?.data?.error || "Failed to send ticket");
    } finally {
      setSendingTicket(null);
    }
  };

  const handleAccredit = async (guestId: string) => {
    try {
      await guestApi.confirm(guestId);
      setNotice("Guest accredited");
      loadGuests();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setNotice("This guest has already been accredited");
      } else {
        setNotice(err.response?.data?.error || "Accreditation failed");
      }
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (accreditedFilter === "true" && !g.accredited_at) return false;
      if (accreditedFilter === "false" && g.accredited_at) return false;
      if (!q) return true;
      return [
        g.full_name,
        g.email ?? "",
        g.phone ?? "",
        g.ticket_id,
      ].join(" ").toLowerCase().includes(q);
    });
  }, [guests, search, accreditedFilter]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pagination.limit));
  const pageGuests = visible.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  const stats = useMemo(() => ({
    total: guests.length,
    accredited: guests.filter((g) => g.accredited_at).length,
    pending: guests.filter((g) => !g.accredited_at).length,
    ticketsSent: guests.reduce((sum, g) => sum + (g.ticket_sent_count || 0), 0),
  }), [guests]);

  const handleExport = () => {
    setNotice("Export functionality available via server endpoint");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top nav */}
      <nav className="border-b border-white/10 bg-[#1a1a1a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d97706] flex items-center justify-center text-[#0a0a0a] font-bold text-sm">
                WB
              </div>
              <span className="font-serif font-bold text-xl text-white tracking-tight">
                Workers Ball 2026
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/dashboard"
                onClick={() => setSection("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors ${section === "overview" ? "text-white bg-white/5" : ""}`}
              >
                <Users className="w-4 h-4" /> Overview
              </Link>
              <Link
                to="/admin/guests"
                onClick={() => setSection("attendees")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors ${section === "attendees" ? "text-white bg-white/5" : ""}`}
              >
                <FileText className="w-4 h-4" /> Guests
              </Link>
              <Link
                to="/admin/accredit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Scan className="w-4 h-4" /> Accredit
              </Link>
              <Link
                to="/admin/reports"
                onClick={() => setSection("reports")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors ${section === "reports" ? "text-white bg-white/5" : ""}`}
              >
                <Activity className="w-4 h-4" /> Reports
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#d97706]">{sectionTitle(section).title}</h1>
            <p className="text-gray-400 text-sm">{sectionTitle(section).hint}</p>
          </div>
        </div>

        {notice && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm flex items-center gap-3">
            <span>ℹ</span>
            <span>{notice}</span>
          </div>
        )}

        {section === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Total Registered</p>
                <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Accredited</p>
                <h3 className="text-2xl font-bold text-green-400">{stats.accredited}</h3>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-[#d97706]">{stats.pending}</h3>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Tickets Sent</p>
                <h3 className="text-2xl font-bold text-blue-400">{stats.ticketsSent}</h3>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Accreditation Rate</p>
                <h3 className="text-2xl font-bold text-purple-400">
                  {guests.length > 0 ? Math.round((stats.accredited / guests.length) * 100) : 0}%
                </h3>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setSection("attendees")}
                  className="flex items-center gap-2 px-4 py-3 bg-[#d97706] text-[#0a0a0a] rounded-lg font-semibold hover:opacity-90 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Manage Guests
                </button>
                <button
                  onClick={() => navigate("/admin/accredit")}
                  className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-white/20 text-white rounded-lg font-semibold hover:bg-[#1a1a1a] transition-colors"
                >
                  <Scan className="w-4 h-4" /> Accredit Guests
                </button>
                <button
                  onClick={() => setSection("reports")}
                  className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-white/20 text-white rounded-lg font-semibold hover:bg-[#1a1a1a] transition-colors"
                >
                  <Activity className="w-4 h-4" /> View Reports
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-white/20 text-white rounded-lg font-semibold hover:bg-[#1a1a1a] transition-colors"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
          </>
        )}

        {section === "attendees" && (
          <>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ticket ID..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 focus:border-[#d97706] focus:outline-none text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  value={accreditedFilter}
                  onChange={(e) => setAccreditedFilter(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-[#d97706] focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Accredited</option>
                  <option value="false">Not Accredited</option>
                </select>
                <button
                  onClick={handleCreateGuest}
                  className="flex items-center gap-2 gold-gradient px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Guest
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                    <th className="pb-4 pl-4">Guest</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Ticket ID</th>
                    <th className="pb-4">Phone</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Tickets Sent</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-4 border-[#d97706] border-t-transparent rounded-full animate-spin" />
                          <span className="text-gray-400 text-sm">Loading guests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : visible.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No guests found.
                      </td>
                    </tr>
                  ) : (
                    pageGuests.map((guest) => (
                      <tr key={guest.id} className="border-b border-white/5 hover:bg-[#1a1a1a]/30 transition-colors">
                        <td className="py-4 pl-4">
                          <div className="font-medium">{guest.full_name}</div>
                          <div className="text-xs text-gray-500">{guest.ticket_id}</div>
                        </td>
                        <td className="py-4 pl-4 text-sm">{guest.email || "-"}</td>
                        <td className="py-4 pl-4 text-sm font-mono">{guest.ticket_id}</td>
                        <td className="py-4 pl-4 text-sm">{guest.phone || "-"}</td>
                        <td className="py-4 pl-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              guest.accredited_at === 1
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20"
                            }`}
                          >
                            {guest.accredited_at === 1 ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Accredited
                              </>
                            ) : (
                              "Pending"
                            )}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-sm">{guest.ticket_sent_count || 0}</td>
                        <td className="py-4 pl-4 text-right">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSendTicket(guest.ticket_id)}
                              disabled={sendingTicket === guest.ticket_id}
                              className="p-2 text-gray-400 hover:text-[#d97706] transition-colors"
                              title="Send Ticket Email"
                            >
                              {sendingTicket === guest.ticket_id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleAccredit(guest.id)}
                              className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                              title={guest.accredited_at === 1 ? "Already accredited" : "Accredit Guest"}
                            >
                              {guest.accredited_at === 1 ? (
                                <span className="text-green-400">✓</span>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 mt-4">
                <p className="text-sm text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} guests
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={pagination.page === totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {section === "reports" && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Accreditation Report</h3>
            <p className="text-gray-400 text-sm mb-6">Generate a PDF report with accreditation statistics and surge hours.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Total Registered</p>
                <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Accredited</p>
                <h3 className="text-2xl font-bold text-green-400">{stats.accredited}</h3>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-[#d97706]">{stats.pending}</h3>
              </div>
            </div>
            <button
              onClick={() => {
                fetch("/api/guests/report/pdf", {
                  headers: { Authorization: `Bearer ${localStorage.getItem("workersball.token")}` },
                })
                  .then((res) => {
                    if (res.ok) return res.blob();
                    throw new Error("Failed to generate report");
                  })
                  .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `workers-ball-accreditation-report.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  })
                  .catch((err) => setNotice(err.message || "Failed to generate PDF report"));
              }}
              className="w-full bg-[#d97706] text-[#0a0a0a] py-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
            >
              Download PDF Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const sectionTitle = (section: string) => {
  const titles: Record<string, { title: string; hint: string }> = {
    overview: { title: "Overview", hint: "Event at a glance - 22nd Nov. 2026, Harvesters Globe Ologolo" },
    attendees: { title: "Guest Management", hint: "Search, review and manage registered guests" },
    reports: { title: "Reports", hint: "Accreditation statistics and PDF export" },
    settings: { title: "Settings", hint: "Event details and account controls" },
  };
  return titles[section] || titles.overview;
};
