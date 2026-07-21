// src/pages/onboarding/ExporterStep2.tsx
// MANUAL REVIEW ONLY — No Dojah API verification
// Exporter uploads documents + enters CAC/NIN as plain text
// Admin reviews manually within 24 hours

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import {
  Building2, Eye, EyeOff, Upload, CheckCircle2,
  AlertTriangle, Banknote, Loader2, ChevronDown,
  Check, Lock, ShieldCheck, Globe, ClipboardCheck,
  X, FileImage, FileText as FileTextIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#006B3F',
  primaryDark: '#004D2E',
  primaryLight: '#E6F2ED',
  accent: '#D4A843',
  white: '#FFFFFF',
  gray300: '#D1D5DB',
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

// Replace the STATIC_BANKS block with this fallback list only.
const FALLBACK_BANKS: Bank[] = [
  { id: 1, code: '044', name: 'Access Bank' },
  { id: 2, code: '058', name: 'Guaranty Trust Bank' },
  { id: 3, code: '011', name: 'First Bank of Nigeria' },
  { id: 4, code: '221', name: 'Stanbic IBTC Bank' },
  { id: 5, code: '068', name: 'Standard Chartered Bank' },
  { id: 6, code: '032', name: 'Union Bank of Nigeria' },
  { id: 7, code: '033', name: 'United Bank For Africa' },
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
  { id: 19, code: '214', name: 'First City Monument Bank' },
  { id: 20, code: '076', name: 'Polaris Bank' },
  { id: 21, code: '103', name: 'Titan Trust Bank' },
  { id: 22, code: '999992', name: 'OPay Digital Services Limited (OPay)' },
  { id: 23, code: '50515', name: 'Moniepoint MFB' },
  { id: 24, code: '999991', name: 'PalmPay' },
].sort((a, b) => a.name.localeCompare(b.name));


interface ReadinessItem {
  key: 'has_nepc_cert' | 'has_product_testing' | 'has_freight_forwarder' | 'has_shipped_before';
  label: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
}

const READINESS_ITEMS: ReadinessItem[] = [
  {
    key: 'has_nepc_cert',
    label: 'NEPC Exporter Registration',
    description: 'Nigerian Export Promotion Council registration gives you access to export incentives and helps buyers trust your legitimacy.',
    linkText: 'Register on NEPC →',
    linkUrl: 'https://nepc.gov.ng',
  },
  {
    key: 'has_product_testing',
    label: 'Product Testing (NAFDAC / SON)',
    description: 'Has your product been tested and certified by NAFDAC, SON, or any international quality body? Certified products attract more buyers.',
    linkText: 'Learn about SON certification →',
    linkUrl: 'https://son.gov.ng',
  },
  {
    key: 'has_freight_forwarder',
    label: 'Freight Forwarder',
    description: 'Do you have a freight forwarder or shipping agent who handles customs and logistics for your exports?',
  },
  {
    key: 'has_shipped_before',
    label: 'Previous International Shipment',
    description: 'Have you shipped goods internationally before? First-time exporters receive extra support from our admin team.',
  },
];

export default function ExporterStep2() {
  const navigate = useNavigate();

  // ─── FILE INPUT REFS ─────────────────────────────────────────────────────
  const cacFileInputRef = useRef<HTMLInputElement>(null);
  const nepcFileInputRef = useRef<HTMLInputElement>(null);

  // CAC — plain text only, stored for admin review
  const [cacInput, setCacInput] = useState('');

  // NIN — plain text only, optional, stored for admin review
  const [ninInput, setNinInput] = useState('');
  const [showNIN, setShowNIN] = useState(false);

  // Documents
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [cacPreview, setCacPreview] = useState<string | null>(null);
  const [nepcFile, setNepcFile] = useState<File | null>(null);
  const [nepcPreview, setNepcPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bank details
// Replace the current bank state block with this.
const [banks, setBanks] = useState<Bank[]>([]);
const [banksLoading, setBanksLoading] = useState(true);
const [bankCode, setBankCode] = useState('');
const [accountNumber, setAccountNumber] = useState('');
const [accountName, setAccountName] = useState('');
const [bankVerified, setBankVerified] = useState(false);
const [bankLoading, setBankLoading] = useState(false);
const [bankError, setBankError] = useState('');
const [dropdownOpen, setDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

  // Export readiness
  const [readinessExpanded, setReadinessExpanded] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, boolean>>({
    has_nepc_cert: false,
    has_product_testing: false,
    has_freight_forwarder: false,
    has_shipped_before: false,
  });
  const [freightForwarderName, setFreightForwarderName] = useState('');

  const readinessScore = Object.values(readiness).filter(Boolean).length;
  const isExportReady = readinessScore === 4;

  const toggleReadiness = (key: string) => {
    setReadiness((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── MEMORY CLEANUP ──────────────────────────────────────────────────────
  // Revoke object URLs on unmount to prevent memory leaks on low-end devices
  useEffect(() => {
    return () => {
      if (cacPreview) URL.revokeObjectURL(cacPreview);
      if (nepcPreview) URL.revokeObjectURL(nepcPreview);
    };
  }, [cacPreview, nepcPreview]);

  // Add this effect near your other useEffect hooks.
useEffect(() => {
  let mounted = true;

  const loadBanks = async () => {
    setBanksLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-bank', {
        body: { country: 'nigeria' },
      });

      if (error) throw error;

      const bankList = Array.isArray(data) ? data : [];
      const cleaned = bankList
        .map((b: any) => ({
          id: Number(b.id),
          code: String(b.code || '').trim(),
          name: String(b.name || '').trim(),
        }))
        .filter((b: Bank) => b.code && b.name)
        .sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));

      if (mounted && cleaned.length > 0) {
        setBanks(cleaned);
      } else if (mounted) {
        setBanks(FALLBACK_BANKS);
      }
    } catch (err) {
      console.error('Failed to load Paystack banks:', err);
      if (mounted) setBanks(FALLBACK_BANKS);
    } finally {
      if (mounted) setBanksLoading(false);
    }
  };

    loadBanks();

     return () => {
        mounted = false;
     };

  }, []);

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

  useEffect(() => {
    setBankVerified(false);
    setAccountName('');
    setBankError('');
  }, [bankCode, accountNumber]);

  // ─── FILE HANDLING ───────────────────────────────────────────────────────
  const handleFileSelect = useCallback((type: 'cac' | 'nepc', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      // Reset the input so user can try again
      e.target.value = '';
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, PNG, or WebP file');
      e.target.value = '';
      return;
    }

    if (type === 'cac') {
      // Clean up old preview to save memory
      if (cacPreview) URL.revokeObjectURL(cacPreview);
      setCacFile(file);
      // Only create preview for images (not PDFs — saves memory)
      if (file.type.startsWith('image/')) {
        setCacPreview(URL.createObjectURL(file));
      } else {
        setCacPreview(null);
      }
    } else {
      if (nepcPreview) URL.revokeObjectURL(nepcPreview);
      setNepcFile(file);
      if (file.type.startsWith('image/')) {
        setNepcPreview(URL.createObjectURL(file));
      } else {
        setNepcPreview(null);
      }
    }

    toast.success(`${file.name} selected (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }, [cacPreview, nepcPreview]);

  const removeFile = useCallback((type: 'cac' | 'nepc') => {
    if (type === 'cac') {
      if (cacPreview) URL.revokeObjectURL(cacPreview);
      setCacFile(null);
      setCacPreview(null);
      if (cacFileInputRef.current) cacFileInputRef.current.value = '';
    } else {
      if (nepcPreview) URL.revokeObjectURL(nepcPreview);
      setNepcFile(null);
      setNepcPreview(null);
      if (nepcFileInputRef.current) nepcFileInputRef.current.value = '';
    }
  }, [cacPreview, nepcPreview]);

// Replace handleBankVerify with this.
const handleBankVerify = async () => {
  if (!bankCode || !accountNumber) {
    toast.error('Select a bank and enter an account number.');
    return;
  }

  setBankLoading(true);
  setBankError('');

  try {
    const { data, error } = await supabase.functions.invoke('resolve-bank-account', {
      body: { bank_code: bankCode, account_number: accountNumber },
    });

    if (error) throw error;

    if (data?.account_name) {
      setAccountName(data.account_name); // save exactly what Paystack returns
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

  const uploadFile = async (file: File, userId: string, prefix: string) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('verifications')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('verifications').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!bankVerified) {
      toast.error('Please verify your bank account before submitting.');
      return;
    }
    if (!cacFile) {
      toast.error('Please upload your CAC certificate before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      const userId = session.user.id;
      const cacUrl = await uploadFile(cacFile, userId, 'cac');
      let nepcUrl: string | null = null;
      if (nepcFile) nepcUrl = await uploadFile(nepcFile, userId, 'nepc');

      const verificationData = {
        user_id: userId,
        cac_document_url: cacUrl,
        nepc_document_url: nepcUrl,
        cac_number: cacInput?.trim() || null,
        nin_number: ninInput?.trim() || null,
        status: 'under_review',
      };

      const { error: verError } = await supabase.from('verifications').insert(verificationData);
      if (verError) throw verError;

      // Save bank account
      // Replace the bank save part inside handleSubmit with this.
const selectedBankName =
banks.find((b) => b.code === bankCode)?.name || '';

if (!selectedBankName) {
throw new Error('Please re-select your bank from the live bank list.');
}

const { error: bankErr } = await supabase    .upsert(
{
  user_id: userId,
  bank_code: bankCode,
  bank_name: selectedBankName,
  account_number: accountNumber,
  account_name: accountName,
  is_verified: true,
},
{ onConflict: 'user_id' }
);

if (bankErr) throw bankErr;

      // Update user profile
      const { error: userUpdateError } = await supabase.from('users').update({
        verification_status: 'under_review',
        role: 'exporter',
      }).eq('id', userId);
      if (userUpdateError) throw userUpdateError;

      // Save export readiness
      const exportReadyData = {
        user_id: userId,
        has_nepc_cert: readiness.has_nepc_cert,
        has_product_testing: readiness.has_product_testing,
        has_freight_forwarder: readiness.has_freight_forwarder,
        freight_forwarder_name: readiness.has_freight_forwarder ? freightForwarderName.trim() || null : null,
        has_shipped_before: readiness.has_shipped_before,
        preferred_language: 'en',
      };

      const { error: profileError } = await supabase
        .from('exporter_profiles')
        .upsert(exportReadyData, { onConflict: 'user_id' });

      if (profileError) console.warn('Export readiness save failed:', profileError);

      // Update auth metadata
      await supabase.auth.updateUser({ data: { role: 'exporter' } });

      // Clean up previews to free memory before navigation
      if (cacPreview) URL.revokeObjectURL(cacPreview);
      if (nepcPreview) URL.revokeObjectURL(nepcPreview);

      toast.success("Documents submitted! Our admin team will review and verify your account within 24 hours.");
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

  const canSubmit = cacFile && bankVerified;
  const selectedBankName = banks.find((b) => b.code === bankCode)?.name || '';

  // ─── FILE UPLOAD COMPONENT ───────────────────────────────────────────────
  const FileUploadBox = ({
    label,
    required,
    file,
    preview,
    onSelect,
    onRemove,
    inputRef,
    accent = false,
  }: {
    label: string;
    required?: boolean;
    file: File | null;
    preview: string | null;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    accent?: boolean;
  }) => (
    <div
      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
        file ? 'bg-green-50/50 border-green-300' : 'hover:bg-gray-50'
      }`}
      style={{ borderColor: file ? '#86EFAC' : accent ? COLORS.accent : COLORS.gray200 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        className="hidden"
        onChange={onSelect}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-2"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
            style={{ background: accent ? `${COLORS.accent}15` : COLORS.gray100 }}
          >
            <Upload size={22} style={{ color: accent ? COLORS.accent : COLORS.gray400 }} />
          </div>
          <p className="font-bold text-sm" style={{ color: COLORS.gray800 }}>
            {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
          </p>
          <p className="text-xs" style={{ color: COLORS.gray400 }}>
            Tap to upload PDF or photo · Max 5MB
          </p>
        </button>
      ) : (
        <div className="w-full">
          {/* Preview for images */}
          {preview && (
            <div className="mb-3 relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
                loading="lazy"
              />
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* File info */}
          <div className="flex items-center gap-3 text-left">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: COLORS.primaryLight }}
            >
              {file.type === 'application/pdf' ? (
                <FileTextIcon size={18} style={{ color: COLORS.primary }} />
              ) : (
                <FileImage size={18} style={{ color: COLORS.primary }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: COLORS.gray800 }}>
                {file.name}
              </p>
              <p className="text-xs" style={{ color: COLORS.gray400 }}>
                {(file.size / 1024).toFixed(0)} KB · {file.type.split('/')[1].toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition"
              style={{ color: '#EF4444' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Change file button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 text-xs font-semibold"
            style={{ color: COLORS.accent }}
          >
            Change file
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2EFE9] py-6 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-stretch">

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex lg:w-[44%] flex-col justify-between rounded-3xl p-10 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #002E1A 0%, #004D2E 100%)', fontFamily: 'Barlow, sans-serif' }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#C8991A' }}>
                <span className="text-white font-black text-sm">I</span>
              </div>
              <span className="font-bold text-lg tracking-tight">IziXport</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border" style={{ borderColor: 'rgba(200,153,26,0.4)', background: 'rgba(200,153,26,0.1)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8991A' }}>Verified Exporter Onboarding</span>
            </div>

            <h2 className="text-4xl font-black leading-tight mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Trade With <span style={{ color: '#C8991A' }}>Confidence.</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Join verified Nigerian exporters selling globally through full escrow protection.
            </p>

            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C8991A' }}>Why Choose IziXport</h3>
              <ul className="space-y-2.5">
                {[
                  'Direct access to international buyers from 38+ countries',
                  'Full escrow protection on every deal — you ship, you get paid',
                  'Zero upfront listing fees or hidden charges',
                  'Every buyer is admin-verified before they can place orders',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: '#C8991A' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl mb-6" style={{ background: 'rgba(200,153,26,0.08)', border: '1px solid rgba(200,153,26,0.2)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C8991A' }}>What You're Missing</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Without completing verification, your profile remains invisible to buyers, you cannot access escrow-protected deals, and you miss out on premium international leads reviewed by our admin team.
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C8991A' }}>Admin Review</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Our admin team will review and verify your account within 24 hours of submission. You'll receive an email notification once approved, and your exporter dashboard will be activated immediately.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Lock, title: 'Escrow-Protected Payments', sub: 'Your funds are secure until delivery' },
                { icon: ShieldCheck, title: '100% Verified Traders', sub: 'Every account manually reviewed' },
                { icon: Globe, title: '38 Countries Served', sub: 'Global buyer network' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Icon size={14} style={{ color: '#C8991A' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{title}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — FORM */}
        <div
          className="w-full max-w-lg lg:max-w-none lg:w-[56%] mx-auto lg:mx-0 bg-white rounded-3xl shadow-lg p-6 sm:p-8"
          style={{ border: `1px solid ${COLORS.gray200}` }}
        >
          {/* Progress bar */}
          <div className="flex mb-6">
            <div className="flex-1">
              <div className="h-2 rounded-full" style={{ background: COLORS.accent }} />
              <p className="text-xs mt-2 font-medium" style={{ color: COLORS.accent }}>Step 2 of 2</p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-6" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: COLORS.gray900 }}>
            Verify Your Business
          </h2>

          {/* ── CAC Number (plain text) ── */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>CAC Number</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.gray400 }} size={16} />
              <input
                type="text"
                placeholder="RC123456 or 123456"
                value={cacInput}
                onChange={(e) => setCacInput(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: COLORS.gray400 }}>
              Your Corporate Affairs Commission registration number. Our admin team will cross-check this manually.
            </p>
          </div>

          {/* ── NIN Number (plain text, optional) ── */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>NIN Number (Optional)</label>
            <div className="relative">
              <input
                type={showNIN ? 'text' : 'password'}
                placeholder="11-digit NIN number"
                value={ninInput}
                onChange={(e) => setNinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              />
              <button type="button" onClick={() => setShowNIN(!showNIN)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.gray400 }}>
                {showNIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.gray400 }}>
              <AlertTriangle className="w-3 h-3" /> Your NIN is stored securely for admin review only.
            </p>
          </div>

          {/* ── Bank Account Details ── */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>Bank Account for Escrow Payouts</label>
            <p className="text-xs mb-3" style={{ color: COLORS.gray400 }}>We'll send your earnings here after delivery is confirmed.</p>

            <div className="mb-3 relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20 outline-none text-sm flex items-center justify-between bg-white"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                // Replace the button label / dropdown area with a loading-aware version.
<span className={selectedBankName ? '' : 'text-gray-400'}>
  {selectedBankName || (banksLoading ? 'Loading banks...' : 'Select your bank')}
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
              <div className="mt-3 p-4 rounded-xl" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <CheckCircle2 className="text-green-600 w-5 h-5 mb-2" />
                <p className="font-bold" style={{ color: COLORS.gray800 }}>{accountName}</p>
                <p className="text-sm" style={{ color: '#059669' }}>Account verified successfully</p>
              </div>
            )}
            {bankError && (
              <div className="mt-3 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertTriangle className="text-red-600 w-5 h-5 mb-2" />
                <p className="text-sm text-red-700">{bankError}</p>
              </div>
            )}
          </div>

          {/* ─── EXPORT READINESS CHECKLIST ─────────────────────────────── */}
          <div className="mb-6">
            <div
              onClick={() => setReadinessExpanded(!readinessExpanded)}
              className="flex items-center justify-between cursor-pointer p-4 rounded-xl"
              style={{ background: readinessExpanded ? COLORS.primaryLight : COLORS.gray50, border: `1px solid ${readinessExpanded ? '#A7F3D0' : COLORS.gray200}`, transition: 'all 0.2s' }}
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck size={18} style={{ color: isExportReady ? COLORS.primary : COLORS.accent }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>Export Readiness</p>
                  <p className="text-sm font-semibold" style={{ color: COLORS.gray700 }}>
                    {readinessScore}/4 complete
                    {isExportReady ? ' — Export Ready! 🏅' : ' (optional but recommended)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isExportReady && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: COLORS.primaryLight, color: COLORS.primary }}>
                    Ready
                  </span>
                )}
                <ChevronDown size={16} style={{ color: COLORS.gray400, transform: readinessExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </div>
            </div>

            {readinessExpanded && (
              <div className="mt-3 space-y-3">
                <div style={{ height: 6, background: COLORS.gray100, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(readinessScore / 4) * 100}%`, background: `linear-gradient(90deg, ${COLORS.primary}, #00994D)`, borderRadius: 999, transition: 'width 0.3s' }} />
                </div>

                <p className="text-xs" style={{ color: COLORS.gray500 }}>
                  Exporters with all 4 items get an "Export Ready" badge on their profile — helping them stand out to international buyers.
                </p>

                {READINESS_ITEMS.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl"
                    style={{ background: readiness[item.key] ? '#ECFDF5' : COLORS.gray50, border: `1px solid ${readiness[item.key] ? '#A7F3D0' : COLORS.gray200}`, transition: 'all 0.2s' }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleReadiness(item.key)}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: readiness[item.key] ? COLORS.primary : 'transparent',
                          border: `2px solid ${readiness[item.key] ? COLORS.primary : COLORS.gray300}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.15s', marginTop: 1,
                        }}
                      >
                        {readiness[item.key] && <Check size={13} color="white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: COLORS.gray800 }}>{item.label}</p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.gray500 }}>{item.description}</p>
                        {item.linkText && item.linkUrl && (
                          <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold mt-1 inline-block" style={{ color: COLORS.accent }}>
                            {item.linkText}
                          </a>
                        )}
                        {item.key === 'has_freight_forwarder' && readiness.has_freight_forwarder && (
                          <input
                            type="text"
                            placeholder="Freight forwarder name (optional)"
                            value={freightForwarderName}
                            onChange={(e) => setFreightForwarderName(e.target.value)}
                            className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#006B3F] outline-none text-xs"
                            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isExportReady && (
                  <div className="p-3 rounded-xl text-center" style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}30` }}>
                    <p className="text-sm font-bold" style={{ color: COLORS.primary }}>
                      🏅 You qualify for the Export Ready badge on your profile!
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.gray600 }}>
                      This badge is displayed to buyers and increases trust significantly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── DOCUMENTS ───────────────────────────────────────────────── */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: COLORS.accent }}>Supporting Documents</label>
            <div className="p-3 rounded-xl mb-3 text-xs" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
              Our team visually reviews your CAC certificate to confirm authenticity. Documents are permanently deleted within 24 hours of review.
            </div>

            {/* CAC Certificate */}
            <div className="mb-3">
              <FileUploadBox
                label="CAC Certificate"
                required
                file={cacFile}
                preview={cacPreview}
                onSelect={(e) => handleFileSelect('cac', e)}
                onRemove={() => removeFile('cac')}
                inputRef={cacFileInputRef}
                accent
              />
            </div>

            {/* NEPC Certificate */}
            <div>
              <FileUploadBox
                label="NEPC Registration"
                file={nepcFile}
                preview={nepcPreview}
                onSelect={(e) => handleFileSelect('nepc', e)}
                onRemove={() => removeFile('nepc')}
                inputRef={nepcFileInputRef}
              />
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
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes btnShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-primary {
          background: linear-gradient(90deg, #004D2E 0%, #006B3F 30%, #00994D 50%, #006B3F 70%, #004D2E 100%);
          background-size: 200% auto;
          animation: btnShimmer 3s linear infinite;
          color: white; border: none; cursor: pointer;
          transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
        }
        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 6px 24px rgba(0,107,63,0.25);
        }
        .btn-primary:active:not(:disabled) { transform: scale(0.97); }
      `}</style>
    </div>
  );
}