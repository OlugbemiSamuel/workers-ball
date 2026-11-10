import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, FileText, LayoutDashboard, LogOut, Menu, Upload, X } from "lucide-react";

interface AdminPageLayoutProps {
  admin: { email: string; role: string };
  onLogout: () => void;
  activePage: "reports" | "import-export";
  children: ReactNode;
}

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/guests", label: "Guests", icon: FileText },
  { to: "/admin/reports", label: "Reports", icon: Activity },
  { to: "/admin/import-export", label: "Import / Export", icon: Upload },
];

export default function AdminPageLayout({
  admin,
  onLogout,
  activePage,
  children,
}: AdminPageLayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#141414] transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d97706] text-sm font-bold text-[#0a0a0a]">WB</span>
            <span className="font-serif text-lg font-bold tracking-tight">Workers Ball</span>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active = (activePage === "reports" && to === "/admin/reports")
              || (activePage === "import-export" && to === "/admin/import-export");
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active ? "bg-[#d97706]/15 text-[#fbbf24]" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon className="h-5 w-5" /> {label}
              </Link>
            );
          })}
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
          <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white">Back to dashboard</Link>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
