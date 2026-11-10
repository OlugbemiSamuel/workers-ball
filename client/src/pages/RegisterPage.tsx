import { useState } from "react";
import { Mail, Phone, ArrowRight } from "lucide-react";
import { createGuest } from "@/api/guests.api.js";

export default function RegistrationPage(): JSX.Element {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await createGuest({
        full_name: form.full_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      setStatus('success');
      setMessage('Registration successful! Your ticket QR code will be sent to your email.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background image - event flyer */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Workers Ball 2026"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_top_center,rgba(217,119,6,0.15)_0%,transparent_50%)]" />
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#d97706] text-[#0a0a0a] mb-4">
              <span className="font-bold text-lg">WB</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-white mb-2 leading-tight">
              Workers Ball 2026
            </h1>
            <p className="text-[#d97706] font-semibold tracking-wider uppercase text-sm">
              Light of the Globe
            </p>
          </div>

          {/* Modern registration card */}
          <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0a0a0a]">Register to attend</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">First name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#d97706]/30 focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 text-[#0a0a0a]"
                  placeholder="John"
                  value={form.full_name.split(' ')[0] || ''}
                  onChange={(e) => {
                    const parts = form.full_name.split(' ');
                    parts[0] = e.target.value;
                    setForm({ ...form, full_name: parts.join(' ') });
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">Last name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#d97706]/30 focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 text-[#0a0a0a]"
                  placeholder="Doe"
                  value={form.full_name.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => {
                    const parts = form.full_name.split(' ');
                    parts[1] = e.target.value;
                    setForm({ ...form, full_name: parts.join(' ') });
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">Email *</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#d97706]/30 focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 text-[#0a0a0a]"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">Phone number (optional)</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#d97706]/30 focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 text-[#0a0a0a]"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white py-4 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">Processing...</span>
                ) : (
                  <span>Complete registration <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
            </form>

            {status === 'success' && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 text-sm flex items-center gap-3">
                <span className="w-5 h-5">✓</span>
                <span>{message}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm flex items-center gap-3">
                <span className="w-5 h-5">⚠</span>
                <span>{message}</span>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              22nd Nov. 2026 • 4PM
            </p>
            <p className="text-sm text-gray-500">
              Harvesters Globe Ologolo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
