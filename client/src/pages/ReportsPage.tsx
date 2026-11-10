import { useState } from 'react';
import { FileText, Activity, Users, Clock } from 'lucide-react';
import { reportsApi } from '@/services/api';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.accreditation();
      setStats(res.data);
    } catch (err) {
      alert('Failed to load report stats');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await reportsApi.pdf();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(stats?.event || 'workers-ball').replace(/\s+/g, '-')}-Accreditation-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <button
          onClick={fetchStats}
          className="px-6 py-3 bg-dark-800 border border-white/10 text-white rounded-lg hover:bg-dark-700"
        >
          <Activity className="w-4 h-4 mr-2" /> Load Report Stats
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gold-400">Accreditation Report</h1>
          <p className="text-gray-400 text-sm">{stats.event} • {stats.eventDate}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 gold-gradient px-5 py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {pdfLoading ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Registered', value: stats.total, icon: Users, color: 'text-blue-400' },
          { title: 'Accredited', value: stats.accredited, icon: Clock, color: 'text-green-400' },
          { title: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
          { title: 'Accreditation Rate', value: `${stats.percentage}%`, icon: Activity, color: 'text-purple-400' },
        ].map((card, i) => (
          <div key={i} className="event-card p-5">
            <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">{card.title}</p>
            <h3 className="text-2xl font-bold {card.color}">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Surge Hours */}
      <div className="event-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold-400" /> Surge Hours — Accreditations by Hour
        </h2>
        {stats.surgeHours && stats.surgeHours.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Hour</th>
                  <th className="pb-3 text-right">Accreditations</th>
                </tr>
              </thead>
              <tbody>
                {stats.surgeHours.map((h: any, i: number) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 font-mono text-gray-400">#{i + 1}</td>
                    <td className="py-3 font-mono">{String(h.hour).padStart(2, '0')}:00</td>
                    <td className="py-3 font-mono text-right text-gold-400">{h.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No accreditations recorded yet.</p>
        )}
      </div>

      {/* Recent Accreditations */}
      {stats.recent && stats.recent.length > 0 && (
        <div className="event-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Accreditations</h2>
          <div className="space-y-3">
            {stats.recent.map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg border border-white/5">
                <div>
                  <div className="font-medium">{g.full_name}</div>
                  <div className="text-xs text-gray-500">{g.ticket_id}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-green-400">{new Date(g.accredited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-xs text-gray-500">{new Date(g.accredited_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
