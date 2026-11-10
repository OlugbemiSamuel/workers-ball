import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Users, Scan, Upload, FileText, LogOut } from 'lucide-react';

interface NavbarProps {
  onLogout: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: Users },
    { path: '/admin/guests', label: 'Guests', icon: Ticket },
    { path: '/admin/accredit', label: 'Accredit', icon: Scan },
    { path: '/admin/import-export', label: 'Import/Export', icon: Upload },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <nav className="border-b border-white/10 bg-dark-800/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center text-dark-900 font-bold text-sm">
              WB
            </div>
            <span className="font-serif font-bold text-xl text-white tracking-tight">
              Workers Ball 2026
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
