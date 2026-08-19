import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, CheckCircle2, XCircle, 
  PlusCircle, RefreshCw, Clock
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { adminApi, publicApi } from '../../services/api';
import type { FundSummary, AdminDonation } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [fund, setFund] = useState<FundSummary | null>(null);
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
      const summary = await publicApi.getFundSummary('vinayaka-chavithi-2026');
      setFund(summary);

      const pendings = await adminApi.getAdminDonations(summary.id, 'PENDING');
      setPendingDonations(pendings);
    } catch (err) {
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
      await loadData();
    } catch (err) {
      alert('Failed to verify donation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this payment submission?')) return;
    try {
      setProcessingId(id);
      await adminApi.rejectDonation(id);
      await loadData();
    } catch (err) {
      alert('Failed to reject donation');
    } finally {
      setProcessingId(null);
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
        description: donForm.description,
        show_donor_name: donForm.show_donor_name,
        status: 'VERIFIED'
      });
      setShowAddDonation(false);
      setDonForm({ donor_name: '', amount: '', donation_date: new Date().toISOString().split('T')[0], upi_transaction_id: 'CASH', description: '', show_donor_name: true });
      loadData();
    } catch (err) {
      alert('Failed to add manual donation');
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
      setShowAddExpense(false);
      setExpForm({ purpose: '', amount: '', handled_by: '', expense_date: new Date().toISOString().split('T')[0], description: '', status: 'SPENT' });
      loadData();
    } catch (err) {
      alert('Failed to create expense');
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !fund) {
    return (
      <AdminLayout title="Admin Overview">
        <div className="py-12 text-center text-amber-300 animate-pulse">
          Loading Admin Dashboard Metrics...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Committee Control Dashboard">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl festive-glass border border-amber-500/20">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{fund.name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
          </h2>
          <p className="text-xs text-slate-400">UPI ID: <span className="font-mono text-amber-300">{fund.upi_id}</span></p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => setShowAddDonation(true)}
            className="flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold gold-button flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>+ Donation</span>
          </button>

          <button
            onClick={() => setShowAddExpense(true)}
            className="flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>+ Expense</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center shrink-0 active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        collected={fund.total_collected}
        target={fund.target_amount}
        percentage={fund.collection_percentage}
      />

      {/* Stat Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="COLLECTED"
          amount={fund.total_collected}
          subtitle={`${fund.verified_donations_count} verified`}
          icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
          variant="amber"
        />

        <StatCard
          title="TOTAL SPENT"
          amount={fund.total_spent}
          subtitle={`${fund.expenses_count} expenses`}
          icon={<ArrowDownLeft className="w-5 h-5 text-rose-400" />}
          variant="rose"
        />

        <StatCard
          title="PENDING COMMITMENTS"
          amount={fund.pending_expenses}
          subtitle="Planned expenses"
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
            Verify donor UPI details against bank statements
          </span>
        </div>

        {pendingDonations.length === 0 ? (
          <div className="p-6 sm:p-8 text-center bg-slate-900/50 rounded-2xl text-slate-400 text-xs sm:text-sm border border-slate-800">
            ✓ All donor submissions have been verified! No pending items in queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {pendingDonations.map((d) => (
              <div
                key={d.id}
                className="p-3.5 sm:p-4.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 relative shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-white text-sm sm:text-base truncate">
                        {d.donor_name}
                      </h4>
                      {!d.show_donor_name && (
                        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 font-medium">
                          Public Anonymous
                        </span>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80 text-[11px] sm:text-xs font-mono text-amber-300">
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
                  {d.description && <span className="italic truncate max-w-[160px] sm:max-w-[200px]">{d.description}</span>}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleVerify(d.id)}
                    className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 active:scale-[0.98] transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                    <span className="hidden sm:inline">Confirm & Verify</span>
                    <span className="inline sm:hidden">Verify</span>
                  </button>

                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleReject(d.id)}
                    className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 active:scale-[0.98] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-3xl border border-amber-500/30 p-6 text-white space-y-4">
            <h3 className="text-lg font-bold text-gold-gradient">Record Manual / Cash Donation</h3>
            <form onSubmit={handleAddDonationSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Donor Name *</label>
                <input
                  type="text"
                  required
                  value={donForm.donor_name}
                  onChange={(e) => setDonForm({ ...donForm, donor_name: e.target.value })}
                  placeholder="Enter donor name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={donForm.amount}
                  onChange={(e) => setDonForm({ ...donForm, amount: e.target.value })}
                  placeholder="5000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">UPI Ref / Cash Receipt *</label>
                <input
                  type="text"
                  required
                  value={donForm.upi_transaction_id}
                  onChange={(e) => setDonForm({ ...donForm, upi_transaction_id: e.target.value })}
                  placeholder="Enter transaction or receipt ID"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Purpose</label>
                <input
                  type="text"
                  value={donForm.description}
                  onChange={(e) => setDonForm({ ...donForm, description: e.target.value })}
                  placeholder="Enter note or description"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="donShowPublic"
                  checked={donForm.show_donor_name}
                  onChange={(e) => setDonForm({ ...donForm, show_donor_name: e.target.checked })}
                />
                <label htmlFor="donShowPublic" className="text-xs text-slate-300">Show name publicly</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDonation(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold gold-button text-xs"
                >
                  Save Verified Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-3xl border border-amber-500/30 p-6 text-white space-y-4">
            <h3 className="text-lg font-bold text-rose-300">Record Celebration Expense</h3>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Expense Purpose *</label>
                <input
                  type="text"
                  required
                  value={expForm.purpose}
                  onChange={(e) => setExpForm({ ...expForm, purpose: e.target.value })}
                  placeholder="Enter expense purpose"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={expForm.amount}
                  onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                  placeholder="8000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Handled / Managed By *</label>
                <input
                  type="text"
                  required
                  value={expForm.handled_by}
                  onChange={(e) => setExpForm({ ...expForm, handled_by: e.target.value })}
                  placeholder="Enter person name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Expense Status *</label>
                <select
                  value={expForm.status}
                  onChange={(e) => setExpForm({ ...expForm, status: e.target.value as 'SPENT' | 'PENDING' })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                >
                  <option value="SPENT">SPENT (Payment Completed)</option>
                  <option value="PENDING">PENDING (Planned / Committed)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="Additional bill / vendor details"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white text-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};
