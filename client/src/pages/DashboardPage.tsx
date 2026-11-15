import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  CheckCircle,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { guestApi, ticketApi, importExportApi, reportsApi, type Guest } from "@/services/api.js";
import { buildWhatsAppTicketLink, ticketQrUrl } from "@/utils/whatsapp.js";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

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

  const navigation = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/guests", label: "Guests", icon: Users },
    { to: "/admin/reports", label: "Reports", icon: Activity },
    { to: "/admin/import-export", label: "Import / Export", icon: Upload },
  ];

  const isActive = (to: string): boolean => {
    if (to === "/dashboard") return location.pathname === "/dashboard" || (!["/admin/guests", "/admin/reports", "/admin/import-export"].includes(location.pathname) && section === "overview");
    if (to === "/admin/guests") return location.pathname === "/admin/guests";
    return location.pathname === to;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (fixed on desktop, slide-over on mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-zinc-950 transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F17A1E] text-sm font-bold text-[#F17A1E]">
              S6
            </span>
            <span className="font-serif text-lg font-bold tracking-wide text-white">SIXTH SEASON</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => {
                  setSidebarOpen(false);
                  if (to === "/admin/guests") setSection("attendees");
                  if (to === "/dashboard") setSection("overview");
                }}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 border-l-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#F17A1E] bg-[#F17A1E]/10 text-[#F17A1E]"
                    : "border-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="mb-3 truncate px-3 text-xs text-zinc-500">{admin.email}</p>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Mobile top bar with hamburger */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-black/90 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-white/15 p-2 text-white hover:bg-white/5"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-serif text-sm font-bold tracking-widest text-white">SIXTH SEASON</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-white">{titles[section].title}</h1>
            <p className="text-sm text-zinc-500">{titles[section].hint}</p>
          </div>

          {notice && (
            <div className="mb-6 border border-white/15 bg-white/5 p-4 text-sm text-zinc-200">{notice}</div>
          )}

          {section === "overview" && (
            <>
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="border border-white/10 bg-zinc-950 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Total Registered</p>
                  <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
                </div>
                <div className="border border-white/10 bg-zinc-950 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Accredited</p>
                  <h3 className="text-3xl font-bold text-white">{stats.accredited}</h3>
                </div>
                <div className="border border-white/10 bg-zinc-950 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pending</p>
                  <h3 className="text-3xl font-bold text-zinc-400">{stats.pending}</h3>
                </div>
                <div className="border border-white/10 bg-zinc-950 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Tickets Sent</p>
                  <h3 className="text-3xl font-bold text-zinc-400">{stats.ticketsSent}</h3>
                </div>
              </div>

              <div className="border border-white/10 bg-zinc-950 p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    onClick={() => setSection("attendees")}
                    className="flex items-center gap-2 bg-[#F17A1E] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-[#ff8b33]"
                  >
                    <FileText className="w-4 h-4" /> Manage Guests
                  </button>
                  <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-2 border border-white/20 bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-900"
                  >
                    <Plus className="w-4 h-4" /> Add Guest
                  </button>
                  <button
                    onClick={() => setSection("reports")}
                    className="flex items-center gap-2 border border-white/20 bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-900"
                  >
                    <Activity className="w-4 h-4" /> Reports
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 border border-white/20 bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-zinc-900"
                  >
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                </div>
              </div>
            </>
          )}

          {section === "attendees" && (
            <>
              <div className="mb-6 border border-white/10 bg-zinc-950 p-6">
                <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-end">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or ticket ID..."
                      className="w-full border border-white/15 bg-black py-3 pl-10 pr-4 text-white focus:border-white focus:outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadGuests()}
                    />
                  </div>
                  <select
                    value={accreditedFilter}
                    onChange={(e) => { setAccreditedFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                    className="border border-white/15 bg-black px-4 py-3 text-white focus:border-white focus:outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="true">Accredited</option>
                    <option value="false">Not Accredited</option>
                  </select>
                  <button
                    onClick={() => setAdding(true)}
                    className="flex items-center justify-center gap-2 bg-[#F17A1E] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-[#ff8b33]"
                  >
                    <Plus className="w-4 h-4" /> Add Guest
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-white/10 bg-zinc-950">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-zinc-500">
                      <th className="py-4 pl-4 pr-3">Guest</th>
                      <th className="py-4 pr-3">Status</th>
                      <th className="py-4 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="p-10 text-center text-sm text-zinc-500">Loading guests...</td></tr>
                    ) : visible.length === 0 ? (
                      <tr><td colSpan={3} className="p-10 text-center text-sm text-zinc-500">No guests found.</td></tr>
                    ) : (
                      visible.map((guest) => (
                        <tr key={guest.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                          <td className="py-4 pl-4 pr-3">
                            <p className="font-medium text-white">{guest.full_name}</p>
                            <p className="break-all text-xs text-zinc-500">{guest.email || "No email address"}</p>
                            <p className="text-xs text-zinc-500">{guest.phone || "No phone number"}</p>
                            <p className="mt-0.5 font-mono text-xs text-zinc-400">{guest.ticket_id}</p>
                          </td>
                          <td className="py-4 pr-3">
                            <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium ${guest.accredited_at ? "border-white/40 bg-white/10 text-white" : "border-white/15 text-zinc-400"}`}>
                              {guest.accredited_at ? (<><CheckCircle className="w-3 h-3" /> Accredited</>) : "Pending"}
                            </span>
                            <p className="mt-1 text-[11px] text-zinc-500">Tickets sent: {guest.ticket_sent_count || 0}</p>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {guest.email ? (
                                <button
                                  onClick={() => handleSendTicket(guest)}
                                  disabled={sendingTicket === guest.id}
                                  className="border border-white/15 p-1.5 text-zinc-300 transition-colors hover:border-white hover:text-white"
                                  title="Send Ticket Email"
                                >
                                  {sendingTicket === guest.id ? "…" : <Mail className="w-4 h-4" />}
                                </button>
                              ) : (
                                <span
                                  className="cursor-not-allowed border border-white/10 p-1.5 text-zinc-600"
                                  title="No email address on file"
                                  aria-label="No email address on file"
                                >
                                  <Mail className="w-4 h-4" />
                                </span>
                              )}
                              {guest.phone ? (
                                <a
                                  href={buildWhatsAppTicketLink(guest, ticketQrUrl(guest.ticket_id)) ?? undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="border border-emerald-500/40 p-1.5 text-emerald-400 transition-colors hover:border-emerald-400 hover:text-emerald-300"
                                  title={`Send ticket on WhatsApp (${guest.phone})`}
                                  aria-label={`Send ticket to ${guest.full_name} on WhatsApp`}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              ) : (
                                <span
                                  className="cursor-not-allowed border border-white/10 p-1.5 text-zinc-600"
                                  title="No phone number on file"
                                  aria-label="No phone number on file"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </span>
                              )}
                              <button
                                onClick={() => setEditing(guest)}
                                className="border border-white/15 p-1.5 text-zinc-300 transition-colors hover:border-white hover:text-white"
                                title="Edit Guest"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAccredit(guest)}
                                disabled={!!guest.accredited_at}
                                className={`p-1.5 transition-colors ${guest.accredited_at ? "cursor-not-allowed bg-white/5 text-zinc-600" : "bg-[#F17A1E] text-black hover:bg-[#ff8b33]"}`}
                                title={guest.accredited_at ? "Already accredited" : "Accredit Guest"}
                                aria-label={guest.accredited_at ? "Already accredited" : `Accredit ${guest.full_name}`}
                              >
                                {guest.accredited_at ? <CheckCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
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
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-zinc-500">
                    Showing {((safePagination.page - 1) * safePagination.limit) + 1}–{Math.min(safePagination.page * safePagination.limit, safePagination.total)} of {safePagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={safePagination.page === 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      className="border border-white/15 bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      disabled={safePagination.page === safePagination.totalPages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="border border-white/15 bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {section === "reports" && (
            <div className="border border-white/10 bg-zinc-950 p-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-white">Sixth Season Accreditation Report</h3>
              <p className="mb-6 text-sm text-zinc-500">Generate a PDF report with accreditation statistics and peak hours.</p>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="border border-white/10 bg-black p-4">
                  <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Total Registered</p>
                  <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
                </div>
                <div className="border border-white/10 bg-black p-4">
                  <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Accredited</p>
                  <h3 className="text-2xl font-bold text-white">{stats.accredited}</h3>
                </div>
                <div className="border border-white/10 bg-black p-4">
                  <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Pending</p>
                  <h3 className="text-2xl font-bold text-zinc-400">{stats.pending}</h3>
                </div>
              </div>
              <button
                onClick={handlePdf}
                className="w-full bg-[#F17A1E] py-3 text-sm font-semibold uppercase tracking-widest text-black transition-colors hover:bg-[#ff8b33]"
              >
                Download PDF Report
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Add Guest Modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Add Guest</h3>
              <button onClick={() => setAdding(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Full Name</label>
                <input name="full_name" className="w-full border border-white/20 bg-black px-4 py-3 text-white focus:border-[#F17A1E] focus:outline-none" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
                <input name="email" type="email" className="w-full border border-white/20 bg-black px-4 py-3 text-white focus:border-[#F17A1E] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Phone</label>
                <input name="phone" type="tel" className="w-full border border-white/20 bg-black px-4 py-3 text-white focus:border-[#F17A1E] focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#F17A1E] py-3 text-sm font-semibold uppercase tracking-wide text-black hover:bg-[#ff8b33] disabled:opacity-50">
                  {saving ? "Saving..." : "Add Guest"}
                </button>
                <button type="button" onClick={() => setAdding(false)} className="flex-1 border border-white/20 bg-black py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-zinc-900">
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
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Edit Guest</h3>
              <button onClick={() => setEditing(null)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditGuest} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Full Name</label>
                <input name="full_name" defaultValue={editing.full_name} className="w-full border border-white/20 bg-black px-4 py-3 text-white focus:border-[#F17A1E] focus:outline-none" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
                <input name="email" type="email" defaultValue={editing.email || ""} className="w-full border border-white/20 bg-black px-4 py-3 text-white focus:border-[#F17A1E] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Phone</label>
                <input name="phone" type="tel" defaultValue={editing.phone || ""} className="w-full border border-white/20 bg-black px-4 py-3 text-white focus:border-[#F17A1E] focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#F17A1E] py-3 text-sm font-semibold uppercase tracking-wide text-black hover:bg-[#ff8b33] disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="flex-1 border border-white/20 bg-black py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-zinc-900">
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
