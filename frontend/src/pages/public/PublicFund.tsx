import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Heart, ArrowUpRight, ArrowDownLeft, 
  Wallet, CheckCircle2, Clock, Layers, Calendar
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { UPIPayModal } from '../../components/UPIPayModal';
import { PrintableQRPoster } from '../../components/PrintableQRPoster';
import { publicApi } from '../../services/api';
import type { FundSummary, PublicDonation, PublicExpense } from '../../types';

export const PublicFund: React.FC = () => {
  const { slug = 'vinayaka-chavithi-2026' } = useParams<{ slug: string }>();

  const [fund, setFund] = useState<FundSummary | null>(null);
  const [donations, setDonations] = useState<PublicDonation[]>([]);
  const [expenses, setExpenses] = useState<PublicExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isDonateOpen, setIsDonateOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'donations' | 'expenses'>('donations');

  const fetchFundData = async () => {
    try {
      setLoading(true);
      setError('');
      const [summaryRes, donRes, expRes] = await Promise.all([
        publicApi.getFundSummary(slug),
        publicApi.getVerifiedDonations(slug),
        publicApi.getExpenses(slug)
      ]);
      setFund(summaryRes);
      setDonations(donRes);
      setExpenses(expRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load transparency details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundData();
  }, [slug]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen festive-bg text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full festive-glass-gold flex items-center justify-center text-4xl diya-pulse mb-4">
          🪔
        </div>
        <p className="text-amber-300 font-bold animate-pulse text-lg">
          Loading Vinayaka Chavithi Transparency Portal...
        </p>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen festive-bg text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 max-w-md rounded-3xl festive-glass border border-rose-500/30 text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-rose-300">Fund Details Unavailable</h2>
          <p className="text-xs text-slate-300">{error || 'Could not find requested fund.'}</p>
          <button
            onClick={fetchFundData}
            className="px-6 py-2.5 rounded-xl font-bold gold-button text-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen festive-bg text-slate-100 flex flex-col pb-16 overflow-x-hidden w-full">
      {/* Top Navbar */}
      <Navbar
        slug={fund.public_slug}
        onOpenDonateModal={() => setIsDonateOpen(true)}
        onOpenShareModal={() => setIsShareOpen(true)}
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8 flex-grow min-w-0">
        
        {/* Hero Header */}
        <section className="text-center space-y-3 relative max-w-full overflow-hidden px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full festive-glass-gold border border-amber-500/30 text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider max-w-full">
            <span className="diya-pulse shrink-0">🪔</span>
            <span className="truncate">Official Transparency Dashboard</span>
          </div>

          <h1 className="text-2xl sm:text-5xl font-black text-white tracking-tight break-words">
            {fund.name}
          </h1>

          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto">
            {fund.description || 'Every rupee collected and every rupee spent is visible to the public.'}
          </p>

        </section>

        {/* Collection Target Progress Bar */}
        <section>
          <ProgressBar
            collected={fund.total_collected}
            target={fund.target_amount}
            percentage={fund.collection_percentage}
            onBarClick={() => {
              setActiveTab('donations');
              document.getElementById('donations-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>

        {/* Financial Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="TOTAL COLLECTED"
            amount={fund.total_collected}
            subtitle={`${fund.verified_donations_count} verified donations`}
            icon={<ArrowUpRight className="w-6 h-6 text-amber-400" />}
            variant="amber"
            badge={`${fund.collection_percentage}%`}
          />

          <StatCard
            title="TOTAL SPENT"
            amount={fund.total_spent}
            subtitle={`${fund.expenses_count} expenses recorded`}
            icon={<ArrowDownLeft className="w-6 h-6 text-rose-400" />}
            variant="rose"
            badge={`${fund.expense_percentage}% spent`}
          />

          <StatCard
            title="AVAILABLE BALANCE"
            amount={fund.available_balance}
            subtitle={`Committed balance after pending: ${formatINR(fund.committed_balance)}`}
            icon={<Wallet className="w-6 h-6 text-emerald-400" />}
            variant="emerald"
            badge="Live"
          />
        </section>

        {/* Fund Utilization Progress & Breakdown */}
        <section className="p-4 sm:p-6 rounded-2xl festive-glass border border-amber-500/20 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-center">
          <div className="lg:col-span-2 space-y-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
              Fund Utilization Efficiency
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {formatINR(fund.total_spent)} spent from {formatINR(fund.total_collected)} collected
            </h3>
            <p className="text-xs text-slate-300">
              Pending expense commitments of <span className="font-bold text-amber-300">{formatINR(fund.pending_expenses)}</span> planned for festival immersion & sanitation.
            </p>

            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-700/50 mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 transition-all duration-700"
                style={{ width: `${Math.min(100, fund.expense_percentage)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 sm:gap-3 justify-center">
            <button
              onClick={() => setIsDonateOpen(true)}
              className="py-3 px-5 sm:py-3.5 sm:px-6 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl"
            >
              <Heart className="w-4 h-4 fill-amber-950" />
              <span>Donate via UPI QR</span>
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="py-2.5 px-5 sm:py-3 sm:px-6 rounded-xl font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs sm:text-sm flex items-center justify-center gap-2 transition"
            >
              <Layers className="w-4 h-4" />
              <span>Get Shareable Flyer QR</span>
            </button>
          </div>
        </section>

        {/* Tabbed Transaction Register */}
        <section id="donations-section" className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl festive-glass border border-amber-500/30 space-y-4 sm:space-y-6">
          
          {/* Tab Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/20 pb-3 gap-2">
            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('donations')}
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  activeTab === 'donations'
                    ? 'gold-button text-amber-950 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Donations ({donations.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  activeTab === 'expenses'
                    ? 'gold-button text-amber-950 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Expenses ({expenses.length})</span>
              </button>
            </div>

            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
              Only verified transactions are publicly listed
            </span>
          </div>

          {/* Donations Tab View */}
          {activeTab === 'donations' && (
            <div className="space-y-4">
              {donations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No verified donations recorded yet. Be the first to contribute!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {donations.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-amber-500/20 hover:border-amber-500/40 transition space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm sm:text-base break-words pr-2">
                          {d.donor_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xl font-extrabold text-amber-400">
                          {formatINR(d.amount)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {d.donation_date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expenses Tab View */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No expenses recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenses.map((e) => (
                    <div
                      key={e.id}
                      className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:border-amber-500/30 transition space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug break-words">{e.purpose}</h4>
                          {e.description && (
                            <p className="text-xs text-slate-300 leading-relaxed mt-1">{e.description}</p>
                          )}
                        </div>

                        <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-extrabold border shrink-0 inline-flex items-center gap-1 ${
                          e.status === 'SPENT'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {e.status === 'SPENT' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>SPENT</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>PENDING</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs gap-2">
                        <span className="text-base sm:text-lg font-black text-rose-400">
                          {formatINR(e.amount)}
                        </span>
                        <div className="text-slate-400 text-right text-xs sm:text-sm">
                          <p>Handled by: <span className="text-white font-bold">{e.handled_by}</span></p>
                          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">{e.expense_date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-500 py-6 border-t border-amber-500/10">
        <p>🪔 Vinayaka Chavithi Fund Transparency Portal • Built for Zero-Commission Community Trust</p>
      </footer>

      {/* UPI Payment Modal */}
      <UPIPayModal
        fund={fund}
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        onSuccessSubmitted={fetchFundData}
      />

      {/* Printable Poster Flyer Modal */}
      <PrintableQRPoster
        fund={fund}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
