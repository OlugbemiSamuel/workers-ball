import { useState } from 'react';
import { Mail, Phone, Calendar, MapPin, QrCode, ArrowRight } from 'lucide-react';
import { guestApi } from '@/services/api';

export default function RegistrationPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await guestApi.create(form);
      setStatus('success');
      setMessage('Registration successful! Your ticket QR code will be sent to your email.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background design section */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900/80 to-dark-900" />
        
        <div className="relative z-10 max-w-md w-full px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-600 text-dark-900 mb-4">
              <span className="font-bold text-lg">WB</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-white mb-2">Workers Ball 2026</h1>
            <p className="text-gold-400 font-semibold tracking-wider uppercase text-sm">Light of the Globe</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-gold-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-gold-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-gold-400 focus:outline-none transition-colors text-white placeholder-gray-500"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>22nd Nov. 2026 • 4PM</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Harvesters Globe Ologolo</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full gold-gradient py-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">Registering...</span>
                ) : (
                  <span>Register to Attend <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
            </div>
          </form>

          {status === 'success' && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>{message}</span>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <span className="w-5 h-5">⚠</span>
              <span>{message}</span>
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
              <div className="w-px h-4 bg-gray-600" />
              <span>Already registered?</span>
              <div className="w-px h-4 bg-gray-600" />
            </div>
            <button
              onClick={() => {}}
              className="text-gold-400 hover:text-gold-300 text-sm font-medium underline"
            >
              Check My Ticket Status
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">
                Scan QR on event banner to register
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-dark-800/50 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          {process.env.EVENT_NAME || 'Workers Ball 2026'} • {process.env.EVENT_DATE || '22nd Nov. 2026'} • {process.env.VENUE || 'Harvesters Globe Ologolo'}
        </div>
      </div>
    </div>
  );
}

import { CheckCircle } from 'lucide-react';
