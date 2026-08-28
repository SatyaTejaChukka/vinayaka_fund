import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, CheckCircle2, XCircle, 
  PlusCircle, RefreshCw, Clock, Sparkles, Check, Eye, EyeOff
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { adminApi } from '../../services/api';
import type { FundSummary, AdminDonation } from '../../types';

export const AdminDashboard: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();

  const [fund, setFund] = useState<FundSummary | null>(null);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [pendingDonations, setPendingDonations] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Quick Action Modal States
  const [showAddDonation, setShowAddDonation] = useState<boolean>(false);
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);

  // Forms
  const [donForm, setDonForm] = useState({
    donor_name: '',
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    upi_transaction_id: 'CASH',
    student_year: '',
    description: '',
    show_donor_name: true
  });

  const [expForm, setExpForm] = useState({
    purpose: '',
    amount: '',
    handled_by: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'SPENT' as 'SPENT' | 'PENDING'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await adminApi.getCurrentFundSummary();
      setFund(summary);
      setSetupRequired(false);

      const pendings = await adminApi.getAdminDonations(summary.id, 'PENDING');
      setPendingDonations(pendings);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setFund(null);
        setPendingDonations([]);
        setSetupRequired(true);
      } else {
        toast.error('Failed to load dashboard metrics.');
      }
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id: number) => {
    try {
      setProcessingId(id);
      await adminApi.verifyDonation(id);
      toast.success(`Donation #${id} verified and added to balance!`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to verify donation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const confirmed = await confirm({
      title: 'Reject Payment Submission?',
      message: `Are you sure you want to reject donation submission #${id}?`,
      confirmText: 'Reject Payment',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setProcessingId(id);
      await adminApi.rejectDonation(id);
      toast.warning(`Donation #${id} rejected.`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to reject donation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVisibility = async (id: number, currentVisibility: boolean) => {
    const nextVisibility = !currentVisibility;
    try {
      setPendingDonations((prev) =>
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
      loadData();
    }
  };

  const handleAddDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund) return;
    try {
      await adminApi.createManualDonation(fund.id, {
        donor_name: donForm.donor_name,
        amount: parseFloat(donForm.amount),
        donation_date: donForm.donation_date,
        upi_transaction_id: donForm.upi_transaction_id,
        student_year: donForm.student_year || undefined,
        description: donForm.description,
        show_donor_name: donForm.show_donor_name,
        status: 'VERIFIED'
      });
      toast.success(`Recorded ₹${parseFloat(donForm.amount).toLocaleString('en-IN')} donation from ${donForm.donor_name}!`);
      setShowAddDonation(false);
      setDonForm({
        donor_name: '',
        amount: '',
        donation_date: new Date().toISOString().split('T')[0],
        upi_transaction_id: 'CASH',
        student_year: '',
        description: '',
        show_donor_name: true
      });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add manual donation');
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund) return;
    try {
      await adminApi.createExpense(fund.id, {
        purpose: expForm.purpose,
        amount: parseFloat(expForm.amount),
        handled_by: expForm.handled_by,
        expense_date: expForm.expense_date,
        description: expForm.description,
        status: expForm.status
      });
      toast.success(`Recorded expense: ${expForm.purpose} (₹${parseFloat(expForm.amount).toLocaleString('en-IN')})`);
      setShowAddExpense(false);
      setExpForm({
        purpose: '',
        amount: '',
        handled_by: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'SPENT'
      });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create expense');
    }
  };

  const formatINR = (val: number) => {
    const safeVal = Number.isFinite(val) ? val : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeVal);
  };

  if (setupRequired) {
    return (
      <AdminLayout title="Admin Overview">
        <EmptyState
          emoji="🪔"
          title="Celebration Fund Setup Required"
          description="Your administrator account is ready. Create or configure your celebration fund to start collecting and tracking donations."
          actionText="Create Celebration Fund"
          onAction={() => (window.location.href = '/admin/fund-settings')}
        />
      </AdminLayout>
    );
  }

  if (loading || !fund) {
    return (
      <AdminLayout title="Admin Overview">
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <div className="p-6 rounded-3xl festive-glass border border-amber-500/20 animate-pulse h-48" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Overview">
      
      {/* Top Campaign Banner with Quick Actions & Status */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl festive-glass border border-amber-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gold-gradient tracking-tight break-words">
                {fund.name}
              </h2>
              <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Live & Active
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span>Target: <strong className="text-amber-300 font-bold">{formatINR(fund.target_amount)}</strong></span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span>Raised: <strong className="text-emerald-400 font-bold">{formatINR(fund.total_collected)} ({fund.collection_percentage.toFixed(1)}%)</strong></span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <span>Public Portal:</span>
                <a 
                  href={`/fund/${fund.public_slug}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-amber-400 underline hover:text-amber-300 font-mono text-xs"
                >
                  /fund/{fund.public_slug}
                </a>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowAddDonation(true)}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold gold-button text-xs sm:text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>+ Cash Donation</span>
            </button>

            <button
              onClick={() => setShowAddExpense(true)}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs sm:text-sm active:scale-95 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>+ Record Expense</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 shrink-0 border border-slate-700"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="TOTAL COLLECTED"
          amount={fund.total_collected}
          subtitle={`${fund.verified_donations_count} verified donations`}
          icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
          variant="amber"
        />

        <StatCard
          title="TOTAL SPENT"
          amount={fund.total_spent}
          subtitle={`${fund.expenses_count} recorded expenses`}
          icon={<ArrowDownLeft className="w-5 h-5 text-rose-400" />}
          variant="rose"
        />

        <StatCard
          title="PENDING COMMITMENTS"
          amount={fund.pending_expenses}
          subtitle="Planned & committed"
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          variant="purple"
        />

        <StatCard
          title="AVAILABLE BALANCE"
          amount={fund.available_balance}
          subtitle={`Committed: ${formatINR(fund.committed_balance)}`}
          icon={<Wallet className="w-5 h-5 text-emerald-400" />}
          variant="emerald"
        />
      </div>

      {/* Target Goal Progress Bar */}
      <ProgressBar
        title="Target Goal Progress"
        badgeText="Live Community Goal"
        badgeVariant="emerald"
        percentage={fund.collection_percentage}
        target={fund.target_amount}
        collected={fund.total_collected}
        labelRight="Raised of Goal Target"
        barColor="amber"
        icon={<Sparkles className="w-5 h-5 text-amber-400 shrink-0" />}
        footerLeft={
          <span className="text-slate-300 text-xs sm:text-sm">
            Target Celebration Goal: <strong className="text-amber-300 font-bold">{formatINR(fund.target_amount)}</strong>
          </span>
        }
        footerRight={
          <span className="text-slate-300 text-xs sm:text-sm">
            Verified Raised: <strong className="text-emerald-400 font-black">{formatINR(fund.total_collected)}</strong>
          </span>
        }
      />

      {/* Pending Donation Verification Queue */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl festive-glass border border-amber-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Pending Verification Queue
            </h3>
            <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingDonations.length} Pending
            </span>
          </div>

          <span className="text-[11px] sm:text-xs text-slate-400">
            Verify donor UPI details against your bank statement
          </span>
        </div>

        {pendingDonations.length === 0 ? (
          <EmptyState
            icon={Check}
            emoji="✨"
            title="All Submissions Verified"
            description="No pending donor submissions in the verification queue. All donations have been processed and confirmed!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {pendingDonations.map((d) => (
              <div
                key={d.id}
                className="p-3.5 sm:p-4.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 relative shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-white text-sm sm:text-base break-words">
                          {d.donor_name}
                        </h4>
                        {d.student_year && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                            🎓 {d.student_year}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(d.id, d.show_donor_name)}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition border active:scale-95 shrink-0 ${
                            d.show_donor_name
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                              : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                          }`}
                          title={
                            d.show_donor_name
                              ? 'Currently Public on portal. Click to make Anonymous.'
                              : 'Currently Anonymous on portal. Click to make Public.'
                          }
                        >
                          {d.show_donor_name ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Public</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Anonymous</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80 text-[11px] sm:text-xs font-mono text-amber-300 break-all">
                        <span className="text-slate-400 font-sans">UPI Ref:</span>
                        <span className="font-bold tracking-wide">{d.upi_transaction_id || 'N/A'}</span>
                      </div>
                    </div>

                    <span className="text-lg sm:text-xl font-black text-gold-gradient shrink-0">
                      {formatINR(d.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
                    <span>Submitted: {d.donation_date}</span>
                    {d.description && <span className="italic truncate max-w-[160px] sm:max-w-[220px]">{d.description}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleVerify(d.id)}
                    className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 active:scale-95 transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>Confirm & Verify</span>
                  </button>

                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleReject(d.id)}
                    className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Manual Donation Modal */}
      {showAddDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-2xl sm:rounded-3xl border border-amber-500/30 p-4 sm:p-6 text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gold-gradient">Record Manual / Cash Donation</h3>
              <button
                onClick={() => setShowAddDonation(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddDonationSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Donor Name *</label>
                <input
                  type="text"
                  required
                  value={donForm.donor_name}
                  onChange={(e) => setDonForm({ ...donForm, donor_name: e.target.value })}
                  placeholder="Enter donor name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Academic Year / Role</label>
                <select
                  value={donForm.student_year}
                  onChange={(e) => setDonForm({ ...donForm, student_year: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select Studying Year (Optional)</option>
                  <option value="1st Year (I)">1st Year (I)</option>
                  <option value="2nd Year (II)">2nd Year (II)</option>
                  <option value="3rd Year (III)">3rd Year (III)</option>
                  <option value="4th Year (IV)">4th Year (IV)</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Alumni">Alumni</option>
                  <option value="General Public">General Public</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={donForm.amount}
                  onChange={(e) => setDonForm({ ...donForm, amount: e.target.value })}
                  placeholder="1000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Receipt / Payment Mode</label>
                <input
                  type="text"
                  value={donForm.upi_transaction_id}
                  onChange={(e) => setDonForm({ ...donForm, upi_transaction_id: e.target.value })}
                  placeholder="CASH or UPI-Ref"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Note</label>
                <input
                  type="text"
                  value={donForm.description}
                  onChange={(e) => setDonForm({ ...donForm, description: e.target.value })}
                  placeholder="Optional notes or batch details"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDonation(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold gold-button text-amber-950 text-xs shadow-md transition active:scale-95 text-center"
                >
                  Save & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-2xl sm:rounded-3xl border border-rose-500/30 p-4 sm:p-6 text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-rose-300">Record Celebration Expense</h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Expense Purpose *</label>
                <input
                  type="text"
                  required
                  value={expForm.purpose}
                  onChange={(e) => setExpForm({ ...expForm, purpose: e.target.value })}
                  placeholder="e.g. Clay Idol, Sound & Lighting"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expForm.amount}
                  onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                  placeholder="8000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-bold text-rose-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Handled / Managed By *</label>
                <input
                  type="text"
                  required
                  value={expForm.handled_by}
                  onChange={(e) => setExpForm({ ...expForm, handled_by: e.target.value })}
                  placeholder="e.g. Ramesh / Committee Member"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Expense Status *</label>
                <select
                  value={expForm.status}
                  onChange={(e) => setExpForm({ ...expForm, status: e.target.value as 'SPENT' | 'PENDING' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="SPENT">SPENT (Payment Completed)</option>
                  <option value="PENDING">PENDING (Planned / Committed)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="Bill details or vendor contact"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs shadow-md transition active:scale-95 text-center"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};
