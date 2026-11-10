import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, QrCode, CheckCircle, X, Camera, Loader2, RefreshCw, Phone, Mail } from 'lucide-react';
import { accreditApi, type Guest } from '@/services/api';

export default function AccreditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const clearMessage = () => setMessage(null);

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
    clearMessage();
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

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraPermission('granted');
      setCameraActive(true);
      setScanning(true);
      showMessage('Camera active. Point at guest QR code.', 'info');
    } catch (err) {
      setCameraPermission('denied');
      showMessage('Camera access denied. Use manual entry instead.', 'error');
    }
  };

  const stopScanner = () => {
    setCameraActive(false);
    setScanning(false);
    showMessage('Scanner stopped.', 'info');
  };

  const handleQRScan = (ticketId: string) => {
    stopScanner();
    setLoading(true);
    accreditApi.getByTicket(ticketId)
      .then(res => {
        setSelectedGuest(res.data.guest);
      })
      .catch(err => {
        showMessage(err.response?.data?.error || 'Ticket not found', 'error');
      })
      .finally(() => setLoading(false));
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (searchTerm.length >= 3) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      setDebounceTimer(timer);
    } else {
      setSearchResults([]);
      setSelectedGuest(null);
    }
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [searchTerm, debounceTimer]);

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 border-green-500/20 bg-green-500/10';
      case 'error': return 'text-red-400 border-red-500/20 bg-red-500/10';
      default: return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-green-600 tracking-tight uppercase">Accredit Interactive</h1>
            <p className="text-sm text-gray-500">Guest Check-in</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <RefreshCw className="w-5 h-5" />
        </div>
      </div>

      {/* Live Scanner Feed Section */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Live Scanner Feed</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            scanning ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {scanning ? 'SCANNING' : 'IDLE'}
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 relative overflow-hidden">
          {cameraActive && scanning ? (
            <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center min-h-[300px]">
              <video
                autoPlay
                playsInline
                muted
                ref={null}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-12 h-12 mb-3 text-green-400" />
                <p className="text-sm font-medium">Point the camera at the guest's QR code.</p>
                <p className="text-xs text-gray-400 mt-2">Scanning only identifies the guest - you will still press Verify afterwards.</p>
              </div>
              <button
                onClick={stopScanner}
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full bg-white text-green-600 font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Stop Scanner
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <QrCode className="w-20 h-20 mb-4 text-green-500" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Start Live Scanner</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm text-center">
                Click the camera icon to activate your device camera
              </p>
              {!cameraPermission && (
                <button
                  onClick={startScanner}
                  className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-green-500/30"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Live Scanner
                </button>
              )}
              {cameraPermission === 'denied' && (
                <div className="w-full max-w-xs text-center">
                  <p className="text-sm text-red-600 mb-3">Camera access denied.</p>
                  <button
                    onClick={handleScanManual}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Use Manual Entry
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="absolute top-4 right-4 text-right">
            <span className="text-xs font-mono text-gray-400 block">CAMERA</th>
            <span className="text-xs font-mono text-gray-400">REQUIRED</th>
          </div>
        </div>
      </div>

      {/* Manual Entry Section */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Manual Entry</h2>
        </div>
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Type guest name to search"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-green-500 focus:outline-none text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Verify className="w-4 h-4 mr-2" />} Verify
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Type to search, click a guest to select, then press Verify to accredit.
          </p>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select a guest:</p>
          <div className="space-y-2">
            {searchResults.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGuest(g)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedGuest?.id === g.id
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.full_name}</div>
                    <div className="text-xs text-gray-500">{g.email || 'No email'} • {g.ticket_id}</div>
                  </div>
                  {g.accredited === 1 && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-semibold">
                      Accredited
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Ticket ID Entry */}
      <div className="bg-white px-6 py-6 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-green-500" /> Scan Ticket ID
        </h2>
        <p className="text-sm text-gray-500 mb-4 max-w-md">
          Scan the guest's QR code or type their ticket ID manually.
        </p>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="e.g. WB26-0042"
            className="flex-1 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-green-500 focus:outline-none text-gray-900 uppercase"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.toUpperCase())}
          />
          <button
            onClick={handleScanManual}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
          </button>
        </div>
      </div>

      {/* Guest Details Card */}
      {selectedGuest && (
        <div className="bg-white px-6 py-6">
          <div className="relative">
            <button
              onClick={() => setSelectedGuest(null)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 mx-auto md:mx-0">
              <QrCode className="w-10 h-10 text-green-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{selectedGuest.full_name}</h2>
                {selectedGuest.accredited === 1 ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                    Accredited
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200">
                    Not Accredited
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket ID:</span>
                  <span className="font-mono text-green-600">{selectedGuest.ticket_id}</span>
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
                <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  This guest has already been accredited.
                </div>
              ) : (
                <button
                  onClick={handleAccredit}
                  disabled={loading}
                  className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Accrediting...' : 'Accredit Guest'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 p-4 rounded-lg border shadow-lg z-50 flex items-center gap-3 ${getMessageColor(message.type)}`}
        >
          <span>{message.type === 'success' ? '✓' : message.type === 'error' ? '✕' : 'ℹ'}</span>
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="bg-white px-6 py-6 border-t border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {/* Will be populated from API stats */}
          <div className="text-sm text-gray-500 text-center py-8">
            No recent activity yet.
          </div>
        </div>
      </div>
    </div>
  );
}
