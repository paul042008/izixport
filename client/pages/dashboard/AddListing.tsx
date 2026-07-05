// src/pages/dashboard/AddListing.tsx
// UPDATED — Live commodity price reference panel (from Supabase commodity_prices table)
// UPDATED — Moisture content % and Processing type fields added
// All existing business logic preserved exactly

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  ChevronDown, ChevronLeft, Upload, Loader2,
  Home, Library, MessageCircle, MapPin, User, X,
  TrendingUp, RefreshCw,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import '@/styles/marketplace.css'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
]

const CATEGORIES = ['Sesame','Ginger','Cashew','Cocoa','Hibiscus','Shea','Palm Oil','Pepper']

// Map display names to commodity_prices table keys
const CATEGORY_PRICE_KEYS: Record<string, string> = {
  'Sesame': 'sesame',
  'Ginger': 'ginger',
  'Cashew': 'cashew',
  'Cocoa': 'cocoa',
  'Hibiscus': 'hibiscus',
  'Shea': 'shea',
  'Palm Oil': 'palm oil',
  'Pepper': 'pepper',
}

const UNITS = ['ton','kg','litre','bag','carton']
const QUALITY_GRADES = ['A','B','C']
const SHIPPING_TERMS = ['FOB','CIF','EXW','CFR']
const PROCESSING_TYPES = [
  { value: 'raw', label: 'Raw' },
  { value: 'processed', label: 'Processed' },
  { value: 'semi-processed', label: 'Semi-processed' },
]

// ─── Commodity price type ────────────────────────────────────────────────────
interface CommodityPrice {
  commodity_name: string;
  display_name: string;
  price_ngn_min: number | null;
  price_ngn_max: number | null;
  price_usd_min: number | null;
  price_usd_max: number | null;
  source: string;
  last_updated: string;
}

// ─── Field component ─────────────────────────────────────────────────────────
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="mk-label">{label}</label>
    {children}
    {error && <p style={{ color: 'var(--mk-danger)', fontSize: 12, marginTop: 6, fontWeight: 600 }}>{error}</p>}
  </div>
)

// ─── PRICE REFERENCE PANEL ───────────────────────────────────────────────────
function PriceReferencePanel({ category }: { category: string }) {
  const [price, setPrice] = useState<CommodityPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const commodityKey = CATEGORY_PRICE_KEYS[category];

  useEffect(() => {
    if (!commodityKey) { setPrice(null); return; }
    fetchPrice();
  }, [commodityKey]);

  const fetchPrice = async () => {
    if (!commodityKey) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commodity_prices')
        .select('*')
        .eq('commodity_name', commodityKey)
        .single();
      if (!error && data) {
        setPrice(data as CommodityPrice);
        setLastFetched(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Could not load price reference:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!commodityKey) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0C3825 0%, #1A5C41 100%)',
      borderRadius: 14, padding: 16, marginBottom: 18,
      border: '1px solid rgba(26,92,65,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} style={{ color: '#D4A843' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4A843' }}>
            Live Market Reference
          </span>
        </div>
        <button
          onClick={fetchPrice}
          disabled={loading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          title="Refresh prices"
        >
          <RefreshCw size={12} style={{ color: 'rgba(255,255,255,0.5)', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {loading && !price ? (
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Loading prices…</div>
      ) : price ? (
        <>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 8, fontFamily: 'var(--mk-font-heading)' }}>
            {price.display_name}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
                Nigerian Market
              </p>
              {price.price_ngn_min && price.price_ngn_max ? (
                <p style={{ fontWeight: 800, fontSize: 14, color: '#D4A843', margin: 0 }}>
                  ₦{price.price_ngn_min.toLocaleString()} – ₦{price.price_ngn_max.toLocaleString()}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>/kg</span>
                </p>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Not available</p>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
                International Export
              </p>
              {price.price_usd_min && price.price_usd_max ? (
                <p style={{ fontWeight: 800, fontSize: 14, color: '#D4A843', margin: 0 }}>
                  ${price.price_usd_min.toLocaleString()} – ${price.price_usd_max.toLocaleString()}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>/ton</span>
                </p>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Not available</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Source: {price.source} · Updated {new Date(price.last_updated).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
            {lastFetched && (
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                Fetched {lastFetched}
              </p>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Price your listing within this range to attract buyers and remain competitive.
          </p>
        </>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>No price data available for this category.</p>
      )}
    </div>
  );
}

// ─── Bottom navigation ────────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate()
  const tabs = [
    { name: 'Home',      icon: Home,          path: '/dashboard/exporter?tab=home' },
    { name: 'Listings',  icon: Library,       path: '/dashboard/exporter?tab=listings' },
    { name: 'Inquiries', icon: MessageCircle, path: '/dashboard/exporter?tab=inquiries' },
    { name: 'Track',     icon: MapPin,        path: '/dashboard/exporter/track' },
    { name: 'Profile',   icon: User,          path: '/dashboard/exporter/profile' },
  ]
  return (
    <nav className="mk-bottom-nav">
      <div className="mk-bottom-nav-inner">
        {tabs.map(tab => {
          const isActive = window.location.pathname === tab.path
            || (tab.name === 'Listings' && window.location.pathname.startsWith('/dashboard/exporter/add-listing'))
          return (
            <button key={tab.name} onClick={() => navigate(tab.path)} className={`mk-tab ${isActive ? 'is-active' : ''}`}>
              <span className="mk-tab-icon"><tab.icon size={18} /></span>
              {tab.name}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function AddListing() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price_per_unit: '',
    unit: '',
    min_order_quantity: '',
    available_quantity: '',
    origin_state: '',
    quality_grade: '',
    shipping_terms: '',
    moisture_content: '',
    processing_type: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
    if (validFiles.length < files.length) toast.error('Some images exceed 5MB and were removed.')
    if (images.length + validFiles.length > 4) { toast.error('Maximum 4 images allowed'); return }
    setImages(prev => [...prev, ...validFiles].slice(0, 4))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index))

  const uploadImages = async (exporterId: string): Promise<string[]> => {
    const urls: string[] = []
    for (const file of images) {
      const fileName = `${exporterId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { error } = await supabase.storage.from('listing-images').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) { toast.error(`Failed to upload ${file.name}: ${error.message}`); continue }
      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName)
      if (urlData?.publicUrl) urls.push(urlData.publicUrl)
    }
    return urls
  }

  const handleSubmit = async () => {
    const required = ['title','category','price_per_unit','unit','min_order_quantity','available_quantity','origin_state','quality_grade','shipping_terms']
    const newErrors: Record<string, string> = {}
    required.forEach(f => { if (!form[f as keyof typeof form].toString().trim()) newErrors[f] = 'Required' })
    if (isNaN(Number(form.price_per_unit)) || Number(form.price_per_unit) <= 0) newErrors.price_per_unit = 'Enter a valid price'
    if (isNaN(Number(form.min_order_quantity)) || Number(form.min_order_quantity) <= 0) newErrors.min_order_quantity = 'Enter a valid quantity'
    if (isNaN(Number(form.available_quantity)) || Number(form.available_quantity) <= 0) newErrors.available_quantity = 'Enter a valid quantity'
    if (form.moisture_content && (isNaN(Number(form.moisture_content)) || Number(form.moisture_content) < 0 || Number(form.moisture_content) > 100)) {
      newErrors.moisture_content = 'Enter a valid percentage (0–100)'
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error('Please login first'); navigate('/login'); return }

    let photoUrls: string[] = []
    if (images.length > 0) {
      setUploadingImages(true)
      photoUrls = await uploadImages(session.user.id)
      setUploadingImages(false)
    }

    const { error } = await supabase.from('listings').insert({
      exporter_id: session.user.id,
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      price_per_unit: Number(form.price_per_unit),
      currency: 'USD',
      unit: form.unit,
      min_order_quantity: Number(form.min_order_quantity),
      available_quantity: Number(form.available_quantity),
      origin_state: form.origin_state,
      quality_grade: form.quality_grade,
      shipping_terms: form.shipping_terms,
      moisture_content: form.moisture_content ? Number(form.moisture_content) : null,
      processing_type: form.processing_type || null,
      photos: photoUrls.length > 0 ? photoUrls : null,
      status: 'active',
    })

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Product listed successfully')
    navigate('/dashboard/exporter?tab=listings')
  }

  const progressCount = [
    form.title, form.category, form.price_per_unit, form.unit,
    form.min_order_quantity, form.available_quantity, form.origin_state,
    form.quality_grade, form.shipping_terms,
  ].filter(Boolean).length

  const livePrice = form.price_per_unit ? `$${Number(form.price_per_unit).toLocaleString()}` : '$0'
  const liveQuantity = form.available_quantity || '—'
  const liveMinOrder = form.min_order_quantity || '—'
  const liveTitle = form.title || 'Your product title'
  const liveCategory = form.category || 'Category'
  const liveState = form.origin_state || 'Origin state'
  const liveTerms = form.shipping_terms || 'FOB'

  return (
    <div className="mk-root" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom,0px))' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .al-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 24px;
          align-items: start;
        }
        .al-sidebar {
          position: sticky;
          top: 88px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .al-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 11px; border-radius: 999px; font-size: 11px;
          font-weight: 700; letter-spacing: .01em;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.08); color: rgba(255,255,255,.8);
          white-space: nowrap;
        }
        .al-section { border: 1px solid #E2DDD6; border-radius: 16px; background: #fff; overflow: hidden; }
        .al-section-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 18px 20px; background: #FAF9F7;
          border-bottom: 1px solid #F0ECE8;
        }
        .al-section-body { padding: 20px; }
        .al-preview { border-radius: 18px; overflow: hidden; border: 1px solid #E2DDD6; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .al-preview-hero {
          background: linear-gradient(135deg, #0C3825 0%, #1A5C41 100%);
          padding: 18px; color: #fff; position: relative; overflow: hidden;
        }
        .al-preview-hero::after {
          content: ''; position: absolute; right: -30px; top: -30px;
          width: 110px; height: 110px; border-radius: 50%;
          background: rgba(155,122,42,.1);
        }
        .al-preview-body { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
        .al-checklist { display: flex; flex-direction: column; gap: 10px; }
        .al-check {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 11px 12px; border-radius: 12px;
          background: #FAF9F7; border: 1px solid #E7E2DA;
        }
        .al-dot {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800;
        }
        @media (max-width: 1080px) {
          .al-shell { grid-template-columns: 1fr; }
          .al-sidebar { position: static; }
        }
      `}</style>

      {/* Header */}
      <header className="mk-header">
        <div className="mk-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/dashboard/exporter?tab=listings')} className="mk-btn mk-btn-ghost mk-btn-sm" style={{ padding: 8, minHeight: 36, width: 36 }} aria-label="Back">
              <ChevronLeft size={18} />
            </button>
            <div className="mk-logo-frame"><img src="/logo.jpeg" alt="IziXport" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <span className="mk-badge mk-badge-success">Verified</span>
          </div>
        </div>
      </header>

      <div className="mk-container-narrow mk-fade-up" style={{ maxWidth: 1240 }}>
        {/* Hero banner */}
        <div style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(135deg, #0C3825 0%, #1A5C41 100%)', padding: '24px 24px 22px', marginBottom: 18, position: 'relative', boxShadow: '0 12px 30px rgba(12,56,37,0.18)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(155,122,42,.12), transparent 30%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ maxWidth: 720 }}>
              <p className="mk-eyebrow" style={{ color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>New Listing</p>
              <h1 className="mk-h1" style={{ color: '#fff', marginBottom: 10 }}>Publish your product</h1>
              <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 620 }}>
                Add accurate details, upload strong photos, and your product will be visible to verified buyers immediately.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="al-chip">Fast publish</span>
              <span className="al-chip">Verified buyers</span>
              <span className="al-chip">Up to 4 photos</span>
            </div>
          </div>
        </div>

        <div className="al-shell">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Product details */}
            <div className="al-section">
              <div className="al-section-head">
                <div>
                  <p className="mk-eyebrow" style={{ marginBottom: 2 }}>Listing setup</p>
                  <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--mk-text)' }}>Product details</div>
                </div>
                <span className="mk-badge mk-badge-gold" style={{ background: 'rgba(155,122,42,.12)' }}>{progressCount}/9 filled</span>
              </div>

              <div className="al-section-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Field label="Product title *" error={errors.title}>
                    <input className={`mk-field ${errors.title ? 'is-error' : ''}`} placeholder="e.g. Premium Grade-A Sesame Seeds" value={form.title} onChange={e => handleChange('title', e.target.value)} />
                  </Field>

                  <div className="mk-grid-2">
                    <Field label="Category *" error={errors.category}>
                      <div className="mk-select-wrap">
                        <select className={`mk-field ${errors.category ? 'is-error' : ''}`} value={form.category} onChange={e => handleChange('category', e.target.value)}>
                          <option value="">Select…</option>
                          {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                        </select>
                        <ChevronDown size={16} className="mk-chev" />
                      </div>
                    </Field>
                    <Field label="Quality grade *" error={errors.quality_grade}>
                      <div className="mk-select-wrap">
                        <select className={`mk-field ${errors.quality_grade ? 'is-error' : ''}`} value={form.quality_grade} onChange={e => handleChange('quality_grade', e.target.value)}>
                          <option value="">Select…</option>
                          {QUALITY_GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                        <ChevronDown size={16} className="mk-chev" />
                      </div>
                    </Field>
                  </div>

                  {/* ── PRICE REFERENCE PANEL ── shown when category is selected */}
                  {form.category && (
                    <PriceReferencePanel category={CATEGORIES.find(c => c.toLowerCase() === form.category) || ''} />
                  )}

                  <Field label="Description (optional)">
                    <textarea className="mk-field" rows={4} placeholder="Describe your product quality, source, packaging, certifications…" value={form.description} onChange={e => handleChange('description', e.target.value)} style={{ resize: 'vertical', lineHeight: 1.55 }} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Pricing & stock */}
            <div className="al-section">
              <div className="al-section-head">
                <div>
                  <p className="mk-eyebrow" style={{ marginBottom: 2 }}>Pricing & stock</p>
                  <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--mk-text)' }}>Commercial information</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mk-text-3)' }}>Be precise</span>
              </div>
              <div className="al-section-body">
                <div className="mk-grid-2">
                  <Field label="Price per unit (USD) *" error={errors.price_per_unit}>
                    <input type="number" min="0" step="0.01" className={`mk-field ${errors.price_per_unit ? 'is-error' : ''}`} placeholder="0.00" value={form.price_per_unit} onChange={e => handleChange('price_per_unit', e.target.value)} />
                  </Field>
                  <Field label="Unit *" error={errors.unit}>
                    <div className="mk-select-wrap">
                      <select className={`mk-field ${errors.unit ? 'is-error' : ''}`} value={form.unit} onChange={e => handleChange('unit', e.target.value)}>
                        <option value="">Select…</option>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <ChevronDown size={16} className="mk-chev" />
                    </div>
                  </Field>
                </div>
                <div className="mk-grid-2" style={{ marginTop: 18 }}>
                  <Field label="Min order quantity *" error={errors.min_order_quantity}>
                    <input type="number" min="1" className={`mk-field ${errors.min_order_quantity ? 'is-error' : ''}`} placeholder="e.g. 100" value={form.min_order_quantity} onChange={e => handleChange('min_order_quantity', e.target.value)} />
                  </Field>
                  <Field label="Available quantity *" error={errors.available_quantity}>
                    <input type="number" min="1" className={`mk-field ${errors.available_quantity ? 'is-error' : ''}`} placeholder="e.g. 5000" value={form.available_quantity} onChange={e => handleChange('available_quantity', e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Quality specifications — NEW SECTION */}
            <div className="al-section">
              <div className="al-section-head">
                <div>
                  <p className="mk-eyebrow" style={{ marginBottom: 2 }}>Quality specs</p>
                  <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--mk-text)' }}>Product specifications</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mk-text-3)' }}>Builds buyer trust</span>
              </div>
              <div className="al-section-body">
                <div className="mk-grid-2">
                  <Field label="Moisture content % (optional)" error={errors.moisture_content}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className={`mk-field ${errors.moisture_content ? 'is-error' : ''}`}
                      placeholder="e.g. 8.5"
                      value={form.moisture_content}
                      onChange={e => handleChange('moisture_content', e.target.value)}
                    />
                  </Field>
                  <Field label="Processing type (optional)">
                    <div className="mk-select-wrap">
                      <select className="mk-field" value={form.processing_type} onChange={e => handleChange('processing_type', e.target.value)}>
                        <option value="">Select…</option>
                        {PROCESSING_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <ChevronDown size={16} className="mk-chev" />
                    </div>
                  </Field>
                </div>
                <p className="mk-text-muted" style={{ fontSize: 12, marginTop: 10 }}>
                  Moisture content and processing type help buyers assess quality before enquiring — Grade A cashew with 8% moisture converts significantly better than an incomplete listing.
                </p>
              </div>
            </div>

            {/* Logistics */}
            <div className="al-section">
              <div className="al-section-head">
                <div>
                  <p className="mk-eyebrow" style={{ marginBottom: 2 }}>Logistics</p>
                  <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--mk-text)' }}>Origin & trade terms</div>
                </div>
              </div>
              <div className="al-section-body">
                <div className="mk-grid-2">
                  <Field label="Origin state *" error={errors.origin_state}>
                    <div className="mk-select-wrap">
                      <select className={`mk-field ${errors.origin_state ? 'is-error' : ''}`} value={form.origin_state} onChange={e => handleChange('origin_state', e.target.value)}>
                        <option value="">Select…</option>
                        {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={16} className="mk-chev" />
                    </div>
                  </Field>
                  <Field label="Shipping terms *" error={errors.shipping_terms}>
                    <div className="mk-select-wrap">
                      <select className={`mk-field ${errors.shipping_terms ? 'is-error' : ''}`} value={form.shipping_terms} onChange={e => handleChange('shipping_terms', e.target.value)}>
                        <option value="">Select…</option>
                        {SHIPPING_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={16} className="mk-chev" />
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="al-section">
              <div className="al-section-head">
                <div>
                  <p className="mk-eyebrow" style={{ marginBottom: 2 }}>Media</p>
                  <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--mk-text)' }}>Product images</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--mk-text-3)', fontWeight: 600 }}>Up to 4 files</span>
              </div>
              <div className="al-section-body">
                <div>
                  <label className="mk-label">Upload photos</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 4 }}>
                    {images.map((file, idx) => (
                      <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', border: '1px solid var(--mk-border)' }}>
                        <img src={URL.createObjectURL(file)} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeImage(idx)} aria-label="Remove image" style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: 'rgba(15,23,42,.7)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed #cbd5e1', background: 'var(--mk-surface-alt)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--mk-text-3)', cursor: 'pointer', fontFamily: 'var(--mk-font-heading)', fontSize: 11, fontWeight: 600 }}>
                        <Upload size={18} />
                        Add photo
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
                  <p className="mk-text-muted" style={{ fontSize: 12, marginTop: 8 }}>First image is the cover. JPEG or PNG, max 5MB each.</p>
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading || uploadingImages} className="mk-btn mk-btn-primary mk-btn-block" style={{ marginTop: 4 }}>
              {loading || uploadingImages
                ? <><Loader2 size={16} className="mk-spin" /> {uploadingImages ? 'Uploading images…' : 'Publishing…'}</>
                : 'List my product'}
            </button>

            <p className="mk-text-muted" style={{ fontSize: 12, textAlign: 'center', marginTop: -2 }}>
              Your product will be listed as <span style={{ color: 'var(--mk-emerald)', fontWeight: 700 }}>Active</span> and visible to buyers immediately.
            </p>
          </div>

          {/* Right sidebar */}
          <div className="al-sidebar">
            <div className="al-preview">
              <div className="al-preview-hero">
                <p style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,.55)', margin: '0 0 10px' }}>Live preview</p>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span className="al-chip">Active</span>
                    <span className="al-chip">Verified buyers</span>
                  </div>
                  <div style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 800, fontSize: 22, lineHeight: 1.05, marginBottom: 8 }}>{liveTitle}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,.72)', margin: 0 }}>
                    {form.description || 'Add a short, clear description so buyers know what makes your product reliable.'}
                  </p>
                </div>
              </div>
              <div className="al-preview-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 12, background: '#FAF9F7', border: '1px solid #E7E2DA' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#A8A29E', margin: '0 0 4px' }}>Price</p>
                    <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: '#1C1917' }}>{livePrice}</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, background: '#FAF9F7', border: '1px solid #E7E2DA' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#A8A29E', margin: '0 0 4px' }}>MOQ</p>
                    <div style={{ fontFamily: 'var(--mk-font-heading)', fontSize: 18, fontWeight: 800, color: '#1C1917' }}>{liveMinOrder} {form.unit || ''}</div>
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: '#FAF9F7', border: '1px solid #E7E2DA' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#A8A29E', margin: '0 0 4px' }}>Listing summary</p>
                  <div style={{ color: '#1C1917', fontSize: 13, lineHeight: 1.7 }}>
                    <strong>{liveCategory}</strong> · {liveState} · {liveTerms}<br />
                    Available: <strong>{liveQuantity}</strong> {form.unit || ''}<br />
                    Grade: <strong>{form.quality_grade || '—'}</strong>
                    {form.moisture_content && <><br />Moisture: <strong>{form.moisture_content}%</strong></>}
                    {form.processing_type && <><br />Type: <strong>{PROCESSING_TYPES.find(p => p.value === form.processing_type)?.label || '—'}</strong></>}
                  </div>
                </div>

                <div className="al-checklist">
                  {[
                    { label: 'Add a clear title', done: !!form.title },
                    { label: 'Choose category and grade', done: !!form.category && !!form.quality_grade },
                    { label: 'Set price and unit', done: !!form.price_per_unit && !!form.unit },
                    { label: 'Add origin and shipping terms', done: !!form.origin_state && !!form.shipping_terms },
                    { label: 'Upload at least one image', done: images.length > 0 },
                    { label: 'Add moisture content (bonus)', done: !!form.moisture_content },
                  ].map(item => (
                    <div key={item.label} className="al-check">
                      <div className="al-dot" style={{ background: item.done ? '#0C3825' : '#F5F2EC', color: item.done ? '#fff' : '#A8A29E', border: `1px solid ${item.done ? '#0C3825' : '#E2DDD6'}` }}>
                        {item.done ? '✓' : '•'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1917', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 11.5, color: '#78726A', lineHeight: 1.5 }}>
                          {item.done ? 'Ready' : 'Still needed before publishing.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(26,92,65,.06)', border: '1px solid rgba(26,92,65,.14)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9B7A2A', margin: '0 0 6px' }}>Quick tip</p>
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: '#44403C', margin: 0 }}>
                    Adding moisture content and processing type makes your listing stand out from incomplete ones — buyers compare specs before enquiring.
                  </p>
                </div>
              </div>
            </div>

            <div className="al-preview" style={{ padding: 18 }}>
              <p style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, color: '#9B7A2A', margin: '0 0 10px' }}>Publishing checklist</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Use the real product name buyers search for.',
                  'Keep quantity and pricing accurate.',
                  'Add clean images with good lighting.',
                  'Select the correct origin state and shipping terms.',
                  'Add moisture content — agro buyers always check this.',
                ].map(text => (
                  <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, lineHeight: 1.6, color: '#57534E' }}>
                    <span style={{ color: '#0C3825', fontWeight: 800 }}>•</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}