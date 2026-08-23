import React, { useState } from 'react';
import { X, Banknote, Send } from 'lucide-react';
import { publicApi } from '../services/api';
import type { FundSummary } from '../types';

interface CashPayModalProps {
  fund: FundSummary;
  isOpen: boolean;
  onClose: () => void;
  onSuccessSubmitted: (data: {
    donorName: string;
    amount: number;
    studentYear: string;
    refId: string;
  }) => void;
}

export const CashPayModal: React.FC<CashPayModalProps> = ({
  fund,
  isOpen,
  onClose,
  onSuccessSubmitted
}) => {
  const [amountStr, setAmountStr] = useState<string>('500');
  const [donorName, setDonorName] = useState<string>('');
  const [studentYear, setStudentYear] = useState<string>('');
  const [handedTo, setHandedTo] = useState<string>('');
  const [donationDate, setDonationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showPublic, setShowPublic] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const parsedAmt = parseFloat(amountStr);
  const currentAmount = !isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : 0;

  const handlePresetClick = (presetAmt: number) => {
    setAmountStr(presetAmt.toString());
  };

  const handleSubmitCashDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!studentYear) {
      setErrorMsg('Please select your studying year (1st, 2nd, 3rd, or 4th Year)');
      return;
    }
    if (currentAmount <= 0) {
      setErrorMsg('Please enter a valid cash donation amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const refId = `CASH-${Date.now().toString().slice(-6)}`;
      await publicApi.submitDonation(fund.public_slug, {
        donor_name: donorName.trim(),
        amount: currentAmount,
        donation_date: donationDate,
        upi_transaction_id: refId,
        show_donor_name: showPublic,
        student_year: studentYear,
        description: handedTo.trim() ? `Direct Cash Handover (${handedTo.trim()})` : 'Direct Cash Handover'
      });

      const submissionInfo = {
        donorName: donorName.trim(),
        amount: currentAmount,
        studentYear,
        refId
      };

      // Reset form
      setDonorName('');
      setStudentYear('');
      setHandedTo('');

      // Close cash modal and trigger custom blessing modal
      onSuccessSubmitted(submissionInfo);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit cash donation details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col festive-glass rounded-3xl border border-amber-500/30 p-4 sm:p-6 text-white shadow-2xl overflow-hidden">
        
        {/* Sticky Top Header Bar with Close Button */}
        <div className="sticky top-0 z-30 flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20 bg-slate-950/90 -mt-1 -mx-1 px-2 pt-1 rounded-t-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-gold-gradient">
              Donate Cash to Committee
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-full bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 transition shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          <div className="text-center mb-4">
            <p className="text-xs text-slate-300">
              Hand cash directly to committee organizers & register receipt details
            </p>
          </div>

          <form onSubmit={handleSubmitCashDonation} className="space-y-4">
            {/* Preset Amounts */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-2">
                Select Cash Donation Amount
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2.5">
                {[100, 200, 500, 1000].map((presetAmt) => (
                  <button
                    key={presetAmt}
                    type="button"
                    onClick={() => handlePresetClick(presetAmt)}
                    className={`py-2 sm:py-2.5 px-1 rounded-xl font-bold text-xs sm:text-sm transition border active:scale-95 ${
                      currentAmount === presetAmt
                        ? 'gold-button border-amber-400'
                        : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:border-amber-500/40'
                    }`}
                  >
                    ₹{presetAmt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Enter custom cash amount"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-white font-bold focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Your Name / Donor Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                />
              </div>

              {/* Academic Year Selection */}
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1.5">
                  Select Studying Year / Role *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { label: '1st Year (I)', short: '1st Year (I)' },
                    { label: '2nd Year (II)', short: '2nd Year (II)' },
                    { label: '3rd Year (III)', short: '3rd Year (III)' },
                    { label: '4th Year (IV)', short: '4th Year (IV)' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setStudentYear(item.label)}
                      className={`py-2 px-1 rounded-xl font-bold text-xs transition border active:scale-95 text-center ${
                        studentYear === item.label
                          ? 'gold-button text-amber-950 border-amber-400 shadow-md'
                          : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      {item.short}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Cash Handed Over To (Committee Member Name)
                </label>
                <input
                  type="text"
                  value={handedTo}
                  onChange={(e) => setHandedTo(e.target.value)}
                  placeholder="e.g. Ramesh / Suresh / Committee Desk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Handover Date
                </label>
                <input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showPublicCash"
                  checked={showPublic}
                  onChange={(e) => setShowPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="showPublicCash" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Show my name publicly on verified donations register
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 sm:py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-xs sm:text-base shadow-lg disabled:opacity-50 active:scale-[0.98] transition"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Details...' : 'Submit Cash Contribution'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
