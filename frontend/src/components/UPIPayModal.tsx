import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { X, Copy, CheckCircle2, Send, Smartphone, ExternalLink } from 'lucide-react';
import { publicApi } from '../services/api';
import type { FundSummary } from '../types';

interface UPIPayModalProps {
  fund: FundSummary;
  isOpen: boolean;
  onClose: () => void;
  onSuccessSubmitted: () => void;
}

export const UPIPayModal: React.FC<UPIPayModalProps> = ({
  fund,
  isOpen,
  onClose,
  onSuccessSubmitted
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmountStr, setCustomAmountStr] = useState<string>('500');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Form State
  const [donorName, setDonorName] = useState<string>('');
  const [upiRefId, setUpiRefId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showPublic, setShowPublic] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentAmount = selectedAmount > 0 ? selectedAmount : parseFloat(customAmountStr) || 0;
  const upiUri = `upi://pay?pa=${encodeURIComponent(fund.upi_id)}&pn=${encodeURIComponent(fund.upi_name)}&am=${currentAmount > 0 ? currentAmount.toFixed(2) : ''}&cu=INR&tn=${encodeURIComponent(fund.name + ' Donation')}`;

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmountStr(amount.toString());
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

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await publicApi.submitDonation(fund.public_slug, {
        donor_name: donorName.trim(),
        amount: currentAmount,
        donation_date: paymentDate,
        upi_transaction_id: upiRefId.trim(),
        show_donor_name: showPublic
      });

      setSubmittedSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      onSuccessSubmitted();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit transaction details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg festive-glass rounded-3xl border border-amber-500/30 p-6 sm:p-8 my-8 text-white shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!submittedSuccess ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-gold-gradient">
                Support Vinayaka Chavithi Fund
              </h2>
              <p className="text-xs text-slate-300 mt-1">
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
                          selectedAmount === amt
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
                      value={customAmountStr}
                      onChange={(e) => {
                        setCustomAmountStr(e.target.value);
                        setSelectedAmount(0);
                      }}
                      placeholder="Enter custom amount"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-white font-bold focus:outline-none focus:border-amber-400 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="p-4 sm:p-5 rounded-2xl festive-glass-gold border border-amber-500/30 text-center flex flex-col items-center">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
                    2. Scan QR or Tap Pay Button
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

                  {/* Direct Mobile Pay Button */}
                  <a
                    href={upiUri}
                    className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-extrabold bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:brightness-110 active:scale-[0.98] shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm uppercase tracking-wide transition border border-emerald-300/40 mb-3"
                  >
                    <Smartphone className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>Pay via UPI app</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  </a>

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
                    placeholder="e.g. Ravi Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={customAmountStr}
                    onChange={(e) => setCustomAmountStr(e.target.value)}
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
                    placeholder="e.g. 423981290312"
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
          </>
        ) : (
          /* Success Receipt Card */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">
              Thank You for Your Devotion!
            </h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              Your donation entry for <span className="font-bold text-amber-300">₹{currentAmount.toLocaleString('en-IN')}</span> has been submitted to the committee.
            </p>
            <div className="p-4 rounded-2xl festive-glass border border-emerald-500/30 text-xs text-emerald-200 text-left space-y-1">
              <p><span className="font-bold text-white">Status:</span> PENDING ADMIN VERIFICATION</p>
              <p><span className="font-bold text-white">Donor:</span> {showPublic ? donorName : 'Anonymous (Publicly masked)'}</p>
              <p><span className="font-bold text-white">Ref ID:</span> {upiRefId}</p>
            </div>
            <p className="text-xs text-slate-400">
              Once verified by admin against bank statements, your transaction will immediately reflect in the total collection counter.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold gold-button text-sm"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
