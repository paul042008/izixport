// src/pages/onboarding/ExporterStep2.tsx
// FIXED - Redirect works properly, added bank_name field

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import {
  verifyCACNumber,
  verifyNINNumber,
  CACResult,
  NINResult,
} from '@/lib/dojah';
import {
  Building2,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#006B3F',
  primaryDark: '#004D2E',
  primaryLight: '#E6F2ED',
  accent: '#D4A843',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

interface Bank {
  id: number;
  code: string;
  name: string;
}

const STATIC_BANKS: Bank[] = [
  { id: 1, code: '044', name: 'Access Bank' },
  { id: 2, code: '058', name: 'GTBank' },
  { id: 3, code: '011', name: 'First Bank' },
  { id: 4, code: '221', name: 'Stanbic IBTC Bank' },
  { id: 5, code: '068', name: 'Standard Chartered Bank' },
  { id: 6, code: '032', name: 'Union Bank' },
  { id: 7, code: '033', name: 'United Bank for Africa (UBA)' },
  { id: 8, code: '215', name: 'Unity Bank' },
  { id: 9, code: '035', name: 'Wema Bank' },
  { id: 10, code: '057', name: 'Zenith Bank' },
  { id: 11, code: '082', name: 'Keystone Bank' },
  { id: 12, code: '101', name: 'Providus Bank' },
  { id: 13, code: '232', name: 'Sterling Bank' },
  { id: 14, code: '070', name: 'Fidelity Bank' },
  { id: 15, code: '030', name: 'Heritage Bank' },
  { id: 16, code: '301', name: 'Jaiz Bank' },
  { id: 17, code: '050', name: 'Ecobank Nigeria' },
  { id: 18, code: '084', name: 'Enterprise Bank' },
  { id: 19, code: '214', name: 'First City Monument Bank (FCMB)' },
  { id: 20, code: '304', name: 'Polaris Bank' },
  { id: 21, code: '103', name: 'Titan Trust Bank' },
  { id: 22, code: '50211', name: 'Opay' },
  { id: 23, code: '50204', name: 'Moniepoint' },
  { id: 24, code: '400001', name: 'Palmpay' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function ExporterStep2() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CAC
  const [cacInput, setCacInput] = useState('');
  const [cacResult, setCacResult] = useState<CACResult | null>(null);
  const [cacLoading, setCacLoading] = useState(false);

  // NIN
  const [ninInput, setNinInput] = useState('');
  const [showNIN, setShowNIN] = useState(false);
  const [ninResult, setNinResult] = useState<NINResult | null>(null);
  const [ninLoading, setNinLoading] = useState(false);

  // Documents
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [nepcFile, setNepcFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dojahOffline, setDojahOffline] = useState(false);

  // Bank details
  const [banks] = useState<Bank[]>(STATIC_BANKS);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset bank verified state when inputs change
  useEffect(() => {
    setBankVerified(false);
    setAccountName('');
    setBankError('');
  }, [bankCode, accountNumber]);

  useEffect(() => {
    if (cacResult) setCacResult(null);
  }, [cacInput]);

  useEffect(() => {
    if (ninResult) setNinResult(null);
  }, [ninInput]);

  const handleCACVerify = async () => {
    if (!cacInput.trim()) return;
    setCacLoading(true);
    const result = await verifyCACNumber(cacInput);
    setCacResult(result);
    setCacLoading(false);

    if (!result.verified) {
      toast.error(result.error || 'CAC verification failed');
    }
    if (result.error?.includes('Network') || result.error?.includes('fetch')) {
      setDojahOffline(true);
    }
  };

  const handleNINVerify = async () => {
    if (!ninInput.trim()) return;
    setNinLoading(true);
    const result = await verifyNINNumber(ninInput);
    setNinResult(result);
    setNinLoading(false);

    if (!result.verified) {
      toast.error(result.error || 'NIN verification failed');
    }
    if (result.error?.includes('Network') || result.error?.includes('fetch')) {
      setDojahOffline(true);
    }
  };

  const handleBankVerify = async () => {
    if (!bankCode || !accountNumber) {
      toast.error('Select a bank and enter an account number.');
      return;
    }
    setBankLoading(true);
    setBankError('');
    try {
      const { data, error } = await supabase.functions.invoke(
        'resolve-bank-account',
        {
          body: { bank_code: bankCode, account_number: accountNumber },
        }
      );
      if (error) throw error;
      if (data.account_name) {
        setAccountName(data.account_name);
        setBankVerified(true);
        toast.success('Account verified!');
      } else {
        throw new Error('Could not resolve account name.');
      }
    } catch (err: any) {
      setBankError(err.message || 'Verification failed.');
      setBankVerified(false);
    } finally {
      setBankLoading(false);
    }
  };

  const handleFileSelect = (
    type: 'cac' | 'nepc',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    if (type === 'cac') setCacFile(file);
    else setNepcFile(file);
  };

  const uploadFile = async (file: File, userId: string, prefix: string) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('verifications')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('verifications')
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  // ─── FIXED: handleSubmit with proper redirect ───
  const handleSubmit = async () => {
    const canSubmitManually =
      cacFile !== null &&
      (!cacResult?.verified || !ninResult?.verified) &&
      dojahOffline;

    const normalSubmission =
      cacResult?.verified && ninResult?.verified && cacFile;

    if (!bankVerified) {
      toast.error('Please verify your bank account before submitting.');
      return;
    }

    if (!normalSubmission && !canSubmitManually) {
      toast.error('Complete all required steps first.');
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      // Upload CAC document
      const cacUrl = await uploadFile(cacFile!, userId, 'cac');
      let nepcUrl: string | null = null;
      if (nepcFile) {
        nepcUrl = await uploadFile(nepcFile, userId, 'nepc');
      }

      // Build verification record
      const verificationData: any = {
        user_id: userId,
        cac_document_url: cacUrl,
        nepc_document_url: nepcUrl,
        status: 'under_review',
      };

      if (normalSubmission) {
        verificationData.cac_number = cacResult!.rc_number;
        verificationData.cac_verified = true;
        verificationData.cac_company_name = cacResult!.company_name;
        verificationData.cac_company_type = cacResult!.company_type;
        verificationData.cac_registration_date = cacResult!.registration_date;
        verificationData.cac_verification_result = cacResult!.raw;
        verificationData.nin_verified = true;
      } else {
        verificationData.cac_verified = false;
        verificationData.nin_verified = false;
        verificationData.status = 'pending_manual_review';
        verificationData.admin_notes =
          'Dojah unavailable during registration – manual review needed';
      }

      const { error: verError } = await supabase
        .from('verifications')
        .insert(verificationData);

      if (verError) throw verError;

      // ─── FIXED: Save bank account with bank_name ───
      const selectedBankName = banks.find((b) => b.code === bankCode)?.name || '';

      const { error: bankErr } = await supabase
        .from('user_bank_accounts')
        .upsert(
          {
            user_id: userId,
            bank_code: bankCode,
            bank_name: selectedBankName,  // ← ADDED
            account_number: accountNumber,
            account_name: accountName,
            is_verified: true,
          },
          { onConflict: 'user_id' }
        );

      if (bankErr) throw bankErr;

      // Update user profile
      const userUpdate: any = {
        verification_status: verificationData.status,
        role: 'exporter',  // ← ENSURE role is set
      };
      if (cacResult?.company_name) {
        userUpdate.company_name = cacResult.company_name;
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', userId);

      if (userUpdateError) throw userUpdateError;

      // Update auth metadata
      await supabase.auth.updateUser({ data: { role: 'exporter' } });

      // Show success
      if (canSubmitManually) {
        toast.success(
          'Your documents and bank details have been submitted. Our team will review them within 24 hours.',
          { duration: 5000 }
        );
      } else {
        toast.success('Documents and bank details submitted! We\'ll verify within 24 hours.');
      }

      // ─── FIXED: Reliable redirect to dashboard ───
      setTimeout(() => {
        window.location.href = '/dashboard/exporter';
      }, 800);

    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    ((cacResult?.verified && ninResult?.verified && cacFile) ||
      (cacFile && dojahOffline && (!cacResult?.verified || !ninResult?.verified))) &&
    bankVerified;

  const selectedBankName = banks.find((b) => b.code === bankCode)?.name || '';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-8"
        style={{ border: `1px solid ${COLORS.gray200}` }}
      >
        {/* Progress bar */}
        <div className="flex mb-8">
          <div className="flex-1">
            <div
              className="h-2 rounded-full"
              style={{ background: COLORS.accent }}
            />
            <p
              className="text-xs mt-2 font-medium"
              style={{ color: COLORS.accent }}
            >
              Step 2 of 2
            </p>
          </div>
        </div>

        <h2
          className="text-3xl font-black mb-6"
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            color: COLORS.gray900,
          }}
        >
          Verify Your Business
        </h2>

        {/* ── CAC ── */}
        <div className="mb-8">
          <label
            className="text-xs font-bold uppercase tracking-wider mb-2 block"
            style={{ color: COLORS.accent }}
          >
            CAC Number
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Building2
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: COLORS.gray400 }}
                size={16}
              />
              <input
                type="text"
                placeholder="RC123456 or 123456"
                value={cacInput}
                onChange={(e) => setCacInput(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm disabled:opacity-60"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                disabled={cacLoading}
              />
            </div>
            <button
              onClick={handleCACVerify}
              disabled={cacLoading || !cacInput.trim()}
              className="px-4 py-2 font-semibold text-sm rounded-xl transition disabled:opacity-50"
              style={{
                border: `1px solid ${COLORS.accent}`,
                color: COLORS.accent,
                background: 'transparent',
              }}
            >
              {cacLoading ? 'Verifying…' : 'Verify CAC →'}
            </button>
          </div>
          {import.meta.env.DEV && (
            <p style={{ fontSize: 11, color: COLORS.gray400, marginTop: 4 }}>
              🧪 Sandbox test: RC1234567
            </p>
          )}
          <p className="text-xs" style={{ color: COLORS.gray400 }}>
            Your Corporate Affairs Commission registration number
          </p>

          {cacResult?.verified && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#ECFDF5', border: `1px solid #A7F3D0` }}>
              <CheckCircle2 className="text-green-600 w-5 h-5 mb-2" />
              <p className="font-bold" style={{ color: COLORS.gray800 }}>
                {cacResult.company_name}
              </p>
              <p className="text-sm" style={{ color: '#059669' }}>
                {cacResult.company_type} · Registered {cacResult.registration_date}
              </p>
            </div>
          )}
          {cacResult && !cacResult.verified && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#FEF2F2', border: `1px solid #FECACA` }}>
              <AlertTriangle className="text-red-600 w-5 h-5 mb-2" />
              <p className="text-sm text-red-700">
                {cacResult.error || 'CAC not found'}
              </p>
            </div>
          )}
        </div>

        {/* ── NIN ── */}
        <div className="mb-8">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>
            NIN Number
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input
                type={showNIN ? 'text' : 'password'}
                placeholder="11-digit NIN number"
                value={ninInput}
                onChange={(e) => setNinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm disabled:opacity-60"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                disabled={ninLoading}
              />
              <button
                type="button"
                onClick={() => setShowNIN(!showNIN)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: COLORS.gray400 }}
              >
                {showNIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleNINVerify}
              disabled={ninLoading || !ninInput.trim()}
              className="px-4 py-2 font-semibold text-sm rounded-xl transition disabled:opacity-50"
              style={{ border: `1px solid ${COLORS.accent}`, color: COLORS.accent, background: 'transparent' }}
            >
              {ninLoading ? 'Verifying…' : 'Verify NIN →'}
            </button>
          </div>
          {import.meta.env.DEV && (
            <p style={{ fontSize: 11, color: COLORS.gray400, marginTop: 4 }}>
              🧪 Sandbox test: 12345678901
            </p>
          )}
          <p className="text-xs flex items-center gap-1" style={{ color: COLORS.gray400 }}>
            <AlertTriangle className="w-3 h-3" /> Your NIN is verified and immediately discarded. Never stored.
          </p>

          {ninResult?.verified && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#ECFDF5', border: `1px solid #A7F3D0` }}>
              <CheckCircle2 className="text-green-600 w-5 h-5 mb-2" />
              <p className="font-bold" style={{ color: COLORS.gray800 }}>Identity Verified</p>
              <p className="text-sm" style={{ color: '#059669' }}>Your NIN has been verified and discarded.</p>
            </div>
          )}
          {ninResult && !ninResult.verified && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#FEF2F2', border: `1px solid #FECACA` }}>
              <AlertTriangle className="text-red-600 w-5 h-5 mb-2" />
              <p className="text-sm text-red-700">{ninResult.error || 'NIN verification failed'}</p>
            </div>
          )}
        </div>

        {/* ── Bank Account Details ── */}
        <div className="mb-8">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>
            Bank Account for Escrow Payouts
          </label>
          <p className="text-xs mb-4" style={{ color: COLORS.gray400 }}>
            We’ll send your earnings here after delivery is confirmed.
          </p>

          <div className="mb-3 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm flex items-center justify-between bg-white"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              <span className={selectedBankName ? '' : 'text-gray-400'}>
                {selectedBankName || 'Select your bank'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ borderRadius: 12 }}>
                {banks.map((bank) => (
                  <div
                    key={bank.code}
                    onClick={() => { setBankCode(bank.code); setDropdownOpen(false); }}
                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-green-50 transition-colors ${bankCode === bank.code ? 'bg-green-50 font-semibold' : ''}`}
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {bank.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.gray400 }} size={16} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="Account number (10 digits)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm disabled:opacity-60"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                disabled={bankLoading}
              />
            </div>
            <button
              onClick={handleBankVerify}
              disabled={bankLoading || !bankCode || accountNumber.length !== 10}
              className="px-4 py-2 font-semibold text-sm rounded-xl transition disabled:opacity-50"
              style={{ border: `1px solid ${COLORS.accent}`, color: COLORS.accent, background: 'transparent' }}
            >
              {bankLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verify Account →'}
            </button>
          </div>

          {bankVerified && accountName && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#ECFDF5', border: `1px solid #A7F3D0` }}>
              <CheckCircle2 className="text-green-600 w-5 h-5 mb-2" />
              <p className="font-bold" style={{ color: COLORS.gray800 }}>{accountName}</p>
              <p className="text-sm" style={{ color: '#059669' }}>Account verified successfully</p>
            </div>
          )}
          {bankError && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#FEF2F2', border: `1px solid #FECACA` }}>
              <AlertTriangle className="text-red-600 w-5 h-5 mb-2" />
              <p className="text-sm text-red-700">{bankError}</p>
            </div>
          )}
        </div>

        {/* Dojah offline fallback */}
        {dojahOffline && (
          <div className="mb-8 p-4 rounded-xl" style={{ background: '#FEF3C7', border: `1px solid #FDE68A`, color: '#92400E' }}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="font-semibold text-sm">Automated verification is temporarily unavailable.</p>
            <p className="text-xs mt-1">Your documents will be reviewed manually by our team within 24 hours. You can still submit now.</p>
          </div>
        )}

        {/* Documents */}
        <div className="mb-8">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>
            Supporting Documents
          </label>
          <div className="p-4 rounded-xl mb-4 text-xs" style={{ background: '#EFF6FF', border: `1px solid #BFDBFE`, color: '#1E40AF' }}>
            Our team visually reviews your CAC certificate to confirm authenticity. Documents are permanently deleted within 24 hours of review.
          </div>

          <div className="border-2 border-dashed rounded-xl p-6 text-center mb-4 relative cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: COLORS.accent }} onClick={() => fileInputRef.current?.click()}>
            <Upload className="mx-auto mb-2" size={24} style={{ color: COLORS.accent }} />
            <p className="font-bold text-sm" style={{ color: COLORS.gray800 }}>CAC Certificate (Required)</p>
            <p className="text-xs" style={{ color: COLORS.gray400 }}>PDF or image · Max 5MB</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileSelect('cac', e)} />
            {cacFile && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs" style={{ color: '#059669' }}>
                <CheckCircle2 className="w-3 h-3" /> {cacFile.name}
              </div>
            )}
          </div>

          <div className="border-2 border-dashed rounded-xl p-6 text-center relative cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: COLORS.gray200 }}>
            <Upload className="mx-auto mb-2" size={24} style={{ color: COLORS.gray400 }} />
            <p className="font-bold text-sm" style={{ color: COLORS.gray800 }}>NEPC Registration (Optional)</p>
            <p className="text-xs" style={{ color: COLORS.gray400 }}>PDF or image · Max 5MB</p>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileSelect('nepc', e)} />
            {nepcFile && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs" style={{ color: '#059669' }}>
                <CheckCircle2 className="w-3 h-3" /> {nepcFile.name}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="btn-primary w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {submitting ? 'Submitting…' : 'Submit for Verification →'}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: COLORS.gray400 }}>
          IziXport is NDPC registered. Your data is protected under the Nigeria Data Protection Regulation.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes btnShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-primary {
          background: linear-gradient(90deg, #004D2E 0%, #006B3F 30%, #00994D 50%, #006B3F 70%, #004D2E 100%);
          background-size: 200% auto;
          animation: btnShimmer 3s linear infinite;
          color: white;
          border: none;
          cursor: pointer;
          transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
        }
        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 6px 24px rgba(0,107,63,0.25);
        }
        .btn-primary:active:not(:disabled) {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}