// src/pages/onboarding/BuyerOnboarding.tsx
// ROUTE: /onboarding/buyer

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client'; // adjust path as needed
import {
  ChevronDown,
  Search,
  X,
  Check,
  Upload,
  CheckCircle2,
  Globe,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// 1. Country & product lists (international buyers only)
// ─────────────────────────────────────────────
const PRIORITY_COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
];

const OTHER_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
];

const ALL_COUNTRIES = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES];

const PRODUCTS = [
  'Cashew Nuts',
  'Cocoa Beans',
  'Sesame Seeds',
  'Shea Butter',
  'Ginger',
  'Palm Oil',
  'Hibiscus (Zobo)',
  'Groundnuts',
  'Other',
];

const VOLUMES = [
  'Under $10,000',
  '$10,000 - $50,000',
  '$50,000 - $200,000',
  '$200,000 - $500,000',
  'Above $500,000',
];

const HOW_HEARD = [
  'Google Search',
  'LinkedIn',
  'WhatsApp',
  'Referral from someone',
  'Trade Association',
  'Other',
];

// ─────────────────────────────────────────────
// 2. Main Component
// ─────────────────────────────────────────────
export default function BuyerOnboarding() {
  const navigate = useNavigate();

  // ---------- Step 1 state ----------
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    country: '',
    countryFlag: '',
    products: [] as string[],
    otherProduct: '',
    volume: '',
    howHeard: '',
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [howHeardOpen, setHowHeardOpen] = useState(false);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // ---------- Step 2 state (document uploads) ----------
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [importLicenseFile, setImportLicenseFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ---------- Click outside refs for dropdowns ----------
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const volumeDropdownRef = useRef<HTMLDivElement>(null);
  const howHeardDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryOpen && countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
      if (volumeOpen && volumeDropdownRef.current && !volumeDropdownRef.current.contains(event.target as Node)) {
        setVolumeOpen(false);
      }
      if (howHeardOpen && howHeardDropdownRef.current && !howHeardDropdownRef.current.contains(event.target as Node)) {
        setHowHeardOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [countryOpen, volumeOpen, howHeardOpen]);

  // ---------- Step 1 helpers ----------
  const filteredCountries = countrySearch
    ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : ALL_COUNTRIES;

  const toggleProduct = (product: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product],
    }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = 'Name is required';
    if (!formData.companyName.trim()) e.companyName = 'Company name is required';
    if (!formData.country) e.country = 'Please select your country';
    if (formData.products.length === 0) e.products = 'Select at least one product';
    if (!formData.volume) e.volume = 'Please select a volume range';
    if (!formData.howHeard) e.howHeard = 'Please select an option';
    return e;
  };

  const handleFileSelect = (setter: (f: File | null) => void, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setter(file);
  };

  const uploadFile = async (file: File, userId: string, prefix: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('verifications')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return path;
  };

  // ---------- Combined submit ----------
  const handleSubmit = async () => {
    // 1. Validate step1
    const step1ErrorsObj = validateStep1();
    if (Object.keys(step1ErrorsObj).length > 0) {
      setStep1Errors(step1ErrorsObj);
      toast.error('Please complete all business information fields');
      return;
    }

    // 2. Validate international buyer documents
    if (!businessRegFile) {
      toast.error('Please upload your Business Registration Certificate');
      return;
    }
    if (!passportFile) {
      toast.error('Please upload your Passport or National ID');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const userId = session.user.id;

      // 3. Save step1 data to users table
      const productsList = formData.products.includes('Other') && formData.otherProduct
        ? [...formData.products.filter(p => p !== 'Other'), formData.otherProduct]
        : formData.products.filter(p => p !== 'Other');

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName.trim(),
          company_name: formData.companyName.trim(),
          country: formData.country,
          primary_product: productsList.join(', '),
          monthly_import_volume: formData.volume,
          how_heard: formData.howHeard,
          verification_status: 'under_review',
        })
        .eq('id', userId);

      if (userUpdateError) throw userUpdateError;

      // 4. Upload documents
      const businessRegUrl = await uploadFile(businessRegFile, userId, 'business-reg');
      const passportUrl = await uploadFile(passportFile, userId, 'passport');
      const importLicenseUrl = importLicenseFile
        ? await uploadFile(importLicenseFile, userId, 'import-license')
        : null;

      // 5. Insert verification record (international)
      const { error: verError } = await supabase
        .from('verifications')
        .insert({
          user_id: userId,
          status: 'under_review',
          cac_verified: false,
          cac_document_url: businessRegUrl,
          nepc_document_url: importLicenseUrl,
          id_document_url: passportUrl,
          admin_notes: `International buyer from ${formData.country}. Manual document review required.`,
        });

      if (verError) throw verError;

      toast.success("Profile saved & documents submitted! We'll verify within 24–48 hours.");
      navigate('/dashboard/buyer');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    document.getElementById('business-details-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ---------- Render UI ----------
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#002E1A' }}>
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl p-8" style={{ fontFamily: 'Barlow, sans-serif' }}>
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8991A' }}>
              Complete Onboarding
            </span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>All info</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '100%', background: '#C8991A' }} />
          </div>
        </div>

        {/* Header */}
        <h1
          id="business-details-top"
          className="text-[28px] font-black leading-tight mb-2"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#002E1A' }}
        >
          Tell Us About Your Business
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
          We connect you with verified Nigerian exporters. Tell us what you need.
        </p>

        {/* ========== STEP 1 FIELDS ========== */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>Your Name</label>
          <input
            type="text"
            placeholder="John Adeyemi"
            value={formData.fullName}
            onChange={e => { setFormData(p => ({ ...p, fullName: e.target.value })); setStep1Errors(p => ({ ...p, fullName: '' })); }}
            className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm outline-none transition ${
              step1Errors.fullName ? 'border-red-500' : 'border-gray-200'
            } focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20`}
            style={{ fontFamily: 'Barlow, sans-serif' }}
          />
          {step1Errors.fullName && <p className="text-xs text-red-500 mt-1">{step1Errors.fullName}</p>}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>Company Name</label>
          <input
            type="text"
            placeholder="Global Imports Ltd"
            value={formData.companyName}
            onChange={e => { setFormData(p => ({ ...p, companyName: e.target.value })); setStep1Errors(p => ({ ...p, companyName: '' })); }}
            className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm outline-none transition ${
              step1Errors.companyName ? 'border-red-500' : 'border-gray-200'
            } focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20`}
            style={{ fontFamily: 'Barlow, sans-serif' }}
          />
          {step1Errors.companyName && <p className="text-xs text-red-500 mt-1">{step1Errors.companyName}</p>}
        </div>

        {/* Country Dropdown (international only) */}
        <div className="mb-5 relative" ref={countryDropdownRef}>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>Your Country</label>
          <button
            type="button"
            onClick={() => { setCountryOpen(!countryOpen); setCountrySearch(''); }}
            className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-left flex items-center justify-between transition ${
              step1Errors.country ? 'border-red-500' : 'border-gray-200'
            }`}
            style={{ background: '#fff', fontFamily: 'Barlow, sans-serif' }}
          >
            <span style={{ color: formData.country ? '#111827' : '#9CA3AF' }}>
              {formData.country ? `${formData.countryFlag} ${formData.country}` : 'Select your country'}
            </span>
            <ChevronDown size={16} style={{ color: '#6B7280', transform: countryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {step1Errors.country && <p className="text-xs text-red-500 mt-1">{step1Errors.country}</p>}

          {countryOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border overflow-hidden" style={{ border: '1px solid #E5E7EB', maxHeight: '280px', display: 'flex', flexDirection: 'column' }}>
              <div className="p-3 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <Search size={14} style={{ color: '#9CA3AF' }} />
                  <input autoFocus type="text" placeholder="Search country..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} className="flex-1 text-sm outline-none bg-transparent" style={{ fontFamily: 'Barlow, sans-serif' }} />
                  {countrySearch && <button onClick={() => setCountrySearch('')}><X size={12} style={{ color: '#9CA3AF' }} /></button>}
                </div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                {!countrySearch && <div className="px-3 py-1.5"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C8991A' }}>Most Common Buyers</p></div>}
                {filteredCountries.map((c, i) => {
                  const isFirst = !countrySearch && i === PRIORITY_COUNTRIES.length;
                  return (
                    <div key={c.code}>
                      {isFirst && <div className="px-3 py-1.5 border-t" style={{ borderColor: '#F3F4F6' }}><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>All Countries</p></div>}
                      <button
                        type="button"
                        onClick={() => { setFormData(p => ({ ...p, country: c.name, countryFlag: c.flag })); setCountryOpen(false); setStep1Errors(p => ({ ...p, country: '' })); }}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition hover:bg-gray-50"
                        style={{ fontFamily: 'Barlow, sans-serif' }}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span style={{ color: '#111827' }}>{c.name}</span>
                        {formData.country === c.name && <Check size={14} className="ml-auto" style={{ color: '#006B3F' }} />}
                      </button>
                    </div>
                  );
                })}
                {filteredCountries.length === 0 && <div className="p-4 text-center text-sm" style={{ color: '#9CA3AF' }}>No countries found</div>}
              </div>
            </div>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>Products You Want to Import</label>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map(product => {
              const selected = formData.products.includes(product);
              return (
                <button
                  key={product}
                  type="button"
                  onClick={() => { toggleProduct(product); setStep1Errors(p => ({ ...p, products: '' })); }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                  style={{ background: selected ? '#006B3F' : '#F3F4F6', color: selected ? '#fff' : '#374151', border: selected ? '1.5px solid #006B3F' : '1.5px solid transparent', fontFamily: 'Barlow, sans-serif' }}
                >
                  {selected && <Check size={12} className="inline mr-1" />}{product}
                </button>
              );
            })}
          </div>
          {formData.products.includes('Other') && (
            <input
              type="text"
              placeholder="Please specify..."
              value={formData.otherProduct}
              onChange={e => setFormData(p => ({ ...p, otherProduct: e.target.value }))}
              className="mt-3 w-full px-4 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm outline-none transition focus:border-[#006B3F] focus:ring-2 focus:ring-[#006B3F]/20"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            />
          )}
          {step1Errors.products && <p className="text-xs text-red-500 mt-1">{step1Errors.products}</p>}
        </div>

        <div className="mb-5 relative" ref={volumeDropdownRef}>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>Monthly Import Volume</label>
          <button
            type="button"
            onClick={() => setVolumeOpen(!volumeOpen)}
            className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-left flex items-center justify-between ${
              step1Errors.volume ? 'border-red-500' : 'border-gray-200'
            }`}
            style={{ fontFamily: 'Barlow, sans-serif' }}
          >
            <span style={{ color: formData.volume ? '#111827' : '#9CA3AF' }}>{formData.volume || 'Select volume range'}</span>
            <ChevronDown size={16} style={{ color: '#6B7280', transform: volumeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {step1Errors.volume && <p className="text-xs text-red-500 mt-1">{step1Errors.volume}</p>}
          {volumeOpen && (
            <div className="absolute z-40 w-full mt-1 bg-white rounded-xl shadow-xl border overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              {VOLUMES.map(v => (
                <button key={v} type="button" onClick={() => { setFormData(p => ({ ...p, volume: v })); setVolumeOpen(false); setStep1Errors(p => ({ ...p, volume: '' })); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between" style={{ fontFamily: 'Barlow, sans-serif' }}>{v}{formData.volume === v && <Check size={14} style={{ color: '#006B3F' }} />}</button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8 relative" ref={howHeardDropdownRef}>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>How Did You Find Us</label>
          <button
            type="button"
            onClick={() => setHowHeardOpen(!howHeardOpen)}
            className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-sm text-left flex items-center justify-between ${
              step1Errors.howHeard ? 'border-red-500' : 'border-gray-200'
            }`}
            style={{ fontFamily: 'Barlow, sans-serif' }}
          >
            <span style={{ color: formData.howHeard ? '#111827' : '#9CA3AF' }}>{formData.howHeard || 'Select an option'}</span>
            <ChevronDown size={16} style={{ color: '#6B7280', transform: howHeardOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {step1Errors.howHeard && <p className="text-xs text-red-500 mt-1">{step1Errors.howHeard}</p>}
          {howHeardOpen && (
            <div className="absolute z-40 w-full mt-1 bg-white rounded-xl shadow-xl border overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              {HOW_HEARD.map(h => (
                <button key={h} type="button" onClick={() => { setFormData(p => ({ ...p, howHeard: h })); setHowHeardOpen(false); setStep1Errors(p => ({ ...p, howHeard: '' })); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between" style={{ fontFamily: 'Barlow, sans-serif' }}>{h}{formData.howHeard === h && <Check size={14} style={{ color: '#006B3F' }} />}</button>
              ))}
            </div>
          )}
        </div>

        {/* ========== STEP 2: DOCUMENT VERIFICATION (INTERNATIONAL) ========== */}
        <div className="border-t border-gray-200 my-8 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={24} style={{ color: '#C8991A' }} />
            <h2 className="text-xl font-black" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#002E1A' }}>Verify Your Business</h2>
          </div>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Our team will manually review your documents within 24–48 hours.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6" style={{ background: '#E6F2ED', border: '1px solid #006B3F30' }}>
            <Globe size={14} style={{ color: '#006B3F' }} />
            <span className="text-sm font-semibold" style={{ color: '#006B3F' }}>International Buyer</span>
            <span className="text-xs text-gray-500">— Manual review</span>
          </div>
          <div className="p-4 rounded-xl mb-6 text-sm bg-blue-50 border border-blue-200 text-blue-800">
            <p className="font-bold mb-1">📋 International Business Verification</p>
            <p className="text-xs leading-relaxed">Our team will manually review your documents within 24–48 hours. All documents are deleted after review.</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>
              Business Registration Certificate <span className="text-red-500">*</span>
            </label>
            <UploadZone
              label="Business Registration"
              hint="Certificate of incorporation from your country · PDF or image · Max 5MB"
              file={businessRegFile}
              required
              onChange={e => handleFileSelect(setBusinessRegFile, e)}
              onClear={() => setBusinessRegFile(null)}
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>
              Passport or National ID <span className="text-red-500">*</span>
            </label>
            <UploadZone
              label="Passport or Government ID"
              hint="Clear photo of first page · PDF or image · Max 5MB"
              file={passportFile}
              required
              onChange={e => handleFileSelect(setPassportFile, e)}
              onClear={() => setPassportFile(null)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>
              Import Licence <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
            </label>
            <UploadZone
              label="Import Licence"
              hint="If applicable in your country · PDF or image · Max 5MB"
              file={importLicenseFile}
              required={false}
              onChange={e => handleFileSelect(setImportLicenseFile, e)}
              onClear={() => setImportLicenseFile(null)}
            />
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2 mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <FileText size={14} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="text-xs leading-relaxed text-gray-500">
            🗑️ All uploaded documents are <strong>permanently deleted</strong> within 48 hours of admin review. IziXport is NDPC registered.
          </p>
        </div>

        {/* Submit & Back buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            style={{ fontFamily: 'Barlow, sans-serif' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-4 rounded-full font-bold text-white text-base transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#C8991A', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '17px', letterSpacing: '0.02em' }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#a87d14'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#C8991A'; }}
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit & Complete →'
            )}
          </button>
        </div>
      </div>

      {/* Google Fonts import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. Reusable UploadZone component
// ─────────────────────────────────────────────
function UploadZone({
  label,
  hint,
  file,
  required,
  onChange,
  onClear,
}: {
  label: string;
  hint: string;
  file: File | null;
  required: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input value when file is cleared externally
  useEffect(() => {
    if (!file && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [file]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    // Reset input so the same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer hover:bg-gray-50 ${
        file ? 'border-green-400 bg-green-50' : required ? 'border-[#D4A843]' : 'border-gray-300'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        onChange={handleChange}
      />
      {file ? (
        <div className="flex items-center justify-between gap-2 text-green-700">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold truncate">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="flex-shrink-0 p-1 rounded-full text-green-700 hover:bg-green-200 transition"
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <Upload className={`mx-auto w-6 h-6 mb-2 ${required ? 'text-[#D4A843]' : 'text-gray-400'}`} />
          <p className="font-bold text-sm text-gray-800">{label}</p>
          <p className="text-xs mt-1 text-gray-400">{hint}</p>
        </>
      )}
    </div>
  );
}