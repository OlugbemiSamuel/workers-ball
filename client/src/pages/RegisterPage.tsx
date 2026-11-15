import { useState } from "react";
import { registrationApi } from "@/services/api.js";

export default function RegistrationPage(): JSX.Element {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await registrationApi.submit({
        first_name: form.full_name.split(' ')[0] || '',
        last_name: form.full_name.split(' ').slice(1).join(' ') || '',
        email: form.email,
        phone: form.phone || undefined,
        attendance_status: 'yes',
      });
      setStatus('success');
      setMessage(
        res.email_sent
          ? 'Registration successful! Your Sixth Season ticket and QR code have been sent to your email.'
          : 'Registration successful! Your ticket email could not be sent right now — please check in at the entrance with your name.'
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        {/* Official Sixth Season artwork */}
        <div className="overflow-hidden border border-white/10 bg-black">
          <img
            src="/images/sixth-season-hero.jpeg"
            alt="Sixth Season — Beyond Limits. Beyond Seasons."
            className="h-auto w-full"
          />
        </div>

        <div className="mb-6 mt-5 flex flex-col items-center gap-1 text-center text-sm text-zinc-300">
          <span><span className="text-[#F17A1E]">●</span> Sunday, 22nd November 2026 • 6:00 PM</span>
          <span><span className="text-[#F17A1E]">●</span> BYD, Victoria Island, Lagos</span>
        </div>

          {/* Registration card */}
          <div className="bg-white border border-white/20 rounded-none p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Register to attend</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">First name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-none bg-white border border-black/20 focus:border-[#F17A1E] focus:outline-none text-black"
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
                <label className="block text-sm font-medium text-black mb-1.5">Last name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-none bg-white border border-black/20 focus:border-[#F17A1E] focus:outline-none text-black"
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
                <label className="block text-sm font-medium text-black mb-1.5">Email *</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-none bg-white border border-black/20 focus:border-[#F17A1E] focus:outline-none text-black"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1.5">Phone number (optional)</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-none bg-white border border-black/20 focus:border-[#F17A1E] focus:outline-none text-black"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#F17A1E] hover:bg-[#ff8b33] text-black py-4 rounded-none font-bold text-sm uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? 'Processing...' : 'Complete Registration'}
              </button>
            </form>

            {status === 'success' && (
              <div className="mt-6 p-4 bg-black/5 border border-black/20 rounded-none text-black text-sm flex items-center gap-3">
                <span className="w-5 h-5">✓</span>
                <span>{message}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-none text-red-700 text-sm flex items-center gap-3">
                <span className="w-5 h-5">⚠</span>
                <span>{message}</span>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
