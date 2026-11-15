import { useRef, useState } from "react";
import axios from "axios";
import { Download, FileSpreadsheet, FileText, Loader2, Upload } from "lucide-react";
import AdminPageLayout from "@/components/AdminPageLayout.js";
import { importExportApi } from "@/services/api.js";

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: Array<{ row: number; reason: string }>;
}

interface ImportExportPageProps {
  admin: { email: string; role: string };
  onLogout: () => void;
}

export default function ImportExportPage({ admin, onLogout }: ImportExportPageProps): JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setImportError("Choose a CSV (.csv) or Excel (.xlsx) file.");
      event.target.value = "";
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const response = await importExportApi.import(file);
      setImportResult(response.data as ImportResult);
    } catch (err) {
      setImportError(getRequestError(err, "Import failed. Please check the file and try again."));
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleExport = async (format: "xlsx" | "csv", accredited?: string): Promise<void> => {
    const exportKey = `${format}-${accredited || "all"}`;
    setExporting(exportKey);
    setExportError(null);
    try {
      const response = await importExportApi.export(format, accredited);
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `sixth-season-guests-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setExportError(getRequestError(err, "Export failed. Please try again."));
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminPageLayout admin={admin} onLogout={onLogout} activePage="import-export">
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-bold text-[#ffffff]">Import / Export Guests</h1>
          <p className="mt-1 text-sm text-gray-400">Upload guest details or download the guest list.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <Upload className="h-5 w-5 text-[#F17A1E]" /> Import guests
            </h2>
            <p className="mb-5 text-sm text-gray-400">CSV and Excel (.xlsx) files are supported. Include columns for full name and, optionally, email and phone.</p>

            <label
              className={`relative flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-[#0f0f0f] px-4 py-6 text-center transition hover:border-[#F17A1E] ${importing ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => void handleFileChange(event)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Choose guest import file"
              />
              {importing ? <Loader2 className="h-8 w-8 animate-spin text-[#F17A1E]" /> : <FileSpreadsheet className="h-8 w-8 text-[#F17A1E]" />}
              <span className="text-sm font-medium text-gray-200">{importing ? "Importing guests..." : "Tap to choose a CSV or Excel file"}</span>
              <span className="text-xs text-gray-500">Works on phone and desktop · .csv or .xlsx</span>
            </label>

            {importError && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{importError}</p>}
            {importResult && (
              <div role="status" className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <h3 className="font-semibold text-green-300">Import complete</h3>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-gray-400">Rows</dt><dd className="font-semibold">{importResult.total}</dd></div>
                  <div><dt className="text-gray-400">Imported</dt><dd className="font-semibold text-green-300">{importResult.imported}</dd></div>
                  <div><dt className="text-gray-400">Skipped</dt><dd className="font-semibold text-amber-300">{importResult.skipped}</dd></div>
                </dl>
                {importResult.errors.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-gray-300">
                    {importResult.errors.map((error, index) => <li key={`${error.row}-${index}`}>Row {error.row}: {error.reason}</li>)}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <Download className="h-5 w-5 text-[#F17A1E]" /> Export guests
            </h2>
            <p className="mb-5 text-sm text-gray-400">Choose a format and download all guests or filter by accreditation status.</p>
            {exportError && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{exportError}</p>}
            <div className="space-y-3">
              <button type="button" onClick={() => void handleExport("xlsx")} disabled={Boolean(exporting)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#F17A1E] bg-[#F17A1E] px-4 py-3 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-60">
                {exporting === "xlsx-all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Export to Excel
              </button>
              <button type="button" onClick={() => void handleExport("csv")} disabled={Boolean(exporting)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm font-medium hover:bg-[#252525] disabled:opacity-60">
                {exporting === "csv-all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Export to CSV
              </button>
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Export Excel by status</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: "All guests", value: undefined },
                  { label: "Accredited", value: "true" },
                  { label: "Not accredited", value: "false" },
                ].map((filter) => (
                  <button key={filter.value || "all-filter"} type="button" onClick={() => void handleExport("xlsx", filter.value)} disabled={Boolean(exporting)} className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-xs font-medium text-gray-200 hover:bg-[#252525] disabled:opacity-60">
                    {exporting === `xlsx-${filter.value || "all"}` ? "Preparing..." : filter.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminPageLayout>
  );
}

const getRequestError = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message || err.response?.data?.error;
    if (typeof message === "string") return message;
  }
  return err instanceof Error ? err.message : fallback;
};
