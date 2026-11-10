import { useEffect, useState, useCallback } from 'react';
import { Search, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { guestApi, ticketApi, type Guest } from '@/services/api';

export default function GuestListPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [accreditedFilter, setAccreditedFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await guestApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search,
        accredited: accreditedFilter || undefined,
      });
      setGuests(res.data.guests);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Fetch guests error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, accreditedFilter]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleSendTicket = async (ticketId: string) => {
    setSending(ticketId);
    try {
      await ticketApi.send(ticketId);
      fetchGuests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send ticket');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gold-400">Guest Management</h1>
          <p className="text-gray-400 text-sm">View registered guests for Workers Ball 2026</p>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center gap-2 gold-gradient px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Mail className="w-4 h-4" /> Send Tickets
        </button>
      </div>

      {/* Filters */}
      <div className="event-card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or ticket ID..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-dark-800 border border-white/10 focus:border-gold-400 focus:outline-none text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={accreditedFilter}
            onChange={(e) => setAccreditedFilter(e.target.value)}
            className="px-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Accredited</option>
            <option value="false">Not Accredited</option>
          </select>
          <button
            onClick={() => {
              setSearch('');
              setAccreditedFilter('');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-4 py-3 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Guest Table */}
      <div className="event-card overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
              <th className="pb-3 pl-4">Guest</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Ticket ID</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Tickets Sent</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gold-400 mx-auto" />
                </td>
              </tr>
            ) : guests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No guests found.
                </td>
              </tr>
            ) : (
              guests.map((guest) => (
                <tr key={guest.id} className="border-b border-white/5 hover:bg-dark-800/30 transition-colors">
                  <td className="py-4 pl-4">
                    <div className="font-medium">{guest.full_name}</div>
                    <div className="text-xs text-gray-500">{guest.ticket_id}</div>
                  </td>
                  <td className="py-4 pl-4 text-sm">{guest.email || '-'}</td>
                  <td className="py-4 pl-4 text-sm font-mono">{guest.ticket_id}</td>
                  <td className="py-4 pl-4 text-sm">{guest.phone || '-'}</td>
                  <td className="py-4 pl-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        guest.accredited === 1
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}
                    >
                      {guest.accredited === 1 ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Accredited
                        </>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </td>
                  <td className="py-4 pl-4 text-sm">{guest.ticket_sent_count || 0}</td>
                  <td className="py-4 pl-4 text-right">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendTicket(guest.ticket_id)}
                        disabled={sending === guest.ticket_id}
                        className="p-2 text-gray-400 hover:text-gold-400 transition-colors"
                        title="Send Ticket Email"
                      >
                        {sending === guest.ticket_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <p className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} guests
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-white disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
