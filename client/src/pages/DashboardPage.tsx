import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, CheckCircle, Mail, Activity, Plus, FileText, Download, LogOut, X } from "lucide-react";
import { guestApi, ticketApi, importExportApi, reportsApi, type Guest } from "@/services/api.js";

type Section = "overview" | "attendees" | "reports";

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
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, accreditedFilter]);

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

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!full_name) return;
    setSaving(true);
    try {
      await guestApi.create({ full_name, email: email || undefined, phone: phone || undefined });
      flash("Guest created successfully");
      setAdding(false);
      await loadGuests();
    } catch (err: any) {
      flash(err.response?.data?.error || "Failed to create guest");
    } finally {
      setSaving(false);
    }
  };

  const handleEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    setSaving(true);
    try {
      await guestApi.update(editing.id, {
        full_name: full_name || undefined,
        email: email || undefined,
        phone: phone || undefined,
      });
      flash("Guest updated successfully");
      setEditing(null);
      await loadGuests();
    } catch (err: any) {
      flash(err.response?.data?.error || "Failed to update guest");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTicket = async (guest: Guest) => {
    setSendingTicket(guest.id);
    try {
      await ticketApi.send(guest.id, guest.ticket_id);
      flash("Ticket email sent");
      await loadGuests();
    } catch (err: any) {
      flash(err.response?.data?.error || "Failed to send ticket");
    } finally {
      setSendingTicket(null);
    }
  };

  const handleAccredit = async (guest: Guest) => {
    try {
      await guestApi.confirm(guest.ticket_id);
      flash("Guest accredited");
      await loadGuests();
    } catch (err: any) {
      if (err.response?.status === 409) {
        flash("This guest has already been accredited");
      } else {
        flash(err.response?.data?.error || "Accreditation failed");
      }
    }
  };

  const handleExport = async () => {
    try {
      const res = await importExportApi.export("xlsx", accreditedFilter || undefined);
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sixth-season-guests.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      flash("Export failed");
    }
  };

  const handlePdf = async () => {
    try {
      const res = await reportsApi.pdf();
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sixth-season-accreditation-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      flash("Failed to generate PDF report");
    }
  };

  const guestList = guests || [];
  const safePagination = pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guestList.filter((g) => {
      if (accreditedFilter === "true" && !g.accredited_at) return false;
      if (accreditedFilter === "false" && g.accredited_at) return false;
      if (!q) return true;
      return [g.full_name, g.email ?? "", g.phone ?? "", g.ticket_id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [guestList, search, accreditedFilter]);

  const stats = useMemo(
    () => ({
      total: guestList.length,
      accredited: guestList.filter((g) => g.accredited_at).length,
      pending: guestList.filter((g) => !g.accredited_at).length,
      ticketsSent: guestList.reduce((sum, g) => sum + (g.ticket_sent_count || 0), 0),
    }),
    [guestList]
  );

  const titles: Record<Section, { title: string; hint: string }> = {
    overview: { title: "Overview", hint: "Sixth Season Pop-Up Experience — Sunday, 22nd November 2026, BYD, Victoria Island, Lagos" },
    attendees: { title: "Guest Management", hint: "Search, review and manage registered guests" },
    reports: { title: "Reports", hint: "Accreditation statistics and PDF export" },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white font-bold text-sm">S6</div>
              <span className="font-serif font-bold text-xl text-white tracking-wide">SIXTH SEASON</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/dashboard"
                onClick={() => setSection("overview")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${section === "overview" ? "text-white border-b-2 border-white" : "text-zinc-400 hover:text-white"}`}
              >
                <Users className="w-4 h-4" /> Overview
              </Link>
              <Link
                to="/admin/guests"
                onClick={() => setSection("attendees")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${section === "attendees" ? "text-white border-b-2 border-white" : "text-zinc-400 hover:text-white"}`}
              >
                <FileText className="w-4 h-4" /> Guests
              </Link>
              <Link
                to="/admin/reports"
                onClick={() => setSection("reports")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${section === "reports" ? "text-white border-b-2 border-white" : "text-zinc-400 hover:text-white"}`}
              >
                <Activity className="w-4 h-4" /> Reports
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-zinc-500">{admin.email}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-white">{titles[section].title}</h1>
          <p className="text-zinc-500 text-sm">{titles[section].hint}</p>
        </div>

        {notice && (
          <div className="mb-6 p-4 bg-white/5 border border-white/15 text-zinc-200 text-sm">{notice}</div>
        )}

        {section === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-950 border border-white/10 p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Total Registered</p>
                <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
              </div>
              <div className="bg-zinc-950 border border-white/10 p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Accredited</p>
                <h3 className="text-3xl font-bold text-white">{stats.accredited}</h3>
              </div>
              <div className="bg-zinc-950 border border-white/10 p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Pending</p>
                <h3 className="text-3xl font-bold text-zinc-400">{stats.pending}</h3>
              </div>
              <div className="bg-zinc-950 border border-white/10 p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Tickets Sent</p>
                <h3 className="text-3xl font-bold text-zinc-400">{stats.ticketsSent}</h3>
              </div>
            </div>

            <div className="bg-zinc-950 border border-white/10 p-6">
              <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button onClick={() => setSection("attendees")} className="flex items-center gap-2 px-4 py-3 bg-white text-black font-semibold text-sm uppercase tracking-wide hover:bg-zinc-200 transition-colors">
                  <FileText className="w-4 h-4" /> Manage Guests
                </button>
                <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-3 bg-black border border-white/20 text-white font-semibold text-sm uppercase tracking-wide hover:bg-zinc-900 transition-colors">
                  <Plus className="w-4 h-4" /> Add Guest
                </button>
                <button onClick={() => setSection("reports")} className="flex items-center gap-2 px-4 py-3 bg-black border border-white/20 text-white font-semibold text-sm uppercase tracking-wide hover:bg-zinc-900 transition-colors">
                  <Activity className="w-4 h-4" /> Reports
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-3 bg-black border border-white/20 text-white font-semibold text-sm uppercase tracking-wide hover:bg-zinc-900 transition-colors">
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>
          </>
        )}

        {section === "attendees" && (
          <>
            <div className="bg-zinc-950 border border-white/10 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ticket ID..."
                    className="w-full pl-10 pr-4 py-3 bg-black border border-white/15 focus:border-white focus:outline-none text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadGuests()}
                  />
                </div>
                <select
                  value={accreditedFilter}
                  onChange={(e) => { setAccreditedFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  className="px-4 py-3 bg-black border border-white/15 text-white focus:border-white focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Accredited</option>
                  <option value="false">Not Accredited</option>
                </select>
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center justify-center gap-2 bg-white text-black px-5 py-3 font-semibold text-sm uppercase tracking-wide hover:bg-zinc-200 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Guest
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 border border-white/10 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 text-xs uppercase tracking-widest">
                    <th className="py-4 pl-4 pr-4">Guest</th>
                    <th className="py-4 pr-4">Email</th>
                    <th className="py-4 pr-4">Ticket ID</th>
                    <th className="py-4 pr-4">Phone</th>
                    <th className="py-4 pr-4">Status</th>
                    <th className="py-4 pr-4">Sent</th>
                    <th className="py-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-10 text-center text-zinc-500 text-sm">Loading guests...</td></tr>
                  ) : visible.length === 0 ? (
                    <tr><td colSpan={7} className="p-10 text-center text-zinc-500 text-sm">No guests found.</td></tr>
                  ) : (
                    visible.map((guest) => (
                      <tr key={guest.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 pl-4 pr-4 font-medium">{guest.full_name}</td>
                        <td className="py-4 pr-4 text-sm text-zinc-400">{guest.email || "—"}</td>
                        <td className="py-4 pr-4 text-sm font-mono text-zinc-300">{guest.ticket_id}</td>
                        <td className="py-4 pr-4 text-sm text-zinc-400">{guest.phone || "—"}</td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${guest.accredited_at ? "border-white/40 text-white bg-white/10" : "border-white/15 text-zinc-400"}`}>
                            {guest.accredited_at ? (<><CheckCircle className="w-3 h-3" /> Accredited</>) : "Pending"}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-sm text-zinc-400">{guest.ticket_sent_count || 0}</td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSendTicket(guest)}
                              disabled={sendingTicket === guest.id}
                              className="p-2 border border-white/15 text-zinc-300 hover:border-white hover:text-white transition-colors"
                              title="Send Ticket Email"
                            >
                              {sendingTicket === guest.id ? "…" : <Mail className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditing(guest)}
                              className="p-2 border border-white/15 text-zinc-300 hover:border-white hover:text-white transition-colors"
                              title="Edit Guest"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAccredit(guest)}
                              disabled={!!guest.accredited_at}
                              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${guest.accredited_at ? "bg-white/5 text-zinc-600 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200"}`}
                              title={guest.accredited_at ? "Already accredited" : "Accredit Guest"}
                            >
                              {guest.accredited_at ? "Done" : "Accredit"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {safePagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-zinc-500">
                  Showing {((safePagination.page - 1) * safePagination.limit) + 1}–{Math.min(safePagination.page * safePagination.limit, safePagination.total)} of {safePagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={safePagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="px-4 py-2 bg-black border border-white/15 text-white text-sm disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={safePagination.page === safePagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="px-4 py-2 bg-black border border-white/15 text-white text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {section === "reports" && (
          <div className="bg-zinc-950 border border-white/10 p-6">
            <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-sm">Sixth Season Accreditation Report</h3>
            <p className="text-zinc-500 text-sm mb-6">Generate a PDF report with accreditation statistics and peak hours.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black border border-white/10 p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Registered</p>
                <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
              </div>
              <div className="bg-black border border-white/10 p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Accredited</p>
                <h3 className="text-2xl font-bold text-white">{stats.accredited}</h3>
              </div>
              <div className="bg-black border border-white/10 p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-zinc-400">{stats.pending}</h3>
              </div>
            </div>
            <button onClick={handlePdf} className="w-full bg-white text-black py-3 font-semibold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors">
              Download PDF Report
            </button>
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-950 border border-white/20 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest text-sm">Add Guest</h3>
              <button onClick={() => setAdding(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                <input name="full_name" className="w-full px-4 py-3 bg-black border border-white/20 focus:border-white focus:outline-none text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                <input name="email" type="email" className="w-full px-4 py-3 bg-black border border-white/20 focus:border-white focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Phone</label>
                <input name="phone" type="tel" className="w-full px-4 py-3 bg-black border border-white/20 focus:border-white focus:outline-none text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-white text-black py-3 font-semibold text-sm uppercase tracking-wide hover:bg-zinc-200 disabled:opacity-50">
                  {saving ? "Saving..." : "Add Guest"}
                </button>
                <button type="button" onClick={() => setAdding(false)} className="flex-1 bg-black border border-white/20 text-white py-3 font-semibold text-sm uppercase tracking-wide hover:bg-zinc-900">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-950 border border-white/20 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest text-sm">Edit Guest</h3>
              <button onClick={() => setEditing(null)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
                <input name="full_name" defaultValue={editing.full_name} className="w-full px-4 py-3 bg-black border border-white/20 focus:border-white focus:outline-none text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                <input name="email" type="email" defaultValue={editing.email || ""} className="w-full px-4 py-3 bg-black border border-white/20 focus:border-white focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Phone</label>
                <input name="phone" type="tel" defaultValue={editing.phone || ""} className="w-full px-4 py-3 bg-black border border-white/20 focus:border-white focus:outline-none text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-white text-black py-3 font-semibold text-sm uppercase tracking-wide hover:bg-zinc-200 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="flex-1 bg-black border border-white/20 text-white py-3 font-semibold text-sm uppercase tracking-wide hover:bg-zinc-900">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
