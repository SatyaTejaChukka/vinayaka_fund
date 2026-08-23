import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Trash2, Copy, Check, AlertCircle, Loader2, Link2, ExternalLink } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { DetailSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { adminApi } from '../../services/api';
import type { FundConfig } from '../../types';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export const FundSettings: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();

  const [fund, setFund] = useState<FundConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false);

  // Slug live-check state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugReason, setSlugReason] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const [form, setForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    target_amount: 100000,
    upi_id: '',
    upi_name: '',
    public_slug: '',
    description: ''
  });

  const debouncedSlug = useDebounce(form.public_slug, 600);

  // Derive the public URL from slug
  const publicUrl = form.public_slug
    ? `${window.location.origin}/fund/${form.public_slug.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`
    : '';

  // Real-time slug availability check
  useEffect(() => {
    const slug = debouncedSlug.trim();
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      setSlugReason('');
      return;
    }

    // Skip check if slug hasn't changed from saved value (on edit mode)
    if (fund && fund.public_slug === slug) {
      setSlugStatus('available');
      setSlugReason('This is your current slug');
      return;
    }

    setSlugStatus('checking');
    setSlugReason('');

    adminApi.checkSlugAvailability(slug, fund?.id)
      .then((res) => {
        if (res.available) {
          setSlugStatus('available');
          setSlugReason('');
        } else {
          setSlugStatus('taken');
          setSlugReason(res.reason || 'Slug is already in use');
        }
      })
      .catch((err) => {
        const detail = err?.response?.data?.reason || err?.response?.data?.detail || '';
        setSlugStatus('invalid');
        setSlugReason(detail || 'Invalid slug format');
      });
  }, [debouncedSlug, fund]);

  const loadFund = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCurrentFund();
      setFund(data);
      setIsCreateMode(false);
      setForm({
        name: data.name,
        year: data.year,
        target_amount: data.target_amount,
        upi_id: data.upi_id,
        upi_name: data.upi_name,
        public_slug: data.public_slug,
        description: data.description || ''
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setFund(null);
        setIsCreateMode(true);
        setForm({
          name: 'Vinayaka Chavithi 2026',
          year: new Date().getFullYear(),
          target_amount: 100000,
          upi_id: 'vinayaka@upi',
          upi_name: 'Vinayaka Chavithi Committee',
          public_slug: 'vinayaka-chavithi-2026',
          description: ''
        });
      } else {
        toast.error('Failed to load fund settings from server');
        console.error('Failed to load fund settings:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFund();
  }, []);

  const handleSlugChange = (raw: string) => {
    setSlugStatus('idle');
    setForm({ ...form, public_slug: raw });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugStatus === 'taken' || slugStatus === 'invalid') {
      toast.error(slugReason || 'Please enter a valid, unique URL slug before saving.');
      return;
    }

    try {
      setSaving(true);

      if (fund && !isCreateMode) {
        await adminApi.updateFundDetails(fund.id, {
          name: form.name,
          year: form.year,
          target_amount: form.target_amount,
          upi_id: form.upi_id,
          upi_name: form.upi_name,
          public_slug: form.public_slug,
          description: form.description
        });
        toast.success('Fund settings updated successfully!');
      } else {
        await adminApi.createFund({
          name: form.name,
          year: form.year,
          target_amount: form.target_amount,
          upi_id: form.upi_id,
          upi_name: form.upi_name,
          public_slug: form.public_slug,
          description: form.description,
          is_active: true
        });
        toast.success('Fund created! Your public transparency page is now live.');
      }
      loadFund();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!fund) return;
    const confirmed = await confirm({
      title: 'Clear All Test Data?',
      message: '⚠️ Are you sure you want to delete ALL test donations and expenses?\n\nThis action cannot be undone. All verified and pending donation entries and expense records will be deleted.',
      confirmText: 'Yes, Delete All Data',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setClearing(true);
      const res = await adminApi.clearTestData(fund.id);
      toast.info(`Reset complete! ${res.donations_deleted} donations and ${res.expenses_deleted} expenses deleted.`);
      loadFund();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to clear test data');
    } finally {
      setClearing(false);
    }
  };

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      toast.success('Public URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const slugStatusIcon = () => {
    switch (slugStatus) {
      case 'checking': return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
      case 'available': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'taken': return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'invalid': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default: return null;
    }
  };

  const slugBorderColor = () => {
    switch (slugStatus) {
      case 'available': return 'border-emerald-500/60';
      case 'taken': return 'border-rose-500/60';
      case 'invalid': return 'border-orange-500/60';
      case 'checking': return 'border-amber-500/60';
      default: return 'border-slate-700';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Fund Settings">
        <DetailSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Fund Configuration & Settings">

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Public Link Preview Card (shown when slug is set) */}
        {publicUrl && (
          <div className="festive-glass rounded-2xl border border-emerald-500/30 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Your Public Transparency Link</p>
                <p className="text-xs font-mono text-emerald-300 truncate">{publicUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy public link"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-[11px] font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open public page"
                className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="festive-glass rounded-3xl border border-amber-500/30 p-6 sm:p-8 text-white space-y-6">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
            <div className="p-3 rounded-full festive-glass-gold text-amber-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gold-gradient">
                {isCreateMode ? 'Create Your Department Fund' : 'Fund & Payment Configuration'}
              </h2>
              <p className="text-xs text-slate-300">
                {isCreateMode
                  ? 'Set your unique public slug — this becomes your shareable transparency link.'
                  : 'Changes reflect instantly on your public transparency page.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Celebration / Fund Title *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Vinayaka Chavithi 2026 — ECE Department"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold focus:outline-none focus:border-amber-400 transition text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Celebration Year *
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2100}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value || '0', 10) || new Date().getFullYear() })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400 transition text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Collection Target (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-extrabold text-amber-400 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  Public URL Slug *
                  <span className="font-normal text-slate-500 text-[10px]">(letters, numbers, hyphens)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.public_slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g. ece-dept-fest-2026"
                    className={`w-full px-4 py-2.5 pr-9 rounded-xl bg-slate-900 border text-sm font-mono focus:outline-none transition text-white ${slugBorderColor()}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatusIcon()}
                  </div>
                </div>
                {/* Slug feedback */}
                {slugStatus === 'checking' && (
                  <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    Checking availability...
                  </p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-[10px] text-emerald-400 mt-1">
                    ✓ {slugReason || 'Slug is available!'}
                  </p>
                )}
                {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    ✗ {slugReason}
                  </p>
                )}
                {/* URL Preview */}
                {form.public_slug && slugStatus !== 'invalid' && (
                  <p className="text-[10px] text-slate-500 mt-1 font-mono truncate">
                    → /fund/{form.public_slug.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Committee UPI ID *
                </label>
                <input
                  type="text"
                  required
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  placeholder="committee@upi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-sm font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-400 transition"
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
                  placeholder="ECE Department Committee"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-sm focus:outline-none focus:border-amber-400 transition text-white"
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
                placeholder="Briefly describe the fund purpose visible to donors on your public page..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400 transition text-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving || slugStatus === 'taken' || slugStatus === 'invalid' || slugStatus === 'checking'}
              className="w-full py-3 sm:py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl active:scale-[0.98] transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{isCreateMode ? 'Creating Fund...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{isCreateMode ? 'Create Fund & Activate Public Link' : 'Save Configuration Changes'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Clear Test Data Card */}
        {!isCreateMode && (
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
              {clearing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Clearing Data...</>
              ) : (
                <><Trash2 className="w-4 h-4" /> Clear All Test Data</>
              )}
            </button>
          </div>
        )}

      </div>

    </AdminLayout>
  );
};
