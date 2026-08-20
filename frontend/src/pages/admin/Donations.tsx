import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { adminApi, publicApi } from '../../services/api';
import type { AdminDonation } from '../../types';

export const AdminDonations: React.FC = () => {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Void Modal State
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  const loadDonations = async () => {
    try {
      setLoading(true);
      const summary = await publicApi.getFundSummary('vinayaka-chavithi-2026');

      const list = await adminApi.getAdminDonations(
        summary.id,
        activeFilter === 'ALL' ? undefined : activeFilter
      );
      setDonations(list);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [activeFilter]);

  const handleVerify = async (id: number) => {
    try {
      await adminApi.verifyDonation(id);
      loadDonations();
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this donation entry?')) return;
    try {
      await adminApi.rejectDonation(id);
      loadDonations();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingId || !voidReason.trim()) return;
    try {
      await adminApi.voidDonation(voidingId, voidReason.trim());
      setVoidingId(null);
      setVoidReason('');
      loadDonations();
    } catch (err) {
      alert('Void transaction failed');
    }
  };

  const filteredDonations = donations.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.donor_name.toLowerCase().includes(term) ||
      (d.upi_transaction_id && d.upi_transaction_id.toLowerCase().includes(term)) ||
      (d.description && d.description.toLowerCase().includes(term))
    );
  });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <AdminLayout title="Donation Register & Verification">
      
      {/* Search & Filter Header */}
      <div className="p-4 rounded-2xl festive-glass border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search donor name or UPI ref..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'VOIDED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 active:scale-95 transition ${
                activeFilter === filter
                  ? 'gold-button text-amber-950 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
          
          <button
            onClick={loadDonations}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 active:scale-95 ml-auto sm:ml-2"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>

      {/* Donations Table */}
      <div className="rounded-3xl festive-glass border border-amber-500/20 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-12 text-center text-amber-300 text-sm animate-pulse">
            Loading Donation Records...
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No donation records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-amber-500/20 text-slate-300 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="p-4">Donor</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">UPI / Ref ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{d.donor_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {d.student_year && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            🎓 {d.student_year}
                          </span>
                        )}
                        {d.description && <span className="text-[11px] text-slate-400">{d.description}</span>}
                      </div>
                    </td>

                    <td className="p-4 font-extrabold text-amber-400 text-sm">
                      {formatINR(d.amount)}
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      {d.upi_transaction_id || 'CASH'}
                    </td>

                    <td className="p-4 text-slate-400">
                      {d.donation_date}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        d.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : d.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : d.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {d.status === 'PENDING' && (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleVerify(d.id)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-slate-950 font-extrabold hover:brightness-110 active:scale-95 transition text-xs shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => handleReject(d.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 transition text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {d.status === 'VERIFIED' && (
                        <button
                          onClick={() => setVoidingId(d.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 active:scale-95 transition text-xs font-bold"
                        >
                          Void Transaction
                        </button>
                      )}

                      {d.status === 'VOIDED' && (
                        <span className="text-[10px] text-rose-400 italic">
                          Reason: {d.void_reason || 'N/A'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mandatory Void Reason Modal */}
      {voidingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-3xl border border-rose-500/30 p-6 text-white space-y-4">
            <h3 className="text-lg font-bold text-rose-300">Void Verified Donation #{voidingId}</h3>
            <p className="text-xs text-slate-300">
              Financial history is preserved. Voiding will remove this donation from total collection calculations and record your voiding reason in system audit logs.
            </p>

            <form onSubmit={handleVoidSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reason for Voiding *
                </label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Enter reason for voiding transaction"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVoidingId(null)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs"
                >
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};
