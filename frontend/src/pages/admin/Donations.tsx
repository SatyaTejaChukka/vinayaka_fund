import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, CheckCircle2, XCircle, Download, Filter, GraduationCap, Eye, EyeOff, X, Pencil, Save } from 'lucide-react';
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

type DonationEditForm = {
  donor_name: string;
  student_year: string;
  amount: string;
  payment_method: string;
  upi_transaction_id: string;
  donation_date: string;
  description: string;
  status: AdminDonation['status'];
  show_donor_name: boolean;
  void_reason: string;
};

const toDonationEditForm = (donation: AdminDonation): DonationEditForm => ({
  donor_name: donation.donor_name,
  student_year: donation.student_year || '',
  amount: String(donation.amount),
  payment_method: donation.payment_method || 'UPI',
  upi_transaction_id: donation.upi_transaction_id || '',
  donation_date: donation.donation_date,
  description: donation.description || '',
  status: donation.status,
  show_donor_name: donation.show_donor_name,
  void_reason: donation.void_reason || '',
});

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
  const [selectedDonation, setSelectedDonation] = useState<AdminDonation | null>(null);
  const [isEditingDonation, setIsEditingDonation] = useState<boolean>(false);
  const [savingDonation, setSavingDonation] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<DonationEditForm | null>(null);

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

  const handleToggleVisibility = async (id: number, currentVisibility: boolean) => {
    const nextVisibility = !currentVisibility;
    try {
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, show_donor_name: nextVisibility } : d))
      );
      await adminApi.updateDonationVisibility(id, nextVisibility);
      toast.success(
        nextVisibility
          ? `Donation #${id} is now Public (name shown on portal)!`
          : `Donation #${id} is now Anonymous (name hidden on portal)!`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update visibility.');
      loadDonations();
    }
  };

  const openDonationDetails = (donation: AdminDonation) => {
    setSelectedDonation(donation);
    setEditForm(toDonationEditForm(donation));
    setIsEditingDonation(false);
  };

  const closeDonationDetails = () => {
    setSelectedDonation(null);
    setEditForm(null);
    setIsEditingDonation(false);
  };

  const handleSaveDonation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDonation || !editForm) return;

    const amount = Number(editForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid donation amount greater than zero.');
      return;
    }

    if (editForm.status === 'VOIDED' && !editForm.void_reason.trim()) {
      toast.error('A void reason is required for a voided transaction.');
      return;
    }

    try {
      setSavingDonation(true);
      const updatedDonation = await adminApi.updateDonation(selectedDonation.id, {
        donor_name: editForm.donor_name.trim(),
        amount,
        donation_date: editForm.donation_date,
        payment_method: editForm.payment_method,
        upi_transaction_id: editForm.upi_transaction_id.trim() || null,
        description: editForm.description.trim() || null,
        status: editForm.status,
        show_donor_name: editForm.show_donor_name,
        student_year: editForm.student_year || null,
        void_reason: editForm.void_reason.trim() || null,
      });
      setDonations((previous) =>
        previous.map((donation) => donation.id === updatedDonation.id ? updatedDonation : donation)
      );
      setSelectedDonation(updatedDonation);
      setEditForm(toDonationEditForm(updatedDonation));
      setIsEditingDonation(false);
      toast.success(`Transaction #${updatedDonation.id} updated successfully.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update transaction.');
    } finally {
      setSavingDonation(false);
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
      matchesYear = !d.student_year || d.student_year === 'Other' || d.student_year === 'General' || d.student_year === 'Other / General';
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

  const isCashDonation = selectedDonation?.payment_method === 'CASH' || selectedDonation?.upi_transaction_id?.startsWith('CASH-');
  const cashHandoverPerson = selectedDonation?.description?.match(/^Direct Cash Handover \((.+)\)$/)?.[1]?.trim();

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
          <div className="relative w-full sm:w-56">
            <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-200 text-xs font-bold focus:outline-none focus:border-amber-400 custom-select cursor-pointer shadow-sm hover:border-amber-500/50 transition-all"
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
                  <th className="p-4">Public View</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredDonations.map((d) => (
                  <tr
                    key={d.id}
                     onClick={() => openDonationDetails(d)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                         openDonationDetails(d);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Click to view transaction details"
                    className="hover:bg-slate-900/40 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-400/70">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{d.donor_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {d.student_year && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            🎓 {d.student_year}
                          </span>
                        )}
                        {!d.show_donor_name && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300/90 border border-amber-500/30 font-semibold">
                            Anonymous on Portal
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(d.id, d.show_donor_name);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border active:scale-95 ${
                          d.show_donor_name
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                            : 'bg-slate-900/90 text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                        }`}
                        title={
                          d.show_donor_name
                            ? 'Currently Public on portal. Click to make Anonymous.'
                            : 'Currently Anonymous on portal. Click to make Public.'
                        }
                      >
                        {d.show_donor_name ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Anonymous</span>
                          </>
                        )}
                      </button>
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
                            onClick={(e) => {
                             e.stopPropagation();
                             handleVerify(d.id);
                           }}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-slate-950 font-extrabold hover:brightness-110 active:scale-95 transition text-xs shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={(e) => {
                             e.stopPropagation();
                             handleReject(d.id);
                           }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 transition text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {d.status === 'VERIFIED' && (
                        <button
                          onClick={(e) => {
                           e.stopPropagation();
                           setVoidingId(d.id);
                         }}
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


      {/* Transaction Details Modal */}
      {selectedDonation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
           onClick={closeDonationDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto festive-glass rounded-3xl border border-amber-500/30 p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-amber-500/20">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-extrabold">Transaction details</p>
                <h3 id="transaction-details-title" className="text-xl font-extrabold text-white mt-1">
                  Donation #{selectedDonation.id}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Click outside this window or use the close button to return to the register.</p>
              </div>
              <button
                type="button"
                 onClick={closeDonationDetails}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-rose-500/20 hover:text-white border border-slate-700 transition"
                aria-label="Close transaction details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

             {isEditingDonation && editForm && (
               <form onSubmit={handleSaveDonation} className="mt-5 space-y-4">
                 <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
                   <p className="text-xs text-amber-200">
                     Update the transaction details below. Changes are saved to the register and recorded in the audit trail.
                   </p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="sm:col-span-2">
                     <label htmlFor="edit-donor-name" className="text-xs font-bold text-slate-300 block mb-1">Donor name *</label>
                     <input
                       id="edit-donor-name"
                       type="text"
                       required
                       value={editForm.donor_name}
                       onChange={(event) => setEditForm({ ...editForm, donor_name: event.target.value })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                     />
                   </div>
                   <div>
                     <label htmlFor="edit-student-year" className="text-xs font-bold text-slate-300 block mb-1">Academic year / role</label>
                     <select
                       id="edit-student-year"
                       value={editForm.student_year}
                       onChange={(event) => setEditForm({ ...editForm, student_year: event.target.value })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 custom-select"
                     >
                       <option value="">Not provided</option>
                       <option value="1st Year (I)">1st Year (I)</option>
                       <option value="2nd Year (II)">2nd Year (II)</option>
                       <option value="3rd Year (III)">3rd Year (III)</option>
                       <option value="4th Year (IV)">4th Year (IV)</option>
                       <option value="Faculty">Faculty</option>
                       <option value="Alumni">Alumni</option>
                       <option value="General Public">General Public</option>
                       <option value="Other / General">Other / General</option>
                     </select>
                   </div>
                   <div>
                     <label htmlFor="edit-amount" className="text-xs font-bold text-slate-300 block mb-1">Amount (₹) *</label>
                     <input
                       id="edit-amount"
                       type="number"
                       required
                       min="0.01"
                       step="0.01"
                       value={editForm.amount}
                       onChange={(event) => setEditForm({ ...editForm, amount: event.target.value })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                     />
                   </div>
                   <div>
                     <label htmlFor="edit-payment-method" className="text-xs font-bold text-slate-300 block mb-1">Payment method *</label>
                     <select
                       id="edit-payment-method"
                       value={editForm.payment_method}
                       onChange={(event) => setEditForm({ ...editForm, payment_method: event.target.value })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 custom-select"
                     >
                       <option value="UPI">UPI</option>
                       <option value="CASH">Cash</option>
                     </select>
                   </div>
                   <div>
                     <label htmlFor="edit-donation-date" className="text-xs font-bold text-slate-300 block mb-1">Donation date *</label>
                     <input
                       id="edit-donation-date"
                       type="date"
                       required
                       value={editForm.donation_date}
                       onChange={(event) => setEditForm({ ...editForm, donation_date: event.target.value })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                     />
                   </div>
                   <div className="sm:col-span-2">
                     <label htmlFor="edit-reference" className="text-xs font-bold text-slate-300 block mb-1">Payment / receipt reference</label>
                     <input
                       id="edit-reference"
                       type="text"
                       value={editForm.upi_transaction_id}
                       onChange={(event) => setEditForm({ ...editForm, upi_transaction_id: event.target.value })}
                       placeholder="UPI reference or cash receipt number"
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                     />
                   </div>
                   <div>
                     <label htmlFor="edit-status" className="text-xs font-bold text-slate-300 block mb-1">Status *</label>
                     <select
                       id="edit-status"
                       value={editForm.status}
                       onChange={(event) => setEditForm({ ...editForm, status: event.target.value as AdminDonation['status'] })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 custom-select"
                     >
                       <option value="PENDING">Pending</option>
                       <option value="VERIFIED">Verified</option>
                       <option value="REJECTED">Rejected</option>
                       <option value="VOIDED">Voided</option>
                     </select>
                   </div>
                   <div className="flex items-end pb-1">
                     <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editForm.show_donor_name}
                         onChange={(event) => setEditForm({ ...editForm, show_donor_name: event.target.checked })}
                         className="h-4 w-4 accent-amber-400"
                       />
                       Show donor name on public portal
                     </label>
                   </div>
                   {editForm.status === 'VOIDED' && (
                     <div className="sm:col-span-2">
                       <label htmlFor="edit-void-reason" className="text-xs font-bold text-slate-300 block mb-1">Void reason *</label>
                       <input
                         id="edit-void-reason"
                         type="text"
                         required
                         value={editForm.void_reason}
                         onChange={(event) => setEditForm({ ...editForm, void_reason: event.target.value })}
                         className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-400"
                       />
                     </div>
                   )}
                   <div className="sm:col-span-2">
                     <label htmlFor="edit-description" className="text-xs font-bold text-slate-300 block mb-1">Donor note / description</label>
                     <textarea
                       id="edit-description"
                       rows={3}
                       value={editForm.description}
                       onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                       className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 resize-y"
                     />
                   </div>
                 </div>
                 <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-amber-500/20">
                   <button
                     type="button"
                     onClick={() => {
                       setEditForm(toDonationEditForm(selectedDonation));
                       setIsEditingDonation(false);
                     }}
                     disabled={savingDonation}
                     className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm font-bold transition disabled:opacity-50"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={savingDonation}
                     className="px-4 py-2.5 rounded-xl gold-button text-amber-950 text-sm font-extrabold transition flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     <Save className="w-4 h-4" />
                     {savingDonation ? 'Saving...' : 'Save changes'}
                   </button>
                 </div>
               </form>
             )}

             <div className={`${isEditingDonation ? 'hidden ' : ''}grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5`}>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Donor name</p>
                <p className="text-base font-extrabold text-white mt-1">{selectedDonation.donor_name}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Amount</p>
                <p className="text-lg font-extrabold text-amber-400 mt-1">{formatINR(selectedDonation.amount)}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Payment method</p>
                <p className="text-sm font-bold text-white mt-1">
                  {isCashDonation ? 'Cash donation' : 'UPI payment'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {isCashDonation ? 'Cash receipt / reference ID' : 'UPI transaction reference ID'}
                </p>
                <p className="text-sm font-mono text-amber-200 mt-1 break-all">{selectedDonation.upi_transaction_id || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Donation date</p>
                <p className="text-sm font-bold text-white mt-1">{selectedDonation.donation_date}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Student year / role</p>
                <p className="text-sm font-bold text-white mt-1">{selectedDonation.student_year || 'Not provided'}</p>
              </div>
              {isCashDonation && (
                <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/20 p-4 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Cash handed over to</p>
                  <p className="text-sm font-bold text-emerald-200 mt-1">{cashHandoverPerson || 'Not provided'}</p>
                </div>
              )}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {isCashDonation ? 'Cash handover / donor note' : 'Donor note'}
                </p>
                <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{selectedDonation.description || 'No note provided'}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Status</p>
                <p className="text-sm font-extrabold text-emerald-300 mt-1">{selectedDonation.status}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Portal visibility</p>
                <p className="text-sm font-bold text-white mt-1">{selectedDonation.show_donor_name ? 'Donor name shown' : 'Anonymous on portal'}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Submitted at</p>
                <p className="text-sm text-slate-200 mt-1">{new Date(selectedDonation.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last updated</p>
                <p className="text-sm text-slate-200 mt-1">{new Date(selectedDonation.updated_at).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Verification</p>
                <p className="text-sm text-slate-200 mt-1">
                  {selectedDonation.verified_at ? 'Verified on ' + new Date(selectedDonation.verified_at).toLocaleString('en-IN') + (selectedDonation.verified_by ? ' by admin #' + selectedDonation.verified_by : '') : 'Not verified'}
                </p>
              </div>
              {selectedDonation.void_reason && (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-rose-300 font-bold">Void reason</p>
                  <p className="text-sm text-rose-100 mt-1">{selectedDonation.void_reason}</p>
                </div>
              )}
            </div>

             <div className="flex justify-end items-center gap-2 mt-6 pt-4 border-t border-amber-500/20">
               {!isEditingDonation && (
                 <button
                   type="button"
                   onClick={() => {
                     setEditForm(toDonationEditForm(selectedDonation));
                     setIsEditingDonation(true);
                   }}
                   className="mr-auto px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40 text-sm font-bold transition flex items-center gap-2"
                 >
                   <Pencil className="w-4 h-4" />
                   Edit transaction
                 </button>
               )}
              <button
                type="button"
                 onClick={closeDonationDetails}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm font-bold transition"
              >
                 {isEditingDonation ? 'Close' : 'Close details'}
              </button>
            </div>
          </div>
        </div>
      )}

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
