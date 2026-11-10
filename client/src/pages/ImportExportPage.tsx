import { useState } from 'react';
import { Upload, Download, FileText, Loader2 } from 'lucide-react';
import { importExportApi } from '@/services/api';

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number; errors: any[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setImportError('Please upload a valid Excel (.xlsx) or CSV file.');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await importExportApi.import(file);
      setImportResult(res.data);
    } catch (err: any) {
      setImportError(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv', accredited?: string) => {
    try {
      const res = await importExportApi.export(format, accredited);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `workers-ball-guests-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gold-400">Import / Export Guests</h1>
        <p className="text-gray-400 text-sm">Bulk import guests from Excel/CSV or export the guest list</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Card */}
        <div className="event-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-gold-400" /> Import Guests
          </h2>
          <p className="text-sm text-gray-500 mb-4">Upload an Excel (.xlsx) or CSV file with columns: Full Name, Email, Phone</p>

          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-gold-400/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <label className="inline-block">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-400">Click to upload or drag and drop</span>
              </div>
            </label>
          </div>

          {importing && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Importing...</span>
            </div>
          )}

          {importError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {importError}
            </div>
          )}

          {importResult && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-green-400 mb-2">Import Complete</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total rows:</span>
                  <span>{importResult.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Imported:</span>
                  <span className="text-green-400">{importResult.imported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Skipped:</span>
                  <span className="text-yellow-400">{importResult.skipped}</span>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-yellow-500 mb-1">Errors:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {importResult.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Card */}
        <div className="event-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-gold-400" /> Export Guests
          </h2>
          <p className="text-sm text-gray-500 mb-4">Download the guest list as Excel or CSV</p>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700 transition-colors"
            >
              <FileText className="w-4 h-4" /> Export to Excel (.xlsx)
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700 transition-colors"
            >
              <FileText className="w-4 h-4" /> Export to CSV (.csv)
            </button>
            <div className="pt-4 border-t border-white/10">
              <label className="block text-xs text-gray-500 uppercase mb-2">Filter by status:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="flex-1 px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-xs text-white hover:bg-dark-700"
                >
                  All Guests
                </button>
                <button
                  onClick={() => handleExport('xlsx', 'true')}
                  className="flex-1 px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-xs text-white hover:bg-dark-700"
                >
                  Accredited Only
                </button>
                <button
                  onClick={() => handleExport('xlsx', 'false')}
                  className="flex-1 px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-xs text-white hover:bg-dark-700"
                >
                  Not Accredited
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
