import { useState, useEffect } from 'react';
import { Search, QrCode, CheckCircle, X, Camera, Loader2, RefreshCw } from 'lucide-react';
import { accreditApi, type Guest } from '@/services/api';

export default function AccreditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const clearMessage = () => setTimeout(() => setMessage(null), 4000);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    clearMessage();
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await accreditApi.search(searchTerm);
      setSearchResults(res.data.results);
      setSelectedGuest(null);
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setSearchResults([]);
    setSearchTerm(guest.full_name);
  };

  const handleAccredit = async () => {
    if (!selectedGuest) return;
    setLoading(true);
    try {
      const res = await accreditApi.confirm(selectedGuest.ticket_id);
      setSelectedGuest(res.data.guest);
      showMessage(res.data.message, 'success');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Accreditation failed', 'error');
      if (err.response?.data?.guest) {
        setSelectedGuest(err.response.data.guest);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanManual = async () => {
    if (!manualInput.trim()) return;
    setLoading(true);
    try {
      const res = await accreditApi.getByTicket(manualInput.toUpperCase());
      setSelectedGuest(res.data.guest);
      setManualInput('');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Ticket not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    setScanning(true);
    // In a production app, integrate html5-qrcode or similar camera library here
    showMessage('Camera scanner would open here. Use manual ticket ID entry below.', 'info');
    setScanning(false);
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 border-green-500/20 bg-green-500/10';
      case 'error': return 'text-red-400 border-red-500/20 bg-red-500/10';
      default: return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gold-400">Event Day Accreditation</h1>
          <p className="text-gray-400 text-sm">Check-in guests via name search or QR code scan</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleQRScan}
            className="flex items-center gap-2 gold-gradient px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Camera className="w-4 h-4" /> QR Scanner
          </button>
          <button
            onClick={handleQRScan}
            className="px-4 py-2 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700 text-sm"
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="event-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gold-400" /> Search Guest by Name
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type guest name..."
            className="flex-1 px-4 py-3 rounded-lg bg-dark-800 border border-white/10 focus:border-gold-400 focus:outline-none text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Select a guest:</p>
            {searchResults.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGuest(g)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedGuest?.id === g.id
                    ? 'bg-gold-600/20 border-gold-400 text-white'
                    : 'bg-dark-800 border-white/10 text-gray-300 hover:border-gold-400 hover:text-white'
                }`}
              >
                <div className="font-medium">{g.full_name}</div>
                <div className="text-xs text-gray-500">{g.email || 'No email'} • {g.ticket_id}</div>
                {g.accredited === 1 && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    Already Accredited
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guest Details Card */}
      {selectedGuest && (
        <div className="event-card p-6 relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setSelectedGuest(null)}
              className="p-2 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center border border-white/20 mx-auto md:mx-0">
              <QrCode className="w-10 h-10 text-gold-400" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-serif font-bold">{selectedGuest.full_name}</h2>
                {selectedGuest.accredited === 1 ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold border border-green-500/30">
                    Accredited
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold border border-yellow-500/30">
                    Not Accredited
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket ID:</span>
                  <span className="font-mono text-gold-400">{selectedGuest.ticket_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span>{selectedGuest.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span>{selectedGuest.phone || 'Not provided'}</span>
                </div>
                {selectedGuest.accredited_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accredited At:</span>
                    <span>{new Date(selectedGuest.accredited_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tickets Sent:</span>
                  <span>{selectedGuest.ticket_sent_count || 0}</span>
                </div>
              </div>

              {selectedGuest.accredited === 1 ? (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  This guest has already been accredited.
                </div>
              ) : (
                <button
                  onClick={handleAccredit}
                  disabled={loading}
                  className="w-full gold-gradient py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Accrediting...' : 'Accredit Guest'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Ticket ID Entry */}
      <div className="event-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-gold-400" /> Scan Ticket ID
        </h2>
        <p className="text-sm text-gray-500 mb-4">Scan the guest's QR code or type their ticket ID manually.</p>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="e.g. WB26-0042"
            className="flex-1 px-4 py-3 rounded-lg bg-dark-800 border border-white/10 focus:border-gold-400 focus:outline-none text-white uppercase"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
          <button
            onClick={handleScanManual}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${getMessageColor(message.type)} flex items-center gap-3`}
        >
          <span>{message.type === 'success' ? '✓' : message.type === 'error' ? '✕' : 'ℹ'}</span>
          <span className="text-sm">{message.text}</span>
        </div>
      )}
    </div>
  );
}
