import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Trash2 } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { adminApi, publicApi } from '../../services/api';
import type { FundSummary } from '../../types';

export const FundSettings: React.FC = () => {
  const [fund, setFund] = useState<FundSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    target_amount: 100000,
    upi_id: '',
    upi_name: '',
    public_slug: '',
    description: ''
  });

  const loadFund = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getFundSummary('vinayaka-chavithi-2026');
      setFund(data);
      setForm({
        name: data.name,
        target_amount: data.target_amount,
        upi_id: data.upi_id,
        upi_name: data.upi_name,
        public_slug: data.public_slug,
        description: data.description || ''
      });
    } catch (err) {
      console.error('Failed to load fund settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFund();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund) return;
    try {
      setSaving(true);
      setSuccessMsg('');
      await adminApi.updateFundDetails(fund.id, form);
      setSuccessMsg('Fund settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadFund();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!fund) return;
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete ALL test donations and expenses?\n\nThis action cannot be undone. All verified and pending donation entries and expense records will be deleted.'
    );
    if (!confirmed) return;

    try {
      setClearing(true);
      setSuccessMsg('');
      const res = await adminApi.clearTestData(fund.id);
      setSuccessMsg(`Data reset complete! ${res.donations_deleted} donations and ${res.expenses_deleted} expenses deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadFund();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to clear test data');
    } finally {
      setClearing(false);
    }
  };

  if (loading || !fund) {
    return (
      <AdminLayout title="Fund Settings">
        <div className="py-12 text-center text-amber-300 animate-pulse">
          Loading Fund Configuration...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Fund Configuration & Settings">
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="festive-glass rounded-3xl border border-amber-500/30 p-6 sm:p-8 text-white space-y-6">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
            <div className="p-3 rounded-full festive-glass-gold text-amber-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gold-gradient">Festival Celebration Target & UPI QR Setup</h2>
              <p className="text-xs text-slate-300">Changes immediately reflect on the public transparency page.</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Celebration Fund Title *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Collection Target Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-extrabold text-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Public URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={form.public_slug}
                  onChange={(e) => setForm({ ...form, public_slug: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Committee UPI ID (For Direct Payments) *
                </label>
                <input
                  type="text"
                  required
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  placeholder="vinayaka@upi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-sm font-mono text-amber-300 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Committee Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.upi_name}
                  onChange={(e) => setForm({ ...form, upi_name: e.target.value })}
                  placeholder="Vinayaka Chavithi Committee"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Public Description & Announcements
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 sm:py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl active:scale-[0.98] transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
            </button>
          </form>
        </div>

        {/* Clear Test Data Card */}
        <div className="festive-glass rounded-3xl border border-rose-500/30 p-6 text-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-300">Clear All Test Donations & Expenses</h3>
              <p className="text-xs text-slate-300">Delete all test donation entries and expense records to start fresh for official launch.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearData}
            disabled={clearing}
            className="w-full py-2.5 rounded-xl font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{clearing ? 'Clearing Data...' : 'Clear All Test Data'}</span>
          </button>
        </div>

      </div>

    </AdminLayout>
  );
};
