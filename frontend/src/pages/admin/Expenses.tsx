import React, { useEffect, useState } from 'react';
import { Search, PlusCircle } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { adminApi, publicApi } from '../../services/api';
import type { AdminExpense, FundSummary } from '../../types';

export const AdminExpenses: React.FC = () => {
  const [fund, setFund] = useState<FundSummary | null>(null);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  const [expForm, setExpForm] = useState({
    purpose: '',
    amount: '',
    handled_by: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'SPENT' as 'SPENT' | 'PENDING'
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const summary = await publicApi.getFundSummary('vinayaka-chavithi-2026');
      setFund(summary);

      const list = await adminApi.getAdminExpenses(
        summary.id,
        activeFilter === 'ALL' ? undefined : activeFilter
      );
      setExpenses(list);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeFilter]);

  const handleMarkSpent = async (id: number) => {
    try {
      await adminApi.markExpenseSpent(id);
      loadExpenses();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
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
      loadExpenses();
    } catch (err) {
      alert('Failed to record expense');
    }
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingId || !voidReason.trim()) return;
    try {
      await adminApi.voidExpense(voidingId, voidReason.trim());
      setVoidingId(null);
      setVoidReason('');
      loadExpenses();
    } catch (err) {
      alert('Failed to void expense');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.purpose.toLowerCase().includes(term) ||
      e.handled_by.toLowerCase().includes(term) ||
      (e.description && e.description.toLowerCase().includes(term))
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
    <AdminLayout title="Expense Tracker & Commitments">
      
      {/* Header Controls */}
      <div className="p-4 rounded-2xl festive-glass border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search purpose, handler name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'SPENT', 'VOIDED'].map((filter) => (
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
            onClick={() => setShowAddExpense(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs flex items-center gap-1.5 shrink-0 active:scale-95 ml-auto sm:ml-2"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>+ Add Expense</span>
          </button>
        </div>

      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl festive-glass border border-amber-500/20 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-12 text-center text-amber-300 text-sm animate-pulse">
            Loading Expense Records...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No expenses found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-amber-500/20 text-slate-300 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Handled By</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{e.purpose}</div>
                      {e.description && <div className="text-[11px] text-slate-400">{e.description}</div>}
                    </td>

                    <td className="p-4 font-extrabold text-rose-400 text-sm">
                      {formatINR(e.amount)}
                    </td>

                    <td className="p-4 text-slate-300 font-semibold">
                      {e.handled_by}
                    </td>

                    <td className="p-4 text-slate-400">
                      {e.expense_date}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        e.status === 'SPENT'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : e.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {e.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {e.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkSpent(e.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 hover:bg-emerald-500/30 text-[11px]"
                        >
                          Mark Spent
                        </button>
                      )}

                      {e.status !== 'VOIDED' && (
                        <button
                          onClick={() => setVoidingId(e.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 border border-slate-700 text-[11px] font-bold"
                        >
                          Void
                        </button>
                      )}

                      {e.status === 'VOIDED' && (
                        <span className="text-[10px] text-rose-400 italic">
                          Reason: {e.void_reason || 'N/A'}
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

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-3xl border border-amber-500/30 p-6 text-white space-y-4">
            <h3 className="text-lg font-bold text-rose-300">Record Celebration Expense</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
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
                  placeholder="Vendor name or bill notes"
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md festive-glass rounded-3xl border border-rose-500/30 p-6 text-white space-y-4">
            <h3 className="text-lg font-bold text-rose-300">Void Expense Record #{voidingId}</h3>
            <form onSubmit={handleVoidSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Voiding *</label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Vendor booking cancelled"
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
