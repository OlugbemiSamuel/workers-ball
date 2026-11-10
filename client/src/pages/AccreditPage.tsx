import { useEffect, useRef, useState } from "react";
import { Search, QrCode, CheckCircle, X, Camera, Loader2, RefreshCw } from "lucide-react";
import { accreditApi, type Guest } from "@/services/api.js";

export default function AccreditPage({
  onAuthExpired,
}: {
  onAuthExpired: () => void;
}): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);

  const showMessage = (text: string, type: "success" | "error" | "info") => {
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
      showMessage(err.response?.data?.error || "Search failed", "error");
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
      const res = await accreditApi.confirm(selectedGuest.id);
      setSelectedGuest(res.data.guest);
      showMessage(res.data.message, "success");
    } catch (err: any) {
      showMessage(err.response?.data?.error || "Accreditation failed", "error");
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
      setManualInput("");
    } catch (err: any) {
      showMessage(err.response?.data?.error || "Ticket not found", "error");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraPermission("granted");
      setCameraActive(true);
      setScanning(true);
      showMessage("Camera active. Point at guest QR code.", "info");
    } catch (err) {
      setCameraPermission("denied");
      showMessage("Camera access denied. Use manual entry instead.", "error");
    }
  };

  const stopScanner = () => {
    setCameraActive(false);
    setScanning(false);
    showMessage("Scanner stopped.", "info");
  };

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

  const scannerStatusClass = scanning ? "bg-[#dcfce7] text-[#10b981]" : "bg-[#e5e7eb] text-[#6b7280]";

  return (
    <div className="min-h-screen bg-[#f1f2f6] text-[#0a0a00] font-sans">
      {/* Header */}
      <div className="bg-white border-b border-[#e6e8ee] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-[#0a0a00] font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#10b981] tracking-tight uppercase">Accredit Interactive</h1>
            <p className="text-sm text-[#6b7280]">Guest Check-in</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
          <RefreshCw className="w-5 h-5" />
        </div>
      </div>

      {/* Live Scanner Feed */}
      <div className="bg-[#f8fafc] border-b border-[#e6e8ee] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#3f4756] uppercase tracking-wider">Live Scanner Feed</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded ${scannerStatusClass}`}>
            {scanning ? "SCANNING" : "IDLE"}
          </span>
        </div>

        <div className="bg-white border border-[#e6e8ee] rounded-lg p-6 relative overflow-hidden">
          {cameraActive && scanning ? (
            <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center min-h-[300px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-12 h-12 mb-3 text-[#10b981]" />
                <p className="text-sm font-medium">Point the camera at the guest's QR code.</p>
                <p className="text-xs text-[#9ca3af] mt-2">Scanning only identifies the guest - you will still press Verify afterwards.</p>
              </div>
              <button
                onClick={stopScanner}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white text-[#10b981] font-semibold hover:bg-[#f8fafc] transition-colors shadow-lg"
              >
                Stop Scanner
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] bg-[#f8fafc] rounded-lg border-2 border-dashed border-[#cbd5e1]">
              <QrCode className="w-20 h-20 mb-4 text-[#10b981]" />
              <h3 className="text-lg font-bold text-[#0a0a00] mb-2">Start Live Scanner</h3>
              <p className="text-sm text-[#6b7280] mb-6 max-w-sm text-center">
                Click the camera icon to activate your device camera
              </p>
              {!cameraPermission && (
                <button
                  onClick={startScanner}
                  className="w-full max-w-xs bg-[#10b981] hover:bg-[#0da271] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-[#10b981]/30"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Live Scanner
                </button>
              )}
              {cameraPermission === "denied" && (
                <div className="w-full max-w-xs text-center">
                  <p className="text-sm text-[#dc2626] mb-3">Camera access denied.</p>
                  <button
                    onClick={handleScanManual}
                    className="w-full bg-[#0a0a00] hover:bg-[#1a1a1a] text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Use Manual Entry
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="absolute top-4 right-4 text-right">
            <span className="text-xs font-mono text-[#6b7280] block">CAMERA</span>
            <span className="text-xs font-mono text-[#6b7280]">REQUIRED</span>
          </div>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="bg-white px-6 py-4 border-b border-[#e6e8ee]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3f4756] uppercase tracking-wider">Manual Entry</h2>
        </div>
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Type guest name to search"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#f8fafc] border border-[#e6e8ee] focus:border-[#10b981] focus:outline-none text-[#0a0a00]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-3 w-full bg-[#10b981] hover:bg-[#0da271] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-[#10b981]/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} Verify
          </button>
          <p className="text-xs text-[#6b7280] mt-2">
            Type to search, click a guest to select, then press Verify to accredit.
          </p>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white px-6 py-4 border-b border-[#e6e8ee]">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Select a guest:</p>
          <div className="space-y-2">
            {searchResults.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGuest(g)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedGuest?.id === g.id ? "bg-[#ecfdf5] border-[#10b981] text-[#0a0a00]" : "bg-white border-[#e6e8ee] text-[#3f4756] hover:border-[#10b981] hover:text-[#10b981]"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.full_name}</div>
                    <div className="text-xs text-[#6b7280]">{g.email || "No email"} \u2022 {g.ticket_id}</div>
                  </div>
                  {g.accredited_at === 1 && (
                    <span className="px-2 py-1 bg-[#ecfdf5] text-[#10b981] rounded text-xs font-semibold border border-[#10b981]/20">
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
      <div className="bg-white px-6 py-6 border-b border-[#e6e8ee]">
        <h2 className="text-sm font-semibold text-[#3f4756] uppercase tracking-wider mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-[#10b981]" /> Scan Ticket ID
        </h2>
        <p className="text-sm text-[#6b7280] mb-4 max-w-md">
          Scan the guest's QR code or type their ticket ID manually.
        </p>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="e.g. WB26-0042"
            className="flex-1 px-4 py-3 rounded-lg bg-[#f8fafc] border border-[#e6e8ee] focus:border-[#10b981] focus:outline-none text-[#0a0a00] uppercase"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.toUpperCase())}
          />
          <button
            onClick={handleScanManual}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-[#0a0a00] hover:bg-[#1a1a1a] text-white font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
          </button>
        </div>
      </div>

      {/* Guest Details Card */}
      {selectedGuest && (
        <div className="bg-white px-6 py-6">
          <div className="relative">
            <button
              onClick={() => setSelectedGuest(null)}
              className="absolute top-4 right-4 p-2 text-[#6b7280] hover:text-[#0a0a00]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-full bg-[#f8fafc] flex items-center justify-center border border-[#e6e8ee] mx-auto md:mx-0">
              <QrCode className="w-10 h-10 text-[#10b981]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-2xl font-bold text-[#0a0a00]">{selectedGuest.full_name}</h2>
                {selectedGuest.accredited_at === 1 ? (
                  <span className="px-3 py-1 bg-[#ecfdf5] text-[#10b981] rounded-full text-xs font-semibold border border-[#10b981]/20">
                    Accredited
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#fef3c7] text-[#d97706] rounded-full text-xs font-semibold border border-[#fcd34d]/20">
                    Not Accredited
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Ticket ID:</span>
                  <span className="font-mono text-[#10b981]">{selectedGuest.ticket_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Email:</span>
                  <span>{selectedGuest.email || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Phone:</span>
                  <span>{selectedGuest.phone || "Not provided"}</span>
                </div>
                {selectedGuest.accredited_at === 1 && (
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Accredited At:</span>
                    <span>{new Date(selectedGuest.accredited_at as unknown as string).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Tickets Sent:</span>
                  <span>{selectedGuest.ticket_sent_count || 0}</span>
                </div>
              </div>

              {selectedGuest.accredited_at === 1 ? (
                <div className="mt-5 p-4 bg-[#ecfdf5] border border-[#10b981]/20 rounded-lg text-[#0a594e] text-sm">
                  This guest has already been accredited.
                </div>
              ) : (
                <button
                  onClick={handleAccredit}
                  disabled={loading}
                  className="w-full mt-5 bg-[#10b981] hover:bg-[#0da271] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-[#10b981]/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? "Accrediting..." : "Accredit Guest"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-lg border shadow-lg z-50 flex items-center gap-3 ${getMessageColor(message.type)}`}
        >
          <span>{message.type === "success" ? "\u2713" : message.type === "error" ? "\u2717" : "\u2139"}</span>
          <span className="text-sm">{message.text}</span>
        </div>
      )}
    </div>
  );
}
