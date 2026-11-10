import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, CheckCircle, Mail, Activity, Plus, FileText, Download, LogOut, X, Menu, Upload } from "lucide-react";
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
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [accreditedFilter, setAccreditedFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>(initialSection);
  const [sendingTicket, setSendingTicket] = useState<string | null>(null);
  const [accreditingTicket, setAccreditingTicket] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleCreateGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const full_name = String(formData.get("full_name") || "").trim();
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    if (!full_name) return;
    setCreating(true);
    try {
      await guestApi.create({ full_name, email: email || undefined, phone: phone || undefined });
      setNotice("Guest created successfully");
      setCreateModalOpen(false);
      await loadGuests();
    } catch (err: any) {
      setNotice(err.response?.data?.error || "Failed to create guest");
    } finally {
      setCreating(false);
    }
  };

  const handleEditGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    const full_name = String(formData.get("full_name") || "").trim();
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    setCreating(true);
    try {
      await guestApi.update(editing.id, {
        full_name,
        email,
        phone,
      });
      setNotice("Guest updated successfully");
      setEditing(null);
      await loadGuests();
    } catch (err: any) {
      setNotice(err.response?.data?.error || "Failed to update guest");
    } finally {
      setCreating(false);
    }
  };

  const handleSendTicket = async (guestId: string, ticketId: string) => {
    setSendingTicket(ticketId);
    try {
      await ticketApi.send(guestId, ticketId);
      setNotice("Ticket email sent");
      loadGuests();
    } catch (err: any) {
      setNotice(err.response?.data?.error || "Failed to send ticket");
    } finally {
      setSendingTicket(null);
    }
  };

  const handleAccredit = async (ticketId: string) => {
    setAccreditingTicket(ticketId);
    try {
      await guestApi.confirm(ticketId);
      setNotice("Guest accredited");
      await loadGuests();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setNotice("This guest has already been accredited");
      } else {
        setNotice(err.response?.data?.error || "Accreditation failed");
      }
    } finally {
      setAccreditingTicket(null);
    }
  };

  const guestList = guests || [];
  const paginationResolved = pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guestList.filter((g) => {
      if (accreditedFilter === "true" && !isAccredited(g)) return false;
      if (accreditedFilter === "false" && isAccredited(g)) return false;
      if (!q) return true;
      return [
        g.full_name,
        g.email ?? "",
        g.phone ?? "",
        g.ticket_id,
      ].join(" ").toLowerCase().includes(q);
    });
  }, [guestList, search, accreditedFilter]);

  const totalPages = Math.max(1, Math.ceil(visible.length / paginationResolved.limit));
  const pageGuests = visible.slice(
    (paginationResolved.page - 1) * paginationResolved.limit,
    paginationResolved.page * paginationResolved.limit
  );

  const stats = useMemo(() => ({
    total: paginationResolved.total,
    accredited: guestList.filter(isAccredited).length,
    pending: guestList.filter((g) => !isAccredited(g)).length,
    ticketsSent: guestList.reduce((sum, g) => sum + (g.ticket_sent_count || 0), 0),
  }), [guestList, paginationResolved.total]);

  const handleExport = () => {
    setNotice("Export functionality available via server endpoint");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#141414] transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d97706] text-sm font-bold text-[#0a0a0a]">WB</div>
            <span className="font-serif text-lg font-bold tracking-tight">Workers Ball</span>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Admin navigation">
          <Link to="/dashboard" onClick={() => { setSection("overview"); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${section === "overview" ? "bg-[#d97706]/15 text-[#fbbf24]" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
            <Users className="h-5 w-5" /> Overview
          </Link>
          <Link to="/admin/guests" onClick={() => { setSection("attendees"); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${section === "attendees" ? "bg-[#d97706]/15 text-[#fbbf24]" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
            <FileText className="h-5 w-5" /> Guests
          </Link>
          <Link to="/admin/reports" onClick={() => { setSection("reports"); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${section === "reports" ? "bg-[#d97706]/15 text-[#fbbf24]" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
            <Activity className="h-5 w-5" /> Reports
          </Link>
          <Link to="/admin/import-export" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white">
            <Upload className="h-5 w-5" /> Import / Export
          </Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="mb-3 truncate px-3 text-xs text-gray-500">{admin.email}</p>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#111111]/95 px-4 backdrop-blur md:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-white/10 p-2 text-white hover:bg-white/5" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">{sectionTitle(section).title}</span>
        </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
                  {guestList.length > 0 ? Math.round((stats.accredited / guestList.length) * 100) : 0}%
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
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
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
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center justify-center gap-2 gold-gradient px-4 py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Guest
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[850px] text-left border-collapse">
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
                              isAccredited(guest)
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20"
                            }`}
                          >
                            {isAccredited(guest) ? (
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
                              onClick={() => handleSendTicket(guest.id, guest.ticket_id)}
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
                              onClick={() => setEditing(guest)}
                              className="p-2 text-gray-400 hover:text-[#d97706] transition-colors"
                              title="Edit Guest"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAccredit(guest.ticket_id)}
                              disabled={isAccredited(guest) || accreditingTicket === guest.ticket_id}
                              className={`inline-flex min-w-[108px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                isAccredited(guest)
                                  ? "cursor-not-allowed bg-green-500/10 text-green-400"
                                  : "bg-[#d97706] text-[#0a0a0a] hover:bg-[#b45309] disabled:cursor-wait disabled:opacity-60"
                              }`}
                              aria-label={isAccredited(guest) ? `${guest.full_name} is already accredited` : `Accredit ${guest.full_name}`}
                            >
                              {isAccredited(guest) ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Accredited
                                </>
                              ) : accreditingTicket === guest.ticket_id ? (
                                "Accrediting..."
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Accredit
                                </>
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
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
            <div className="my-auto w-full max-w-md rounded-xl border border-white/20 bg-[#1a1a1a] p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#d97706]">Add Guest</h3>
                <button type="button" onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close add guest form">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateGuest} className="space-y-4">
                <div>
                  <label htmlFor="create-guest-name" className="mb-1.5 block text-sm font-medium text-gray-300">Full name *</label>
                  <input id="create-guest-name" name="full_name" autoFocus required className="w-full rounded-lg border border-white/20 bg-[#0a0a0a] px-4 py-3 text-white focus:border-[#d97706] focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="create-guest-email" className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
                  <input id="create-guest-email" name="email" type="email" className="w-full rounded-lg border border-white/20 bg-[#0a0a0a] px-4 py-3 text-white focus:border-[#d97706] focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="create-guest-phone" className="mb-1.5 block text-sm font-medium text-gray-300">Phone</label>
                  <input id="create-guest-phone" name="phone" type="tel" className="w-full rounded-lg border border-white/20 bg-[#0a0a0a] px-4 py-3 text-white focus:border-[#d97706] focus:outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={creating} className="flex-1 rounded-lg bg-[#d97706] py-3 font-semibold text-[#0a0a0a] hover:bg-[#b45309] disabled:opacity-50">
                    {creating ? "Adding..." : "Add Guest"}
                  </button>
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 rounded-lg border border-white/20 bg-[#0a0a0a] py-3 font-semibold text-white hover:bg-[#2a2a2a]">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[#1a1a1a] border border-white/20 rounded-xl p-6 shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#d97706]">Edit Guest</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditGuest} className="space-y-4">
                <div>
                  <label htmlFor="edit-guest-name" className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                  <input
                    id="edit-guest-name"
                    type="text"
                    name="full_name"
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/20 focus:border-[#d97706] focus:outline-none text-white"
                    defaultValue={editing?.full_name}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-guest-email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    id="edit-guest-email"
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/20 focus:border-[#d97706] focus:outline-none text-white"
                    defaultValue={editing?.email || ""}
                  />
                </div>
                <div>
                  <label htmlFor="edit-guest-phone" className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                  <input
                    id="edit-guest-phone"
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/20 focus:border-[#d97706] focus:outline-none text-white"
                    defaultValue={editing?.phone || ""}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-[#d97706] text-[#0a0a0a] py-3 rounded-lg font-semibold hover:bg-[#b45309] transition-colors"
                  >
                    {creating ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 bg-[#0a0a0a] border border-white/20 text-white py-3 rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

const isAccredited = (guest: Guest): boolean =>
  guest.accredited === 1 || Boolean(guest.accredited_at);

const sectionTitle = (section: string) => {
  const titles: Record<string, { title: string; hint: string }> = {
    overview: { title: "Overview", hint: "Event at a glance - 22nd Nov. 2026, Harvesters Globe Ologolo" },
    attendees: { title: "Guest Management", hint: "Search, review and manage registered guests" },
    reports: { title: "Reports", hint: "Accreditation statistics and PDF export" },
    settings: { title: "Settings", hint: "Event details and account controls" },
  };
  return titles[section] || titles.overview;
};
