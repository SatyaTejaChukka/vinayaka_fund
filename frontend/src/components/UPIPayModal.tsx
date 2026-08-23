import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, CheckCircle2, Send } from 'lucide-react';
import { publicApi } from '../services/api';
import type { FundSummary } from '../types';
import { LogoMark } from './LogoMark';

interface UPIPayModalProps {
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

export const UPIPayModal: React.FC<UPIPayModalProps> = ({
  fund,
  isOpen,
  onClose,
  onSuccessSubmitted
}) => {
  const [amountStr, setAmountStr] = useState<string>('500');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [donorName, setDonorName] = useState<string>('');
  const [studentYear, setStudentYear] = useState<string>('');
  const [upiRefId, setUpiRefId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showPublic, setShowPublic] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const parsedAmt = parseFloat(amountStr);
  const currentAmount = !isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : 0;
  
  // NPCI Compliant UPI Deep Link Construction (pa parameter requires literal '@')
  const cleanUpiId = fund.upi_id.trim();
  const cleanUpiName = encodeURIComponent(fund.upi_name.trim());
  const cleanNote = encodeURIComponent(`${fund.name} Donation`.trim());
  const amtStr = currentAmount > 0 ? currentAmount.toFixed(2) : '';

  const upiUri = `upi://pay?pa=${cleanUpiId}&pn=${cleanUpiName}&am=${amtStr}&cu=INR&tn=${cleanNote}`;

  const handlePresetClick = (amount: number) => {
    setAmountStr(amount.toString());
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(fund.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!upiRefId.trim()) {
      setErrorMsg('Please enter the UPI Transaction Reference ID from GPay/PhonePe');
      return;
    }
    if (currentAmount <= 0) {
      setErrorMsg('Please enter a valid donation amount');
      return;
    }

    const resolvedYear = studentYear.trim() || 'Other / General';

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await publicApi.submitDonation(fund.public_slug, {
        donor_name: donorName.trim(),
        amount: currentAmount,
        donation_date: paymentDate,
        upi_transaction_id: upiRefId.trim(),
        show_donor_name: showPublic,
        student_year: resolvedYear
      });

      const submissionInfo = {
        donorName: donorName.trim(),
        amount: currentAmount,
        studentYear: resolvedYear,
        refId: upiRefId.trim()
      };

      // Reset form
      setDonorName('');
      setStudentYear('');
      setUpiRefId('');
      setShowSubmissionForm(false);

      // Close UPI modal and trigger custom blessing modal
      onSuccessSubmitted(submissionInfo);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit transaction details. Please try again.');
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
            <LogoMark className="w-7 h-7 diya-pulse" />
            <h2 className="text-base sm:text-lg font-extrabold text-gold-gradient">
              Donate by UPI
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
              Zero commission direct UPI payment to committee account
            </p>
          </div>

          {!showSubmissionForm ? (
            <div className="space-y-5">
              {/* Amount Preset Chips */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-2">
                  1. Select Donation Amount
                </label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetClick(amt)}
                      className={`py-2 sm:py-2.5 px-1 rounded-xl font-bold text-xs sm:text-sm transition border active:scale-95 ${
                        currentAmount === amt
                          ? 'gold-button border-amber-400'
                          : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:border-amber-500/40'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-white font-bold focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-4 sm:p-5 rounded-2xl festive-glass-gold border border-amber-500/30 text-center flex flex-col items-center">
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
                  2. Scan QR or Copy UPI ID
                </span>
                
                <div className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-inner mb-3">
                  <QRCodeSVG
                    value={upiUri}
                    size={150}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <p className="text-xs text-amber-200/90 font-medium mb-3">
                  Paying: <span className="font-extrabold text-white text-sm sm:text-base">₹{currentAmount.toLocaleString('en-IN')}</span>
                </p>

                {/* UPI ID Copy Bar */}
                <div className="w-full p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 flex items-center justify-between text-xs gap-1">
                  <div className="truncate text-slate-300 font-mono text-[11px] sm:text-xs">
                    UPI ID: <span className="font-bold text-amber-300">{fund.upi_id}</span>
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 hover:bg-amber-500/30 transition flex items-center gap-1 shrink-0 text-xs"
                  >
                    {copiedUpi ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transition Button */}
              <button
                type="button"
                onClick={() => setShowSubmissionForm(true)}
                className="w-full py-3 sm:py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-xs sm:text-base active:scale-[0.98] transition"
              >
                <span>3. I Have Completed Payment ➔</span>
              </button>
            </div>
          ) : (
            /* Submission Details Form */
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                Submit payment details so committee admins can verify your transaction and update the live public counter.
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              {/* Academic Year Checklist / Role Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-300">
                    Select Studying Year / Role
                  </label>
                  <span className="text-[10px] text-slate-400">Optional (Default: Other / Faculty)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { label: '1st Year (I)', short: '1st Year (I)' },
                    { label: '2nd Year (II)', short: '2nd Year (II)' },
                    { label: '3rd Year (III)', short: '3rd Year (III)' },
                    { label: '4th Year (IV)', short: '4th Year (IV)' },
                    { label: 'Other / General', short: 'Other / Faculty' },
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
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  UPI Reference / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  value={upiRefId}
                  onChange={(e) => setUpiRefId(e.target.value)}
                  placeholder="Enter the transaction ID"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showPublic"
                  checked={showPublic}
                  onChange={(e) => setShowPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="showPublic" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Show my name publicly on verified donations list
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmissionForm(false)}
                  className="w-1/3 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
