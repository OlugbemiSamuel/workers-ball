import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Menu, X, LogOut, Users, Ticket, Scan, Upload, FileText, Shield, ChevronLeft } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if token stored in localStorage
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('admin_token', token);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    setIsAuthenticated(false);
    setSidebarOpen(false);
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: Users },
    { path: '/admin/guests', label: 'Guests', icon: Ticket },
    { path: '/admin/accredit', label: 'Accredit', icon: Scan },
    { path: '/admin/import-export', label: 'Import/Export', icon: Upload },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="bg-dark-800 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold-600 flex items-center justify-center text-dark-900 font-bold">
                WB
              </div>
              <span className="font-serif font-bold text-xl text-white tracking-tight">Workers Ball 2026</span>
            </div>
            <h2 className="text-gold-400 font-serif font-bold text-2xl mb-2">Admin Login</h2>
            <p className="text-gray-400 text-sm mb-6">Enter admin credentials to access the dashboard</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const username = formData.get('username') as string;
              const password = formData.get('password') as string;
              fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
              })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    handleLogin(data.token);
                    navigate('/admin');
                  } else {
                    alert('Invalid credentials');
                  }
                });
            }}>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input
                  name="username"
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-dark-900 border border-white/20 focus:border-gold-400 focus:outline-none text-white"
                  placeholder="admin"
                  defaultValue="admin"
                />
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <input
                  name="password"
                  type="password"
                  className="w-full px-4 py-3 rounded-lg bg-dark-900 border border-white/20 focus:border-gold-400 focus:outline-none text-white"
                  defaultValue="admin123"
                />
              </div>
              <button
                type="submit"
                className="w-full gold-gradient py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-all"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white relative">
      {sidebarOpen && (
        <div
          className="sidebar-overlay fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Mobile Back Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-white text-sm hover:bg-dark-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Event
        </button>
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-white text-sm hover:bg-dark-700"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          {sidebarOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-800 border-r border-white/10 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:relative md:static md:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center text-dark-900 font-bold">
              WB
            </div>
            <span className="font-serif font-bold text-lg text-white tracking-tight">Workers Ball 2026</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`md:pl-64 min-h-screen py-6 px-4 md:px-8 ${sidebarOpen ? 'md:pl-0' : ''}`}>
        <Outlet context={{ authToken }} />
      </div>
    </div>
  );
}
