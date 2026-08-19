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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddDonation(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold gold-button flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Donation</span>
          </button>

          <button
            onClick={() => setShowAddExpense(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
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
      <div className="p-6 rounded-3xl festive-glass border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Pending Donation Verification Queue
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingDonations.length} Pending
            </span>
          </div>

          <span className="text-xs text-slate-400">
            Verify donor UPI details against bank credits
          </span>
        </div>

        {pendingDonations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl text-slate-400 text-sm border border-slate-800">
            ✓ All donor submissions have been verified! No pending items in queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDonations.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-3 relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-white text-base">
                      {d.donor_name}
                      {!d.show_donor_name && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Public Anonymous</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400">
                      UPI Ref: <span className="font-mono font-bold text-amber-300">{d.upi_transaction_id || 'N/A'}</span>
                    </p>
                  </div>

                  <span className="text-xl font-extrabold text-amber-400">
                    {formatINR(d.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                  <span>Submitted: {d.donation_date}</span>
                  {d.description && <span className="italic truncate max-w-[180px]">{d.description}</span>}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleVerify(d.id)}
                    className="w-1/2 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Verify</span>
                  </button>

                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleReject(d.id)}
                    className="w-1/2 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
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
                  placeholder="e.g. Suresh Kumar"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Purpose</label>
                <input
                  type="text"
                  value={donForm.description}
                  onChange={(e) => setDonForm({ ...donForm, description: e.target.value })}
                  placeholder="e.g. Laddu prasadam sponsor"
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
                  placeholder="e.g. Flower Decoration & Lights"
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
                  placeholder="e.g. Suresh Kumar"
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
