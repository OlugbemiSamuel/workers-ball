import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "@/api/auth.api.js";

export default function LoginPage({
  onLoggedIn,
}: {
  onLoggedIn: (a: { email: string; role: string }) => void;
}): JSX.Element {
  const [form, setForm] = useState({ email: "admin@harvesters.org", password: "Admin123!" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(form.email, form.password);
      localStorage.setItem("workersball.token", res.token);
      onLoggedIn({ email: form.email, role: "admin" });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#d97706] flex items-center justify-center text-[#0a0a0a] font-bold text-sm">
              WB
            </div>
            <span className="font-serif font-bold text-xl text-white tracking-tight">
              Workers Ball 2026
            </span>
          </div>
          <Shield className="w-12 h-12 text-[#d97706] mb-6" />
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Admin Login</h2>
          <p className="text-gray-400 text-sm mb-6">Enter admin credentials to access the dashboard</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/20 focus:border-[#d97706] focus:outline-none text-white placeholder-gray-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  name="password"
                  type="password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/20 focus:border-[#d97706] focus:outline-none text-white placeholder-gray-500"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">Signing in...</span>
              ) : (
                <span>Sign In <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              Workers Ball 2026 • 22nd Nov. 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
