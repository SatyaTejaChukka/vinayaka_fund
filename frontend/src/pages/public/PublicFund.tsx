import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Heart, ArrowUpRight, ArrowDownLeft, 
  Wallet, CheckCircle2, Clock, Layers, Calendar,
  Download, GraduationCap, Sparkles, Filter, Banknote
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { UPIPayModal } from '../../components/UPIPayModal';
import { CashPayModal } from '../../components/CashPayModal';
import { PrintableQRPoster } from '../../components/PrintableQRPoster';
import { LogoMark } from '../../components/LogoMark';
import { TableSkeleton, CardSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv, type CsvColumn } from '../../utils/csvExporter';
import { publicApi } from '../../services/api';
import type { FundSummary, PublicDonation, PublicExpense } from '../../types';

const PUBLIC_ACADEMIC_YEARS = [
  'ALL_YEARS',
  '1st Year (I)',
  '2nd Year (II)',
  '3rd Year (III)',
  '4th Year (IV)',
  'Other / General'
];

export const PublicFund: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();

  const [fund, setFund] = useState<FundSummary | null>(null);
  const [donations, setDonations] = useState<PublicDonation[]>([]);
  const [expenses, setExpenses] = useState<PublicExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isDonateOpen, setIsDonateOpen] = useState<boolean>(false);
  const [isCashOpen, setIsCashOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'donations' | 'expenses'>('donations');
  const [selectedYear, setSelectedYear] = useState<string>('ALL_YEARS');

  const fetchFundData = async () => {
    if (!slug) {
      setError('Invalid public link. Please use a valid fund URL.');
      setLoading(false);
      return;
    }
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
      toast.error('Failed to load fund transparency data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundData();
  }, [slug]);

  const filteredDonations = donations.filter((d) => {
    if (selectedYear === 'ALL_YEARS') return true;
    if (selectedYear === 'Other / General') {
      return !d.student_year || d.student_year === 'Other' || d.student_year === 'General';
    }
    return d.student_year === selectedYear;
  });

  const handleExportDonationsCsv = () => {
    if (filteredDonations.length === 0) {
      toast.warning('No verified donations available to export.');
      return;
    }

    const columns: CsvColumn<PublicDonation>[] = [
      { header: 'ID', accessor: (d) => d.id },
      { header: 'Donor Name', accessor: (d) => d.donor_name },
      { header: 'Academic Year / Role', accessor: (d) => d.student_year || 'General / Unspecified' },
      { header: 'Amount (INR)', accessor: (d) => d.amount },
      { header: 'Donation Date', accessor: (d) => d.donation_date },
      { header: 'Status', accessor: (d) => d.status }
    ];

    const fileSlug = fund?.public_slug || 'vinayaka';
    exportToCsv(filteredDonations, columns, `${fileSlug}_verified_donations`);
    toast.success(`Exported ${filteredDonations.length} public donations to CSV!`);
  };

  const handleExportExpensesCsv = () => {
    if (expenses.length === 0) {
      toast.warning('No expenses available to export.');
      return;
    }

    const columns: CsvColumn<PublicExpense>[] = [
      { header: 'ID', accessor: (e) => e.id },
      { header: 'Expense Purpose', accessor: (e) => e.purpose },
      { header: 'Amount (INR)', accessor: (e) => e.amount },
      { header: 'Handled / Managed By', accessor: (e) => e.handled_by },
      { header: 'Expense Date', accessor: (e) => e.expense_date },
      { header: 'Status', accessor: (e) => e.status },
      { header: 'Description', accessor: (e) => e.description || '' }
    ];

    const fileSlug = fund?.public_slug || 'vinayaka';
    exportToCsv(expenses, columns, `${fileSlug}_public_expenses`);
    toast.success(`Exported ${expenses.length} expense records to CSV!`);
  };

  const formatINR = (val: number) => {
    const safeVal = Number.isFinite(val) ? val : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeVal);
  };

  if (loading) {
    return (
      <div className="min-h-screen festive-bg text-white flex flex-col p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between py-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
            <div className="w-48 h-6 bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-amber-500/20 rounded-xl animate-pulse" />
        </div>
        <CardSkeleton count={4} />
        <div className="p-8 rounded-3xl festive-glass border border-amber-500/20">
          <TableSkeleton rows={4} columns={4} />
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen festive-bg text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 max-w-md rounded-3xl festive-glass border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-rose-300">Fund Details Unavailable</h2>
          <p className="text-xs text-slate-300">{error || 'Could not find requested fund.'}</p>
          <button
            onClick={fetchFundData}
            className="px-6 py-2.5 rounded-xl font-bold gold-button text-sm active:scale-95 transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const safeCollectionPercentage = Number.isFinite(fund.collection_percentage) ? fund.collection_percentage : 0;
  const safeExpensePercentage = Number.isFinite(fund.expense_percentage) ? fund.expense_percentage : 0;

  return (
    <div className="min-h-screen festive-bg text-slate-100 flex flex-col pb-16 overflow-x-hidden w-full">
      {/* Top Navbar */}
      <Navbar
        slug={fund.public_slug}
        onOpenDonateModal={() => setIsDonateOpen(true)}
        onOpenCashModal={() => setIsCashOpen(true)}
        onOpenShareModal={() => setIsShareOpen(true)}
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8 flex-grow min-w-0">
        
        {/* Hero Header */}
        <section className="text-center space-y-3 relative max-w-full overflow-hidden px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full festive-glass-gold border border-amber-500/30 text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider max-w-full">
            <LogoMark className="w-5 h-5 diya-pulse shrink-0" />
            <span className="truncate">Official Transparency Dashboard</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gold-gradient tracking-tight px-2 leading-tight">
            {fund.name}
          </h1>

          {fund.description && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
              {fund.description}
            </p>
          )}
        </section>

        {/* Fund Collection Progress Bar (Prominent Full Width) */}
        <section>
          <ProgressBar
            title="Fund Collection Progress"
            badgeText="Live"
            badgeVariant="emerald"
            percentage={safeCollectionPercentage}
            target={fund.target_amount}
            collected={fund.total_collected}
            labelRight="Raised of Target"
            barColor="amber"
            onBarClick={() => {
              const el = document.getElementById('donations-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>

        {/* 3 Financial Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="TOTAL COLLECTED"
            amount={fund.total_collected}
            subtitle={`${fund.verified_donations_count} verified donations`}
            badge={`${safeCollectionPercentage}%`}
            icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
            variant="amber"
          />

          <StatCard
            title="TOTAL SPENT"
            amount={fund.total_spent}
            subtitle={`${fund.expenses_count} expenses recorded`}
            badge={`${safeExpensePercentage}% spent`}
            icon={<ArrowDownLeft className="w-5 h-5 text-rose-400" />}
            variant="rose"
          />

          <StatCard
            title="AVAILABLE BALANCE"
            amount={fund.available_balance}
            subtitle={`Committed balance after pending: ${formatINR(fund.committed_balance)}`}
            badge="Live"
            icon={<Wallet className="w-5 h-5 text-emerald-400" />}
            variant="emerald"
          />
        </section>

        {/* Fund Utilization Efficiency & Action Buttons Section */}
        <section className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl festive-glass border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
          
          {/* Left Column: Utilization Info & Mini Bar */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-400 block">
              Fund Utilization Efficiency
            </span>
            <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {formatINR(fund.total_spent)} spent from {formatINR(fund.total_collected)} collected
            </h3>
            <p className="text-xs text-slate-300">
              Pending expense commitments of <strong className="text-purple-300 font-bold">{formatINR(fund.pending_expenses)}</strong> planned for festival immersion & sanitation.
            </p>

            {/* Thin Progress Bar */}
            <div className="w-full h-2.5 sm:h-3 rounded-full bg-slate-950/90 p-0.5 border border-amber-500/30 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 shadow-inner"
                style={{
                  width: `${Math.min(100, Math.max(2, safeExpensePercentage))}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #ffb703 50%, #f43f5e 100%)'
                }}
              />
            </div>
          </div>

          {/* Right Column: Action Buttons (UPI QR, Cash, Shareable Flyer) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full lg:w-72">
            <button
              onClick={() => setIsDonateOpen(true)}
              className="w-full py-3 px-5 rounded-xl font-extrabold gold-button text-xs sm:text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-amber-950" />
              <span>Donate via UPI QR</span>
            </button>

            <button
              onClick={() => setIsCashOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Donate by Cash</span>
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl font-bold bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-500/30 text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Layers className="w-4 h-4" />
              <span>Get Shareable Flyer QR</span>
            </button>
          </div>

        </section>

        {/* Tabbed Transaction Register */}
        <section id="donations-section" className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl festive-glass border border-amber-500/30 space-y-4 sm:space-y-6 shadow-xl">
          
          {/* Tab Selector & Export Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-amber-500/20 pb-4 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('donations')}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  activeTab === 'donations'
                    ? 'gold-button text-amber-950 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Verified Donations ({donations.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  activeTab === 'expenses'
                    ? 'gold-button text-amber-950 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Expenses ({expenses.length})</span>
              </button>
            </div>

            {/* CSV Export Button for active tab */}
            <div className="flex items-center gap-2">
              {activeTab === 'donations' ? (
                <button
                  onClick={handleExportDonationsCsv}
                  disabled={filteredDonations.length === 0}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Donations CSV</span>
                </button>
              ) : (
                <button
                  onClick={handleExportExpensesCsv}
                  disabled={expenses.length === 0}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Expenses CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Academic Year Filter Pills (For Donations Tab) */}
          {activeTab === 'donations' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center gap-1 text-xs text-amber-300 font-bold shrink-0 mr-1">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Filter Batch:</span>
              </div>
              {PUBLIC_ACADEMIC_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition active:scale-95 ${
                    selectedYear === year
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {year === 'ALL_YEARS' ? 'All Batches' : year}
                </button>
              ))}
            </div>
          )}

          {/* Donations Tab View */}
          {activeTab === 'donations' && (
            <div className="space-y-4">
              {filteredDonations.length === 0 ? (
                <EmptyState
                  icon={Filter}
                  emoji="🙏"
                  title="No Donations in this Category"
                  description={
                    selectedYear !== 'ALL_YEARS'
                      ? `No verified donations found for "${selectedYear}".`
                      : 'No verified donations recorded yet. Be the first to contribute!'
                  }
                  actionText={selectedYear !== 'ALL_YEARS' ? 'Show All Batches' : undefined}
                  onAction={selectedYear !== 'ALL_YEARS' ? () => setSelectedYear('ALL_YEARS') : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDonations.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-amber-500/20 hover:border-amber-500/40 transition space-y-2 relative overflow-hidden shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-white text-sm sm:text-base break-words block truncate">
                            {d.donor_name}
                          </span>
                          {d.student_year && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 inline-block mt-1">
                              🎓 {d.student_year}
                            </span>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
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
                <EmptyState
                  icon={Wallet}
                  emoji="📋"
                  title="No Expenses Documented"
                  description="All celebration expenses (idol, flowers, sound, lighting, prasadam) will be publicly accounted for here."
                />
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
        <p className="flex items-center justify-center gap-1.5">
          <LogoMark className="w-4 h-4" />
          <span>Vinayaka Chavithi Fund Transparency Portal • Built for Zero-Commission Community Trust</span>
        </p>
      </footer>

      {/* UPI Payment Modal */}
      <UPIPayModal
        fund={fund}
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        onSuccessSubmitted={fetchFundData}
      />

      {/* Cash Payment Modal */}
      <CashPayModal
        fund={fund}
        isOpen={isCashOpen}
        onClose={() => setIsCashOpen(false)}
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
