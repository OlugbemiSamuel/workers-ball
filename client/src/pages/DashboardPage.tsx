import { useEffect, useState } from 'react';
import { Card, Users, CheckCircle, Clock, Mail, Activity } from 'lucide-react';
import { accreditApi } from '@/services/api';

type StatCard = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    total: number;
    accredited: number;
    pending: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    accreditApi.stats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const statCards: StatCard[] = stats
    ? [
        {
          title: 'Total Registered',
          value: stats.total,
          icon: Users,
          color: 'text-blue-400',
        },
        {
          title: 'Accredited',
          value: stats.accredited,
          icon: CheckCircle,
          color: 'text-green-400',
        },
        {
          title: 'Pending',
          value: stats.pending,
          icon: Clock,
          color: 'text-yellow-400',
        },
        {
          title: 'Accreditation Rate',
          value: `${stats.percentage}%`,
          icon: Activity,
          color: 'text-purple-400',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gold-400 mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Workers Ball 2026 — Guest Management & Accreditation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="event-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold mt-1 {card.color}">{card.value}</h3>
              </div>
              <div className="p-3 rounded-lg bg-dark-800/50 border border-white/10">
                <card.icon className="w-6 h-6 {card.color}" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="event-card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {}}
              className="flex items-center gap-3 px-4 py-3 bg-dark-800 border border-gold-600/30 rounded-lg hover:border-gold-400 transition-colors text-left"
            >
              <Mail className="w-5 h-5 text-gold-400" />
              <span>Send Tickets to Guests</span>
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-3 px-4 py-3 bg-dark-800 border border-gold-600/30 rounded-lg hover:border-gold-400 transition-colors text-left"
            >
              <Users className="w-5 h-5 text-gold-400" />
              <span>Manage Guest List</span>
            </button>
          </div>
        </div>

        <div className="event-card">
          <h2 className="text-lg font-semibold mb-4">Accreditation Status</h2>
          {stats ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Accredited</span>
                <span className="font-mono text-green-400">{stats.accredited}</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pending</span>
                <span className="font-mono text-yellow-400">{stats.pending}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Loading stats...</p>
          )}
        </div>
      </div>
    </div>
  );
}
