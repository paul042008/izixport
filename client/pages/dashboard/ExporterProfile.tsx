// src/pages/dashboard/ExporterProfile.tsx
// REDESIGN — Executive Emerald. All business logic preserved.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, Clock, X, ChevronDown, Loader2, AlertCircle, Landmark, LogOut, Pencil,
  Home, Library, MessageCircle, MapPin, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import NotificationBell from '@/components/NotificationBell'
import '@/styles/marketplace.css'

interface UserProfile {
  id: string
  email: string
  full_name: string
  company_name: string
  country: string
  business_state: string
  primary_product: string
  whatsapp_number: string
  verified: boolean
  verification_status: string
  total_traded: number
  deals_completed: number
  created_at: string
  payout_verified?: boolean | null
  bank_name?: string | null
  bank_account_number?: string | null
}

const maskEmail = (email: string) => {
  if (!email) return ''
  const [local, domain] = email.split('@')
  return local.slice(0, 3) + '***@' + domain
}

const getInitials = (company: string, fullName: string) => {
  const src = company || fullName || ''
  return src.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
]
const PRODUCTS = [
  'Cashew Nuts','Cocoa Beans','Sesame Seeds','Shea Butter',
  'Ginger','Palm Oil','Leather Goods','Textiles','Other',
]

const Sk = ({ w = '100%', h = 16 }: { w?: string | number; h?: number }) => (
  <div className="mk-skeleton" style={{ width: w, height: h }} />
)

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
          const isActive = window.location.pathname === tab.path || tab.name === 'Profile'
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

export default function ExporterProfile() {
  const navigate = useNavigate()
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const [editData, setEditData] = useState({ company_name: '', business_state: '', primary_product: '', whatsapp_number: '', description: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (error || !data) { toast.error('Failed to load profile'); return }

      setProfile(data as UserProfile)
      setIsVerified(data.verification_status === 'approved')
      setEditData({
        company_name:    data.company_name || '',
        business_state:  data.business_state || '',
        primary_product: data.primary_product || '',
        whatsapp_number: data.whatsapp_number || '',
        description:     data.description || '',
      })
      setLoading(false)
    }
    load()
  }, [navigate])

  const openEdit = () => {
    if (!profile) return
    setEditData({
      company_name:    profile.company_name || '',
      business_state:  profile.business_state || '',
      primary_product: profile.primary_product || '',
      whatsapp_number: profile.whatsapp_number || '',
      description:     (profile as any).description || '',
    })
    setEditErrors({})
    setShowEdit(true)
  }

  const handleSave = async () => {
    const errors: Record<string, string> = {}
    if (!editData.company_name.trim())    errors.company_name    = 'Required'
    if (!editData.business_state.trim())  errors.business_state  = 'Required'
    if (!editData.primary_product.trim()) errors.primary_product = 'Required'
    if (Object.keys(errors).length) { setEditErrors(errors); return }
    setEditErrors({})
    setEditLoading(true)

    const { error } = await supabase
      .from('users')
      .update({
        company_name:    editData.company_name.trim(),
        business_state:  editData.business_state,
        primary_product: editData.primary_product,
        whatsapp_number: editData.whatsapp_number.trim() || null,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', profile!.id)

    setEditLoading(false)
    if (error) { toast.error('Failed to update profile. Please try again.'); return }

    toast.success('Profile updated')
    setProfile(prev => prev ? { ...prev, ...editData } : prev)
    setShowEdit(false)
  }

  const setF = (k: keyof typeof editData, v: string) => {
    setEditData(prev => ({ ...prev, [k]: v }))
    setEditErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  const handleSignOut = async () => {
    const confirmSignOut = window.confirm('Are you sure you want to sign out?')
    if (!confirmSignOut) return

    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const isProfileVerified = profile?.verified && profile?.verification_status === 'approved'
  const initials  = profile ? getInitials(profile.company_name, profile.full_name) : '?'
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="mk-root" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom,0px))' }}>
      {/* Header — with a clearly visible sign‑out button (now with confirmation) */}
      <header className="mk-header">
        <div className="mk-header-inner">
          <div className="mk-logo-frame"><img src="/logo.jpeg" alt="IziXport" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <span className={`mk-badge ${isVerified ? 'mk-badge-success' : 'mk-badge-warning'}`}>
              {isVerified ? <><CheckCircle2 size={11} /> Verified</> : <><Clock size={11} /> Pending</>}
            </span>
            {/* Sign‑out button in header */}
            <button
              onClick={handleSignOut}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
              }}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Edit modal (unchanged) */}
      {showEdit && (
        <div
          className="mk-backdrop mk-fade-in"
          onClick={e => { if (e.target === e.currentTarget && !editLoading) setShowEdit(false) }}
        >
          <div className="mk-sheet mk-slide-up">
            <div className="mk-sheet-grab" />
            <div style={{ background: 'var(--mk-emerald-dark)', padding: '20px 24px 22px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase' }}>Edit profile</span>
                <button
                  onClick={() => { if (!editLoading) setShowEdit(false) }}
                  style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
                  aria-label="Close"
                >
                  <X size={15} color="rgba(255,255,255,.75)" />
                </button>
              </div>
              <h2 style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 700, fontSize: 22, margin: 0, letterSpacing: '-0.01em' }}>Update your details</h2>
            </div>

            <div style={{ overflowY: 'auto', padding: '22px 24px 0', flex: 1 }}>
              {[
                { key: 'company_name' as const,   label: 'Company name',   placeholder: 'e.g. Adebayo Farms Ltd', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="mk-label" style={{ marginBottom: 0 }}>{f.label}</span>
                    {editErrors[f.key] && <span style={{ fontSize: 11, color: 'var(--mk-danger)', fontWeight: 600 }}>{editErrors[f.key]}</span>}
                  </div>
                  <input
                    className={`mk-field ${editErrors[f.key] ? 'is-error' : ''}`}
                    value={editData[f.key]}
                    onChange={e => setF(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="mk-label" style={{ marginBottom: 0 }}>Business state</span>
                  {editErrors.business_state && <span style={{ fontSize: 11, color: 'var(--mk-danger)', fontWeight: 600 }}>{editErrors.business_state}</span>}
                </div>
                <div className="mk-select-wrap">
                  <select className={`mk-field ${editErrors.business_state ? 'is-error' : ''}`} value={editData.business_state} onChange={e => setF('business_state', e.target.value)} style={{ paddingRight: 36 }}>
                    <option value="">Select state…</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} className="mk-chev" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="mk-label" style={{ marginBottom: 0 }}>Primary product</span>
                  {editErrors.primary_product && <span style={{ fontSize: 11, color: 'var(--mk-danger)', fontWeight: 600 }}>{editErrors.primary_product}</span>}
                </div>
                <div className="mk-select-wrap">
                  <select className={`mk-field ${editErrors.primary_product ? 'is-error' : ''}`} value={editData.primary_product} onChange={e => setF('primary_product', e.target.value)} style={{ paddingRight: 36 }}>
                    <option value="">Select product…</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="mk-chev" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span className="mk-label">WhatsApp number</span>
                <input className="mk-field" value={editData.whatsapp_number} onChange={e => setF('whatsapp_number', e.target.value)} placeholder="+234…" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span className="mk-label">Bio / description (optional)</span>
                <textarea
                  className="mk-field"
                  value={editData.description}
                  onChange={e => setF('description', e.target.value)}
                  placeholder="Tell buyers about your business, certifications, experience…"
                  rows={3}
                  style={{ resize: 'vertical', lineHeight: 1.55 }}
                />
              </div>

              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: 'var(--mk-emerald-light)', border: '1px solid rgba(13,122,95,.2)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 24,
              }}>
                <AlertCircle size={15} style={{ color: 'var(--mk-emerald)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: 'var(--mk-text-2)', fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
                  To change your <strong style={{ color: 'var(--mk-text)' }}>email address</strong>, please contact IziXport support.
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 24px 22px', borderTop: '1px solid var(--mk-border)', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleSave} disabled={editLoading} className="mk-btn mk-btn-primary mk-btn-block">
                {editLoading ? (<><Loader2 size={16} className="mk-spin" /> Saving…</>) : 'Save changes'}
              </button>
              <button onClick={() => { if (!editLoading) setShowEdit(false) }} className="mk-btn mk-btn-ghost mk-btn-block">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mk-container-narrow mk-fade-up" style={{ maxWidth: 640 }}>
        <p className="mk-eyebrow">Account</p>
        <h1 className="mk-h1" style={{ marginBottom: 22 }}>Company profile</h1>

        {/* Bank prompt (unchanged) */}
        {!loading && profile && !profile.payout_verified && (
          <button
            type="button"
            onClick={() => navigate('/dashboard/exporter/bank-details')}
            style={{
              width: '100%', textAlign: 'left', marginBottom: 16, padding: '14px 18px', borderRadius: 12,
              background: 'var(--mk-gold-light)', border: '1px solid rgba(201,168,76,.5)', cursor: 'pointer',
              color: '#7c5e10', fontSize: 14, fontWeight: 600, lineHeight: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              fontFamily: 'var(--mk-font-body)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Landmark size={16} /> Add your bank account to receive payouts
            </span>
            <span style={{ color: 'var(--mk-emerald-dark)', fontWeight: 700 }}>Add →</span>
          </button>
        )}

        {/* Hero card */}
        <div className="mk-card mk-fade-up" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #04382a 0%, #064e3b 55%, #0d7a5f 100%)',
            padding: '36px 24px 56px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,.18), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{
              width: 76, height: 76, borderRadius: 18,
              background: 'var(--mk-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mk-font-heading)', fontWeight: 700, fontSize: 26, color: 'var(--mk-emerald-dark)',
              margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(0,0,0,.18)', letterSpacing: '-0.02em',
            }}>
              {loading ? '··' : initials}
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Sk w={180} h={22} />
                <Sk w={130} h={14} />
              </div>
            ) : (
              <>
                <h2 style={{ color: '#fff', fontFamily: 'var(--mk-font-heading)', fontWeight: 700, fontSize: 22, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {profile?.company_name || profile?.full_name || 'Exporter'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, margin: '0 0 14px' }}>
                  {maskEmail(profile?.email || '')}
                </p>
                <span className={`mk-badge ${isProfileVerified ? 'mk-badge-success' : 'mk-badge-gold'}`} style={{ background: isProfileVerified ? 'rgba(255,255,255,.16)' : 'rgba(201,168,76,.2)', borderColor: 'transparent', color: '#fff' }}>
                  {isProfileVerified ? <><CheckCircle2 size={11} /> Verified exporter</> : <><Clock size={11} /> Verification pending</>}
                </span>
              </>
            )}
          </div>

          {/* Details (unchanged) */}
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', marginTop: -20, padding: '20px 24px 8px' }}>
            {loading ? (
              [1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 8 ? '1px solid var(--mk-border-light)' : 'none' }}>
                  <Sk w="35%" h={13} />
                  <Sk w="45%" h={13} />
                </div>
              ))
            ) : (
              [
                { label: 'Business type',   value: profile?.primary_product ? `${profile.primary_product} Exporter` : 'Agricultural Exporter' },
                { label: 'Country',         value: profile?.country || 'Nigeria' },
                { label: 'Business state',  value: profile?.business_state || '—' },
                { label: 'Primary product', value: profile?.primary_product || '—' },
                { label: 'WhatsApp',        value: profile?.whatsapp_number || '—' },
                { label: 'Member since',    value: memberSince },
                { label: 'Deals closed',    value: (profile?.deals_completed ?? 0).toString() },
                { label: 'Trade volume',    value: `$${(profile?.total_traded ?? 0).toLocaleString()}` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--mk-border-light)' : 'none',
                }}>
                  <span style={{ color: 'var(--mk-text-2)', fontSize: 13, fontWeight: 500 }}>{row.label}</span>
                  <span className={row.label === 'Trade volume' || row.label === 'Deals closed' ? 'mk-num' : ''} style={{ color: 'var(--mk-text)', fontSize: 13.5, fontWeight: 600 }}>
                    {row.value}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Actions (unchanged) – now includes a sign‑out button with confirmation */}
          <div style={{ padding: '12px 24px 24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile?.payout_verified && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', background: 'var(--mk-emerald-light)', border: '1px solid rgba(13,122,95,.2)',
                borderRadius: 10, marginBottom: 4,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--mk-text-2)', fontSize: 13 }}>
                  <Landmark size={14} style={{ color: 'var(--mk-emerald)' }} /> Bank account
                </span>
                <span className="mk-num" style={{ color: 'var(--mk-emerald-dark)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {profile.bank_name} ••••{profile.bank_account_number?.slice(-4)}
                  <CheckCircle2 size={13} />
                </span>
              </div>
            )}
            <button type="button" onClick={() => navigate('/dashboard/exporter/bank-details')} className="mk-btn mk-btn-gold mk-btn-block">
              <Landmark size={16} /> Bank account
            </button>
            <button type="button" onClick={openEdit} className="mk-btn mk-btn-dark mk-btn-block">
              <Pencil size={15} /> Edit profile
            </button>
            {/* Sign‑out button in actions */}
            <button
              type="button"
              onClick={handleSignOut}
              className="mk-btn mk-btn-outline mk-btn-block"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}