import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, CheckCircle2, XCircle, Download, Filter, GraduationCap } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportToCsv, type CsvColumn } from '../../utils/csvExporter';
import { adminApi } from '../../services/api';
import type { AdminDonation } from '../../types';

const ACADEMIC_YEARS = [
  'ALL_YEARS',
  '1st Year (I)',
  '2nd Year (II)',
  '3rd Year (III)',
  '4th Year (IV)',
  'Other / General'
];

export const AdminDonations: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();

  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL_YEARS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Void Modal State
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  const loadDonations = async () => {
    try {
      setLoading(true);
      const summary = await adminApi.getCurrentFund();

      const list = await adminApi.getAdminDonations(
        summary.id,
        activeFilter === 'ALL' ? undefined : activeFilter
      );
      setDonations(list);
      setSetupRequired(false);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setDonations([]);
        setSetupRequired(true);
      } else {
        toast.error('Failed to load donations register from server.');
      }
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
      toast.success(`Donation #${id} has been verified and added to balance!`);
      loadDonations();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to verify donation.');
    }
  };

  const handleReject = async (id: number) => {
    const confirmed = await confirm({
      title: 'Reject Donation Submission?',
      message: `Are you sure you want to reject donation submission #${id}? This entry will be marked as rejected in the records.`,
      confirmText: 'Reject Submission',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await adminApi.rejectDonation(id);
      toast.warning(`Donation #${id} rejected.`);
      loadDonations();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Rejection failed.');
    }
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingId || !voidReason.trim()) return;
    try {
      await adminApi.voidDonation(voidingId, voidReason.trim());
      toast.info(`Transaction #${voidingId} has been voided.`);
      setVoidingId(null);
      setVoidReason('');
      loadDonations();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Void transaction failed.');
    }
  };

  const filteredDonations = donations.filter((d) => {
    // Search matching
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.donor_name.toLowerCase().includes(term) ||
      (d.upi_transaction_id && d.upi_transaction_id.toLowerCase().includes(term)) ||
      (d.description && d.description.toLowerCase().includes(term));

    // Academic year matching
    let matchesYear = true;
    if (yearFilter === 'Other / General') {
      matchesYear = !d.student_year || d.student_year === 'Other' || d.student_year === 'General';
    } else if (yearFilter !== 'ALL_YEARS') {
      matchesYear = d.student_year === yearFilter;
    }

    return matchesSearch && matchesYear;
  });

  const handleExportCsv = () => {
    if (filteredDonations.length === 0) {
      toast.warning('No donations available to export with current filters.');
      return;
    }

    const columns: CsvColumn<AdminDonation>[] = [
      { header: 'ID', accessor: (d) => d.id },
      { header: 'Donor Name', accessor: (d) => d.donor_name },
      { header: 'Studying Year / Role', accessor: (d) => d.student_year || 'General / Unspecified' },
      { header: 'Amount (INR)', accessor: (d) => d.amount },
      { header: 'Payment Method', accessor: (d) => d.payment_method },
      { header: 'Transaction / Ref ID', accessor: (d) => d.upi_transaction_id || 'CASH' },
      { header: 'Submission Date', accessor: (d) => d.donation_date },
      { header: 'Status', accessor: (d) => d.status },
      { header: 'Public Display', accessor: (d) => (d.show_donor_name ? 'Visible' : 'Anonymous') },
      { header: 'Description / Note', accessor: (d) => d.description || '' },
      { header: 'Verified Date', accessor: (d) => d.verified_at || '' },
      { header: 'Void Reason', accessor: (d) => d.void_reason || '' }
    ];

    exportToCsv(filteredDonations, columns, 'vinayaka_donations_register');
    toast.success(`Exported ${filteredDonations.length} donation records to CSV!`);
  };

  const handleResetFilters = () => {
    setActiveFilter('ALL');
    setYearFilter('ALL_YEARS');
    setSearchTerm('');
  };

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
      <div className="p-4 rounded-2xl festive-glass border border-amber-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search Bar & Year Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search donor, ref, or note..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Student Academic Year Dropdown */}
          <div className="relative w-full sm:w-52">
            <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3 pointer-events-none" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-amber-300 text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer appearance-none"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white font-medium">
                  {y === 'ALL_YEARS' ? '🎓 All Academic Years' : `🎓 ${y}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills & Actions */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
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

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            disabled={loading || filteredDonations.length === 0}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download safe CSV of current view"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={loadDonations}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 active:scale-95 ml-auto lg:ml-1"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>

      {/* Donations Table View */}
      <div className="rounded-3xl festive-glass border border-amber-500/20 overflow-hidden shadow-2xl">
        {setupRequired ? (
          <EmptyState
            emoji="⚙️"
            title="Fund Setup Required"
            description="No active celebration fund is configured for this admin account."
            actionText="Go to Fund Settings"
            onAction={() => (window.location.href = '/admin/fund-settings')}
          />
        ) : loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Filter}
              title="No Matching Donations"
              description={`No donation records found matching status "${activeFilter}" and academic year "${yearFilter === 'ALL_YEARS' ? 'All Years' : yearFilter}".`}
              actionText="Reset Search & Filters"
              onAction={handleResetFilters}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
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
