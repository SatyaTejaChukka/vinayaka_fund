import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { adminApi, publicApi } from '../../services/api';
import type { FundSummary } from '../../types';

export const FundSettings: React.FC = () => {
  const [fund, setFund] = useState<FundSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
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
      
      <div className="max-w-2xl mx-auto festive-glass rounded-3xl border border-amber-500/30 p-8 text-white space-y-6">
        
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
            className="w-full py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-sm shadow-xl pt-3"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
          </button>
        </form>

      </div>

    </AdminLayout>
  );
};
