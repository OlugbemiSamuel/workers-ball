import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import { Camera, CheckCircle, Clock3, Loader2, Search, ScanLine, ShieldCheck, X } from "lucide-react";
import { accreditActivityApi, accreditApi, type Guest } from "@/services/api.js";

interface AccreditPageProps {
  onAuthExpired?: () => void;
}

export default function AccreditPage({ onAuthExpired }: AccreditPageProps = {}): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [recentGuests, setRecentGuests] = useState<Guest[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "manual">("scanner");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerSectionRef = useRef<HTMLElement | null>(null);
  const manualSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ticketId = new URLSearchParams(window.location.search).get("ticket");
    if (!ticketId) return;

    let cancelled = false;
    setLoading(true);
    void accreditApi.getByTicket(ticketId)
      .then(({ data }) => {
        if (cancelled) return;
        setSelectedGuest(data.guest);
        setSearchResults([]);
        setSearchTerm("");
        setActiveTab("manual");
        showMessage("Ticket found. Verify the guest details to accredit.", "info");
      })
      .catch((err: unknown) => {
        if (!cancelled) showRequestError(err, "Ticket not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const showMessage = (text: string, type: "success" | "error" | "info"): void => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 4500);
  };

  const showRequestError = (err: unknown, fallback: string): void => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      if (onAuthExpired) {
        onAuthExpired();
      } else {
        showMessage("Accreditation service is unavailable. Please contact an administrator.", "error");
      }
      return;
    }
    const responseMessage = axios.isAxiosError(err) ? err.response?.data?.message || err.response?.data?.error : null;
    showMessage(typeof responseMessage === "string" ? responseMessage : fallback, "error");
  };

  const loadRecentActivity = async (): Promise<void> => {
    try {
      const { data } = await accreditActivityApi.recent();
      setRecentGuests(data.recent);
    } catch (err) {
      showRequestError(err, "Could not load recent activity");
    }
  };

  const handleSearch = async (query = searchTerm): Promise<void> => {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const { data } = await accreditApi.search(query.trim());
      setSearchResults(data.results);
    } catch (err) {
      showRequestError(err, "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccredit = async (): Promise<void> => {
    if (!selectedGuest || isAccredited(selectedGuest)) return;
    setLoading(true);
    try {
      const { data } = await accreditApi.confirm(selectedGuest.ticket_id);
      setSelectedGuest(data.guest);
      showMessage(data.message, "success");
      void loadRecentActivity();
    } catch (err) {
      if (axios.isAxiosError<{ guest?: Guest }>(err) && err.response?.data.guest) {
        setSelectedGuest(err.response.data.guest);
      }
      showRequestError(err, "Accreditation failed");
    } finally {
      setLoading(false);
    }
  };

  const selectGuest = (guest: Guest): void => {
    setSelectedGuest(guest);
    setSearchResults([]);
    setSearchTerm(guest.full_name);
    setMessage(null);
  };

  const handleQrResult = async (decodedText: string): Promise<void> => {
    const ticketId = extractTicketId(decodedText);
    if (!ticketId) {
      showMessage("This QR code does not contain a Sixth Season ticket.", "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await accreditApi.getByTicket(ticketId);
      setSelectedGuest(data.guest);
      setSearchResults([]);
      setSearchTerm("");
      setActiveTab("manual");
      showMessage("Ticket found. Verify the guest details to accredit.", "info");
    } catch (err) {
      showRequestError(err, "Ticket not found");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async (): Promise<void> => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    setCameraActive(true);
    setCameraStarting(true);
    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (scannerRef.current !== scanner) return;
          scannerRef.current = null;
          setCameraActive(false);
          try {
            await scanner.stop();
          } catch (err) {
            console.error("Could not stop QR scanner after a scan:", err);
          }
          await handleQrResult(decodedText);
        },
        () => undefined,
      );
      showMessage("Camera active. Point it at the guest's QR code.", "info");
    } catch (err) {
      scannerRef.current = null;
      setCameraActive(false);
      showMessage(err instanceof Error ? err.message : "Camera access failed. Check browser permissions.", "error");
      try {
        await scanner.stop();
      } catch (stopError) {
        console.error("Could not stop QR scanner after startup failed:", stopError);
      }
    } finally {
      setCameraStarting(false);
    }
  };

  const stopScanner = async (): Promise<void> => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraActive(false);
    if (!scanner) return;
    try {
      await scanner.stop();
      showMessage("Scanner stopped.", "info");
    } catch (err) {
      console.error("Could not stop QR scanner:", err);
      showMessage("Could not stop the camera cleanly. Close this page to release it.", "error");
    }
  };

  useEffect(() => {
    const query = searchTerm.trim();
    if (selectedGuest || query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => void handleSearch(query), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm, selectedGuest]);

  useEffect(() => {
    void loadRecentActivity();
  }, []);

  useEffect(() => {
    // Only the stacked mobile layout needs the panel scrolled into view; on
    // desktop both panels are visible and scrolling would hide the header.
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    if (activeTab === "manual") {
      manualSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      scannerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  useEffect(() => () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner?.isScanning) {
      void scanner.stop().catch((err: unknown) => console.error("Could not stop QR scanner on page exit:", err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f2f6] text-[#182230]">
      <header className="border-b border-[#e6e8ee] bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10b981] text-white shadow-sm shadow-emerald-500/30">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-wide text-[#08a879] sm:text-base">Accredit Interactive</h1>
              <p className="text-xs font-semibold text-[#172338] sm:text-sm">Guest Check-in</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <span className="hidden sm:inline">Accreditation Admin</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10b981] text-white shadow-md shadow-emerald-500/20"><Clock3 className="h-4 w-4" /></span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-8 lg:grid-cols-3">
        <section ref={scannerSectionRef} aria-label="Live scanner feed" className={`rounded-2xl border border-[#e5e9f0] bg-white p-4 shadow-sm sm:p-5 lg:col-span-2 ${activeTab === "manual" ? "hidden sm:block" : ""}`}>
          <div className="mb-3 flex items-center justify-between border-b border-[#edf0f4] pb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#4c586c]">Live Scanner Feed</h2>
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${cameraActive ? "bg-[#dcfce7] text-[#08734f]" : "bg-[#f1f3f6] text-[#8792a5]"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cameraActive ? "bg-[#10b981]" : "bg-[#cbd3df]"}`} />
              {cameraActive ? "SCANNING" : "IDLE"}
            </span>
          </div>
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#d4dce7] bg-[#fafbfc]">
            <div id="qr-reader" className={cameraActive ? "min-h-64 w-full [&_video]:rounded-xl" : "hidden"} />
            {!cameraActive && (
              <button type="button" onClick={() => void startScanner()} disabled={cameraStarting} className="group relative flex min-h-56 w-full flex-col items-center justify-center px-5 py-7 text-center disabled:opacity-70 sm:min-h-64">
                <span className="absolute left-4 top-1/2 hidden -translate-y-1/2 text-[10px] font-extrabold tracking-[0.32em] text-[#8792a5] [writing-mode:vertical-rl] sm:block">CLICK TO BEGIN</span>
                <span className="mb-3 flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#10b981] text-white shadow-[0_0_0_10px_rgba(16,185,129,0.12)] transition-transform group-hover:scale-105">
                  {cameraStarting ? <Loader2 className="h-9 w-9 animate-spin" /> : <Camera className="h-9 w-9" />}
                </span>
                <span className="text-base font-extrabold text-[#172338]">Start Live Scanner</span>
                <span className="mt-2 max-w-xs text-sm text-[#718096]">Click the camera icon to activate your device camera</span>
                <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-[10px] font-extrabold tracking-[0.32em] text-[#8792a5] [writing-mode:vertical-rl] sm:block">CAMERA REQUIRED</span>
              </button>
            )}
          </div>
          {cameraActive && <button type="button" onClick={() => void stopScanner()} className="mt-3 w-full rounded-lg bg-[#e8f8f0] px-4 py-2.5 text-sm font-bold text-[#08734f] hover:bg-[#d8f3e5]">Stop live scanner</button>}
        </section>

        <section aria-label="Recent activity" className={`rounded-2xl border border-[#e5e9f0] bg-white shadow-sm lg:row-span-2 ${activeTab === "manual" ? "hidden sm:block" : ""}`}>
          <div className="border-b border-[#edf0f4] px-4 py-4 sm:px-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#4c586c]">Recent Activity</h2>
          </div>
          <div className="max-h-[34rem] space-y-2 overflow-y-auto p-4 sm:p-5">
            {recentGuests.length === 0 ? (
              <p className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#718096]">No accreditations recorded yet.</p>
            ) : recentGuests.map((guest) => (
              <div key={guest.id} className="flex items-center gap-3 rounded-xl border border-[#d8f4e7] bg-[#f3fcf7] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-white"><CheckCircle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#344054]">Accredited: <span className="break-words">{guest.full_name}</span></p>
                </div>
                <time className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#75839a]">
                  {guest.accredited_at ? new Date(guest.accredited_at).toLocaleString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </time>
              </div>
            ))}
          </div>
        </section>

        <section ref={manualSectionRef} aria-label="Manual entry" className={`rounded-2xl border border-[#e5e9f0] bg-white shadow-sm lg:col-span-2 ${activeTab === "manual" ? "" : "hidden sm:block"}`}>
          <div className="border-b border-[#edf0f4] px-4 py-4 sm:px-5">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#4c586c]"><Search className="h-4 w-4" /> Manual Entry</h2>
          </div>
          <div className="p-4 sm:p-5">
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => {
              event.preventDefault();
              if (selectedGuest) void handleAccredit();
              else void handleSearch();
            }}>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedGuest(null);
                  }}
                  placeholder="Type guest name or email to search"
                  className="w-full rounded-xl border border-[#dce2eb] bg-white py-3 pl-10 pr-3 text-sm text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/15"
                />
              </div>
              <button type="submit" disabled={loading || (selectedGuest ? isAccredited(selectedGuest) : searchTerm.trim().length < 2)} className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b966d] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify
              </button>
            </form>
            <p className="mt-2 text-xs text-[#718096]">Type to search, click a guest to select, then press Verify to accredit.</p>
            {searchResults.length > 0 && (
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto" aria-label="Guest search results">
                {searchResults.map((guest) => (
                  <button key={guest.id} type="button" onClick={() => selectGuest(guest)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] px-4 py-3 text-left transition hover:border-[#10b981] hover:bg-[#f3fcf7]">
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-[#344054]">{guest.full_name}</span>
                      <span className="mt-0.5 block break-all text-xs text-[#718096]">{guest.email || "No email address"}</span>
                    </span>
                    {isAccredited(guest) && <span className="shrink-0 rounded-full bg-[#e8f8f0] px-2.5 py-1 text-xs font-semibold text-[#08734f]">Accredited</span>}
                  </button>
                ))}
              </div>
            )}
            {searchTerm.trim().length >= 2 && !loading && searchResults.length === 0 && !selectedGuest && <p className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#718096]">No matching guests found.</p>}
          </div>
        </section>

        {selectedGuest && (
          <section className="relative rounded-2xl border border-[#dce7e2] bg-white p-4 shadow-sm sm:p-6 lg:col-span-3">
            <button type="button" onClick={() => setSelectedGuest(null)} className="absolute right-4 top-4 rounded-lg p-2 text-[#64746e] hover:bg-[#edf2f0] hover:text-[#173c30]" aria-label="Clear selected guest">
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-full bg-[#e8f8f0] text-[#0b966b] sm:self-start"><CheckCircle className="h-7 w-7" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="break-words text-xl font-bold text-[#173c30]">{selectedGuest.full_name}</h2>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${isAccredited(selectedGuest) ? "bg-[#dcfce7] text-[#08734f]" : "bg-[#fff4d6] text-[#946200]"}`}>{isAccredited(selectedGuest) ? "Accredited" : "Not accredited"}</span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0"><dt className="text-[#71817b]">Email</dt><dd className="break-all font-medium">{selectedGuest.email || "Not provided"}</dd></div>
                  <div><dt className="text-[#71817b]">Phone</dt><dd className="font-medium">{selectedGuest.phone || "Not provided"}</dd></div>
                  <div><dt className="text-[#71817b]">Ticket ID</dt><dd className="font-mono font-medium">{selectedGuest.ticket_id}</dd></div>
                  {typeof selectedGuest.accredited_at === "string" && <div><dt className="text-[#71817b]">Accredited at</dt><dd className="font-medium">{new Date(selectedGuest.accredited_at).toLocaleString()}</dd></div>}
                </dl>
                {isAccredited(selectedGuest) ? (
                  <p className="mt-5 rounded-lg border border-[#bcebd2] bg-[#effbf4] p-3 text-sm text-[#08734f]">This guest has already been accredited.</p>
                ) : (
                  <button type="button" onClick={() => void handleAccredit()} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#10b981] px-5 py-3 font-semibold text-white hover:bg-[#0b966d] disabled:opacity-50 sm:w-auto">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Verify and accredit
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-[#e5e9f0] bg-white p-2 shadow-[0_-8px_24px_rgba(16,24,40,0.08)] sm:hidden" aria-label="Accreditation tools">
        <button type="button" onClick={() => {
          setActiveTab("scanner");
        }} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-bold ${activeTab === "scanner" ? "text-[#08a879]" : "text-[#98a2b3]"}`}>
          <Camera className="h-5 w-5" /> Scanner
        </button>
        <button type="button" onClick={() => {
          setActiveTab("manual");
        }} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-bold ${activeTab === "manual" ? "text-[#08a879]" : "text-[#98a2b3]"}`}>
          <Search className="h-5 w-5" /> Manual
        </button>
      </nav>

      {message && (
        <div role="status" className={`fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-xl border p-4 shadow-lg sm:bottom-6 ${message.type === "success" ? "border-[#bcebd2] bg-[#effbf4] text-[#08734f]" : message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
          <span className="text-sm">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="ml-auto shrink-0" aria-label="Dismiss message"><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

const isAccredited = (guest: Guest): boolean =>
  guest.accredited === 1 || Boolean(guest.accredited_at);

const extractTicketId = (decodedText: string): string | null => {
  let value = decodedText.trim();
  try {
    const parsedUrl = new URL(value, window.location.origin);
    value = parsedUrl.searchParams.get("ticket")
      || parsedUrl.searchParams.get("token")
      || value;
  } catch {
    // QR payloads may be plain ticket IDs or tokens rather than URLs.
  }
  return value.match(/SS26-[A-Z0-9-]+/i)?.[0].toUpperCase()
    ?? (/[0-9a-f]{64}/i.test(value) ? value : null);
};
