// src/pages/dashboard/ExporterDashboard.tsx
// REDESIGNED - Gemini Style UI
import React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import NotificationBell from '@/components/NotificationBell'
import {
  Lock,
  Package,
  MessagesSquare,
  Truck,
  Wallet,
  Users,
  Camera,
  FileText,
  Phone,
  CheckCircle2,
  Clock,
  Home,
  Library,
  MessageCircle,
  MapPin,
  User,
  Share2,
  Plus,
  Eye,
  TrendingUp,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Loader2,
  DollarSign,
  Shield,
  Check,
  Send,
  Zap,
  Calendar,
  Edit2,
  Briefcase,
  Video,
  PlusCircle,
  Globe,
  Award,
  LogOut,
  Search,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import {
  displayName,
  displayBuyerName,
  displayProductTitle,
  formatMoney,
  formatDate,
} from '@/lib/format'

// ─── Types ────────────────────────────────────────────────────────────────────
type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected'
type Tab = 'home' | 'listings' | 'inquiries' | 'track' | 'profile'

interface UserProfile {
  id: string
  email: string
  full_name: string
  company_name: string
  country: string
  verification_status: VerificationStatus
  referral_code: string
  total_traded: number
  deals_completed: number
  created_at: string
  email_verified?: boolean
}

interface ExporterListing {
  id: string
  title: string
  price_per_unit: number
  currency: string
  unit: string
  min_order_quantity: number
  available_quantity: number
  origin_state: string
  quality_grade: string
  enquiry_count: number
  views_count: number
  status: string
  category: string
  created_at: string
  photos: string[] | null
}

interface InquiryOrder {
  id: string
  listing_id: string
  listing_title: string
  buyer_company: string
  quantity: number
  listing_unit: string
  total_amount: number
  order_status: string
  created_at: string
  checklist?: { step_key: string; step_label: string; completed: boolean }[]
}

interface ExporterStats {
  activeListings: number
  newInquiries: number
  dealsClosed: number
  totalEarned: number
  pendingPayout: number
}

// ─── Commodity meta ───────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; accent: string }> = {
  'hibiscus':  { emoji: '🌺', accent: '#C06080' },
  'sesame':    { emoji: '🌾', accent: '#C4A84A' },
  'ginger':    { emoji: '🫚', accent: '#D4A843' },
  'cashew':    { emoji: '🥜', accent: '#B87840' },
  'cocoa':     { emoji: '🍫', accent: '#8B5E3C' },
  'pepper':    { emoji: '🌶️', accent: '#D45050' },
  'palm oil':  { emoji: '🛢️', accent: '#D4721A' },
  'shea':      { emoji: '🌿', accent: '#6AAD5A' },
}

const getCategoryMeta = (category: string, title: string): { emoji: string; accent: string } => {
  const key = Object.keys(CATEGORY_META).find(k =>
    category?.toLowerCase().includes(k) || title?.toLowerCase().includes(k)
  )
  return key ? CATEGORY_META[key] : { emoji: '📦', accent: '#9B7A2A' }
}

// ─── Brand colors ─────────────────────────────────────────────────────────────
const COLORS = {
  navBg: '#0C3825',
  primary: '#1A5C41',
  primaryDark: '#0C3825',
  primaryLight: 'rgba(26,92,65,0.08)',
  accent: '#9B7A2A',
  accentLight: 'rgba(155,122,42,0.08)',
  bg: '#F1EDE6',
  surface: '#FFFFFF',
  border: '#DDD8D0',
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  white: '#FFFFFF',
  gray50: '#FAF9F7',
  gray100: '#F5F2EC',
  gray200: '#E7E2DA',
  gray300: '#D1CBC1',
  gray400: '#A8A29E',
  gray500: '#78726A',
  gray600: '#57534E',
  gray700: '#44403C',
  gray800: '#292524',
  gray900: '#1C1917',
}

// ─── Rotating messages ────────────────────────────────────────────────────────
const ROTATING_MESSAGES = [
  "Add high-quality photos — products with images get 3× more inquiries",
  "Reply within 24 hours — fast responses build trust and close deals",
  "Competitive pricing + MOQ flexibility attracts serious buyers",
  "Get verified — verified exporters appear first in search results",
  "Keep stock levels updated — buyers trust real availability",
  "Ask satisfied buyers for reviews — ratings boost your visibility",
]

const LISTING_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:         { label: 'Active',       color: '#166534', bg: '#F0FDF4', border: 'rgba(22,163,74,0.25)' },
  inactive:       { label: 'Inactive',     color: '#44403C', bg: '#F5F2EC', border: 'rgba(168,162,158,0.3)' },
  pending_review: { label: 'Under Review', color: '#92400E', bg: '#FEF3C7', border: 'rgba(217,119,6,0.25)' },
  rejected:       { label: 'Rejected',     color: '#991B1B', bg: '#FEF2F2', border: 'rgba(239,68,68,0.25)' },
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  enquiring:        'Negotiating',
  payment_pending:  'Awaiting Payment',
  escrow_confirmed: 'In Escrow',
  shipped:          'Shipped',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
}


// ─── CSS ──────────────────────────────────────────────────────────────────────
const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --nav-bg: #0C3825;
    --primary: #1A5C41;
    --primary-dk: #0C3825;
    --primary-lt: rgba(26,92,65,0.07);
    --accent: #9B7A2A;
    --accent-lt: rgba(155,122,42,0.08);
    --bg: #F1EDE6;
    --surface: #FFFFFF;
    --border: #E0DAD3;
    --text: #1C1917;
    --text-2: #57534E;
    --text-3: #A8A29E;
  }

  @keyframes eFadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes eFadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes eSlideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:none} }
  @keyframes eSpin     { to{transform:rotate(360deg)} }
  @keyframes eShimmer  { 0%{background-position:-200%} 100%{background-position:200%} }
  @keyframes eScaleIn  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes ePopIn    { 0%{opacity:0;transform:scale(.92)} 70%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }

  .e-fu   { animation: eFadeUp  0.45s cubic-bezier(.16,1,.3,1) both }
  .e-fi   { animation: eFadeIn  0.3s ease both }
  .e-si   { animation: eScaleIn 0.3s cubic-bezier(.16,1,.3,1) both }
  .e-pi   { animation: ePopIn   0.4s cubic-bezier(.16,1,.3,1) both }
  .e-spin { animation: eSpin    0.9s linear infinite }

  .skel {
    background: linear-gradient(90deg,#ebe8e2 25%,#ddd9d2 50%,#ebe8e2 75%);
    background-size: 200% 100%;
    animation: eShimmer 1.5s infinite;
    border-radius: 5px;
  }

  ::-webkit-scrollbar { width:3px; height:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:rgba(26,92,65,.2); border-radius:3px }

  .exp-root {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F1EDE6;
    min-height: 100vh;
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 8px));
    overflow-x: hidden;
  }

  .exp-sidebar {
    display: none;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 240px;
    background: #0C3825;
    flex-direction: column;
    z-index: 40;
    overflow-y: auto;
  }

  .exp-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px;
    border: none; background: none; cursor: pointer;
    color: rgba(255,255,255,0.5);
    font-weight: 600; font-size: 13.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    width: 100%; text-align: left;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .exp-nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
  .exp-nav-item.active { background: rgba(255,255,255,0.1); color: white; font-weight: 700; }
  .exp-nav-dot { margin-left: auto; width: 7px; height: 7px; border-radius: 50%; background: #9B7A2A; flex-shrink: 0; }

  .horizontal-scroll {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 14px;
    padding-bottom: 6px;
    -webkit-overflow-scrolling: touch;
  }
  .horizontal-scroll::-webkit-scrollbar { height: 3px; }
  .horizontal-scroll::-webkit-scrollbar-track { background: #F5F2EC; border-radius: 3px; }
  .horizontal-scroll::-webkit-scrollbar-thumb { background: #D1CBC1; border-radius: 3px; }

  .split-listing-container { display: flex; flex-direction: column; gap: 20px; }

  .rotating-panel {
    display: none;
    background: white;
    border: 1px solid #E2DDD6;
    border-radius: 12px;
    padding: 22px 18px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .listings-grid-right { display: flex; flex-direction: column; gap: 14px; }

  .fiverr-stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: #E2DDD6;
    border-radius: 0 0 12px 12px; overflow: hidden;
  }
  .fiverr-stat-card { background: white; padding: 14px 12px; text-align: center; }

  .exp-card {
    background: white;
    border: 1px solid #E2DDD6;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
  }
  .exp-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    border-color: rgba(26,92,65,0.25);
  }

  .btn-primary {
    background: #0C3825;
    color: white; font-weight: 700; font-size: 13px;
    border: none; border-radius: 8px; cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 10px 18px; min-height: 40px;
    display: inline-flex; align-items: center; gap: 7px;
    white-space: nowrap;
  }
  .btn-primary:hover { background: #1A5C41; }
  .btn-primary:active { transform: scale(.98); }
  .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

  .btn-outline {
    background: white; border: 1px solid #D1CBC1; color: #44403C;
    font-weight: 600; font-size: 13px; cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    border-radius: 8px; padding: 9px 18px; min-height: 40px;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .btn-outline:hover { background: #FAF9F7; border-color: #1A5C41; color: #1A5C41; }

  @media (min-width: 768px) {
    .exp-bottom-nav    { display: none !important; }
    .exp-sidebar       { display: flex !important; }
    .exp-root          { padding-bottom: 0 !important; }
    .exp-header-inner  { max-width: none !important; padding-left: 264px !important; padding-right: 32px !important; }
    .exp-content-inner { margin-left: 240px !important; max-width: none !important; padding: 28px 32px 40px !important; }
  }

  @media (min-width: 1024px) {
    .rotating-panel { display: block !important; }

    .split-listing-container {
      display: flex !important;
      flex-direction: row !important;
      gap: 28px !important;
      align-items: flex-start !important;
    }
    .rotating-panel {
      flex: 0 0 280px !important;
      position: sticky !important;
      top: 88px !important;
    }
    .listings-grid-right {
      flex: 1 !important;
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 16px !important;
    }
  }

  @media (max-width: 767px) {
    .exp-content-inner { padding: 16px 16px 0 !important; max-width: 100% !important; }
    .exp-header-inner  { padding-left: 16px !important; padding-right: 16px !important; max-width: 100% !important; }
  }
`

const D = (ms: number): React.CSSProperties => ({
  animationDelay: `${ms}ms`,
  animationFillMode: 'both',
})

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 16, style, className }: { w?: string | number; h?: number; style?: React.CSSProperties; className?: string }) => (
  <div className={`skel ${className || ''}`} style={{ width: w, height: h, ...style }} />
)

// ─── Locked state ─────────────────────────────────────────────────────────────
const LockedState = ({ message }: { message: string }) => (
  <div className="e-pi" style={{
    background: 'white', border: '1px solid #E2DDD6', borderRadius: 12,
    padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: '#F5F2EC', border: '1px solid #E2DDD6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 18px',
    }}>
      <Lock size={22} color="#A8A29E" />
    </div>
    <h3 style={{ color: COLORS.gray900, fontWeight: 800, fontSize: 18, fontFamily: 'Barlow Condensed, sans-serif', margin: '0 0 8px' }}>
      Pending Review
    </h3>
    <p style={{ color: COLORS.gray500, fontSize: 13, lineHeight: 1.75, margin: 0, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
      {message}
    </p>
  </div>
)

// ─── Exporter Tips Panel ─────────────────────────────────────────────────────
const ExporterTipsPanel = React.memo(({ messages }: { messages: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!messages.length) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="rotating-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color={COLORS.accent} />
          <h3 style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 17, margin: 0,
          }}>
            Exporter Tips
          </h3>
        </div>

        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.65,
            color: COLORS.gray600,
            minHeight: 88,
            borderLeft: `2px solid ${COLORS.accent}60`,
            paddingLeft: 12,
            transition: 'opacity 0.25s ease',
            willChange: 'opacity',
          }}
        >
          {messages[currentIndex]}
        </div>

        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
          {messages.map((_, idx) => (
            <div key={idx} style={{
              width: idx === currentIndex ? 18 : 5,
              height: 5,
              borderRadius: idx === currentIndex ? 3 : '50%',
              background: idx === currentIndex ? COLORS.primary : '#D1CBC1',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ background: COLORS.primaryLight, borderRadius: 10, padding: 14 }}>
          <Shield size={16} color={COLORS.primary} style={{ marginBottom: 7 }} />
          <p style={{ fontSize: 12, color: COLORS.gray600, margin: 0, lineHeight: 1.6 }}>
            Verified exporters get priority placement and higher conversion rates.
          </p>
        </div>
      </div>
    </div>
  )
})


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ExporterDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const [stats, setStats] = useState<ExporterStats>({ activeListings: 0, newInquiries: 0, dealsClosed: 0, totalEarned: 0, pendingPayout: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [listings, setListings] = useState<ExporterListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [inquiries, setInquiries] = useState<InquiryOrder[]>([])
  const [inquiriesLoading, setInquiriesLoading] = useState(true)
  const [allOrders, setAllOrders] = useState<InquiryOrder[]>([])

  // ── Product Detail Modal State ──────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<ExporterListing | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  // Inject styles once
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = fontStyle
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const [searchParams] = useSearchParams()
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['home', 'listings', 'inquiries', 'track', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam as Tab)
    }
  }, [searchParams])

  // ── Auth + Profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          console.log('No session, redirecting to login')
          navigate('/login', { replace: true })
          return
        }

        const { data: prof, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !prof) {
          console.error('Profile fetch error:', error)
          toast.error('Please complete your onboarding first.')
          navigate('/onboarding/exporter', { replace: true })
          return
        }

        if (prof.role && prof.role !== 'exporter' && prof.role !== 'admin') {
          toast.error(`This account is registered as a ${prof.role}.`)
          await supabase.auth.signOut()
          navigate('/login', { replace: true })
          return
        }

        setProfile(prof as UserProfile)
        setVerificationStatus(prof.verification_status as VerificationStatus)
        setLoading(false)
      } catch (err) {
        console.error('Dashboard init error:', err)
        toast.error('Unable to load dashboard. Please try again.')
        navigate('/login', { replace: true })
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        navigate('/login', { replace: true })
      }
    })
    return () => { listener?.subscription.unsubscribe() }
  }, [navigate])

  // ── Sign out handler ────────────────────────────────────────────────────────
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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!profile) return
    setStatsLoading(true)

    const [{ data: listingRows }, { data: orderRows }] = await Promise.all([
      supabase.from('listings').select('id, status').eq('exporter_id', profile.id),
      supabase.from('orders').select('id, order_status, escrow_status, exporter_payout_amount, total_amount').eq('exporter_id', profile.id),
    ])

    const activeListings = (listingRows || []).filter(l => l.status === 'active').length
    const newInquiries   = (orderRows || []).filter(o => o.order_status === 'enquiring').length
    const dealsClosed    = (orderRows || []).filter(o => ['delivered','completed'].includes(o.order_status)).length

    const pendingPayout = (orderRows || [])
      .filter(o => ['held','confirmed'].includes(o.escrow_status) && !['completed','cancelled'].includes(o.order_status))
      .reduce((s, o) => {
        const net = o.exporter_payout_amount || (o.total_amount || 0) * 0.97
        return s + net
      }, 0)

    const totalEarned = (orderRows || [])
      .filter(o => o.order_status === 'completed')
      .reduce((s, o) => {
        const net = o.exporter_payout_amount || (o.total_amount || 0) * 0.97
        return s + net
      }, 0)

    setStats({ activeListings, newInquiries, dealsClosed, totalEarned, pendingPayout })
    setStatsLoading(false)
  }, [profile])

  // ── Listings ───────────────────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    if (!profile) return
    setListingsLoading(true)

    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price_per_unit, currency, unit, min_order_quantity, available_quantity, origin_state, quality_grade, enquiry_count, views_count, status, category, created_at, photos')
      .eq('exporter_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error && data) setListings(data as ExporterListing[])
    setListingsLoading(false)
  }, [profile])

  // ── Inquiries ──────────────────────────────────────────────────────────────
  const fetchInquiries = useCallback(async () => {
    if (!profile) return
    setInquiriesLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, listing_id, quantity, total_amount, order_status, created_at,
        listing:listings!orders_listing_id_fkey ( title, unit ),
        buyer:users!orders_buyer_id_fkey ( company_name, full_name )
      `)
      .eq('exporter_id', profile.id)
      .not('order_status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setInquiries(data.map((o: any) => ({
        id: o.id,
        listing_id: o.listing_id,
        listing_title: displayProductTitle(Array.isArray(o.listing) ? o.listing[0]?.title : o.listing?.title),
        buyer_company: displayBuyerName(
          (Array.isArray(o.buyer) ? o.buyer[0]?.company_name : o.buyer?.company_name)
          || (Array.isArray(o.buyer) ? o.buyer[0]?.full_name : o.buyer?.full_name),
        ),
        quantity: o.quantity || 0,
        listing_unit: (Array.isArray(o.listing) ? o.listing[0]?.unit : o.listing?.unit) || 'unit',
        total_amount: o.total_amount || 0,
        order_status: o.order_status,
        created_at: o.created_at,
      })))
    }
    setInquiriesLoading(false)
  }, [profile])

  // ── All Orders (for pipeline) ───────────────────────────────────────────────
  const fetchAllOrders = useCallback(async () => {
    if (!profile) return
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, listing_id, quantity, total_amount, order_status, created_at,
        listing:listings!orders_listing_id_fkey ( title, unit ),
        buyer:users!orders_buyer_id_fkey ( company_name, full_name ),
        deal_checklist(step_key,step_label,completed)
      `)
      .eq('exporter_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAllOrders(data.map((o: any) => ({
        id: o.id,
        listing_id: o.listing_id,
        listing_title: displayProductTitle(Array.isArray(o.listing) ? o.listing[0]?.title : o.listing?.title),
        buyer_company: displayBuyerName(
          (Array.isArray(o.buyer) ? o.buyer[0]?.company_name : o.buyer?.company_name)
          || (Array.isArray(o.buyer) ? o.buyer[0]?.full_name : o.buyer?.full_name),
        ),
        quantity: o.quantity || 0,
        listing_unit: (Array.isArray(o.listing) ? o.listing[0]?.unit : o.listing?.unit) || 'unit',
        total_amount: o.total_amount || 0,
        order_status: o.order_status,
        created_at: o.created_at,
        checklist: (o.deal_checklist || []).map((c: any) => ({
          step_key: c.step_key,
          step_label: c.step_label,
          completed: c.completed,
        })),
      })))
    }
  }, [profile])

  const getNextPendingStep = (deal: InquiryOrder) => {
    if (!deal.checklist || deal.checklist.length === 0) return null
    const pending = deal.checklist.filter(c => !c.completed)
    if (pending.length === 0) return null
    const stepOrder = ['commercial_invoice','packing_list','certificate_of_origin','phytosanitary_cert','goods_to_carrier','bill_of_lading','delivered']
    pending.sort((a, b) => stepOrder.indexOf(a.step_key) - stepOrder.indexOf(b.step_key))
    return pending[0]
  }

  // Real-time new enquiries
  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel('exporter-new-orders')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `exporter_id=eq.${profile.id}` },
        (payload) => {
          const fetchNewOrder = async () => {
            const { data } = await supabase
              .from('orders')
              .select(`
                id, listing_id, quantity, total_amount, order_status, created_at,
                listing:listings!orders_listing_id_fkey ( title, unit ),
                buyer:users!orders_buyer_id_fkey ( company_name, full_name )
              `)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const listing = (data as { listing?: { title?: string; unit?: string } | { title?: string; unit?: string }[] }).listing
              const listingObj = Array.isArray(listing) ? listing[0] : listing
              const buyer = (data as { buyer?: { company_name?: string; full_name?: string } | { company_name?: string; full_name?: string }[] }).buyer
              const buyerObj = Array.isArray(buyer) ? buyer[0] : buyer
              const newInq: InquiryOrder = {
                id: data.id,
                listing_id: data.listing_id,
                listing_title: displayProductTitle(listingObj?.title),
                buyer_company: displayBuyerName(buyerObj?.company_name || buyerObj?.full_name),
                quantity: data.quantity || 0,
                listing_unit: listingObj?.unit || 'unit',
                total_amount: data.total_amount || 0,
                order_status: data.order_status,
                created_at: data.created_at,
              }
              setInquiries(prev => [newInq, ...prev])
              toast('New enquiry received!', { duration: 5000 })
            }
          }
          fetchNewOrder()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  useEffect(() => {
    if (profile) {
      fetchStats()
      fetchListings()
      fetchInquiries()
      fetchAllOrders()
    }
  }, [profile, fetchStats, fetchListings, fetchInquiries, fetchAllOrders])

  // Real-time: refresh pipeline when checklist is updated
  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('exporter-checklist-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deal_checklist' },
        () => { fetchAllOrders() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, fetchAllOrders])

  const isVerified  = verificationStatus === 'approved'
  const companyName = displayName(profile, 'My Account')
  const initials    = companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const handleShareReferral = async () => {
    const ref  = profile?.referral_code || profile?.id || 'exporter'
    const link = `${window.location.origin}/signup?ref=${ref}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Referral link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const navItems: { name: string; icon: React.ElementType; tab: Tab }[] = [
    { name: 'Home',      icon: Home,          tab: 'home'      },
    { name: 'Listings',  icon: Library,       tab: 'listings'  },
    { name: 'Inquiries', icon: MessageCircle, tab: 'inquiries' },
    { name: 'Track',     icon: MapPin,        tab: 'track'     },
    { name: 'Profile',   icon: User,          tab: 'profile'   },
  ]

  // ═══════════════════════ HOME TAB — Command Center ════════════════════════════════════════════
  interface HomeTabProps {
    stats: ExporterStats; statsLoading: boolean
    listings: ExporterListing[]; listingsLoading: boolean
    inquiries: InquiryOrder[]; inquiriesLoading: boolean
    isVerified: boolean
  }

  const HomeTab = ({ stats, statsLoading, listings, listingsLoading, inquiries, inquiriesLoading, isVerified }: HomeTabProps) => {
    const totalViews = listings.filter(l => l.status === 'active').reduce((s, l) => s + (l.views_count || 0), 0)
    const topProduct = listings.length > 0
      ? listings.reduce((max, l) => (l.views_count || 0) > (max.views_count || 0) ? l : max, listings[0])
      : null
    const conversionRate = stats.dealsClosed + stats.newInquiries > 0
      ? Math.round((stats.dealsClosed / (stats.dealsClosed + stats.newInquiries)) * 100)
      : 0
    const blNeeded = inquiries.filter(i => ['escrow_funded','docs_in_progress'].includes(i.order_status)).length

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero Card */}
        <div className="e-pi" style={{
          ...D(0),
          background: 'linear-gradient(135deg, #0C3825 0%, #1A5C41 100%)',
          borderRadius: 20, padding: '28px 24px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(12,56,37,0.15)',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{getGreeting()},</p>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 28, color: 'white', lineHeight: 1.1, marginBottom: 16 }}>
              {companyName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: isVerified ? 'rgba(134,239,172,0.15)' : 'rgba(255,255,255,0.15)',
                border: `1px solid ${isVerified ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.2)'}`,
                color: isVerified ? '#86EFAC' : '#FFFFFF',
              }}>
                {isVerified ? <><CheckCircle2 size={12} /> Verified Exporter</> : <><Clock size={12} /> Pending Review</>}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 0, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{stats.activeListings}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Active Listings</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D4A843' }}>{statsLoading ? '—' : stats.newInquiries}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>New Inquiries</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{stats.dealsClosed}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Deals Closed</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D4A843' }}>
                {statsLoading ? '—' : stats.pendingPayout >= 1000 ? `$${(stats.pendingPayout / 1000).toFixed(1)}K` : `$${stats.pendingPayout}`}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Pending Payout</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => setActiveTab('listings')} style={{ flex: 1, background: 'white', color: '#0C3825', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={16} /> List Product
            </button>
            <button onClick={() => setActiveTab('inquiries')} style={{ flex: 1, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageCircle size={16} /> View Inquiries
            </button>
          </div>
        </div>

        {/* Action Center */}
        <div className="e-fu" style={D(100)}>
          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9B7A2A', marginBottom: 12 }}>Action Center</p>

          {!isVerified && (
            <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #D4A843', marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FEF3C7' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A843' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Your documents are under review</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Our team is verifying your business documents. You will be notified once approved.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F3F4F6', borderRadius: 8 }}>
                  <Clock size={14} color="#6B7280" />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Typically reviewed within 24 hours</span>
                </div>
              </div>
            </div>
          )}

          {stats.newInquiries > 0 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #D4A843', marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FEF3C7' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A843' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Enquiries</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{stats.newInquiries} new {stats.newInquiries === 1 ? 'enquiry' : 'enquiries'} awaiting response</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Respond within 24 hours to build trust and close deals faster.</p>
                <button onClick={() => setActiveTab('inquiries')} style={{ width: '100%', background: '#0C3825', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <MessageCircle size={16} /> Respond Now
                </button>
              </div>
            </div>
          )}

          {blNeeded > 0 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #F59E0B', marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FFFBEB' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents Needed</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{blNeeded} {blNeeded === 1 ? 'deal' : 'deals'} need B/L upload</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Upload your Bill of Lading to activate shipment tracking for buyers.</p>
                <button onClick={() => setActiveTab('inquiries')} style={{ width: '100%', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FileText size={16} /> Upload B/L
                </button>
              </div>
            </div>
          )}

          {isVerified && stats.newInquiries === 0 && blNeeded === 0 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #10B981', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#ECFDF5' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Clear</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No urgent actions</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Your pipeline is clear. Add more products or check your analytics.</p>
                <button onClick={() => setActiveTab('listings')} style={{ width: '100%', background: '#0C3825', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  <Plus size={16} /> Add New Listing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Performance Snapshot */}
        <div className="e-fu" style={D(200)}>
          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9B7A2A', marginBottom: 12 }}>Performance Snapshot</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'white', border: '1px solid #E2DDD6', borderRadius: 12, padding: '18px 14px', textAlign: 'center' }}>
              <Eye size={20} color={COLORS.primary} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>
                {listingsLoading ? '—' : totalViews.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600 }}>Listing Views</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E2DDD6', borderRadius: 12, padding: '18px 14px', textAlign: 'center' }}>
              <TrendingUp size={20} color={COLORS.accent} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>
                {statsLoading ? '—' : `${conversionRate}%`}
              </div>
              <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600 }}>Conversion Rate</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E2DDD6', borderRadius: 12, padding: '18px 14px', textAlign: 'center' }}>
              <Award size={20} color={COLORS.primary} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>
                {statsLoading ? '—' : stats.dealsClosed}
              </div>
              <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600 }}>Deals Closed</div>
            </div>
          </div>
        </div>

        {/* Top Performing Product */}
        {topProduct && (
          <div className="e-fu" style={D(300)}>
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9B7A2A', marginBottom: 12 }}>Top Performing Product</p>
            <div style={{ background: 'white', border: '1px solid #E2DDD6', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onClick={() => { setSelectedProduct(topProduct); setShowProductModal(true); }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: '#F5F2EC', border: '1px solid #E2DDD6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                overflow: 'hidden',
              }}>
                {topProduct.photos?.length ? (
                  <img src={topProduct.photos[0]} alt={topProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{getCategoryMeta(topProduct.category, topProduct.title).emoji}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topProduct.title}
                </p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
                  {topProduct.views_count || 0} views · {topProduct.enquiry_count || 0} enquiries
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                  {formatMoney(topProduct.price_per_unit, topProduct.currency)}<span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>/{topProduct.unit}</span>
                </p>
              </div>
              <ChevronRight size={18} color={COLORS.gray400} />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="e-fu" style={D(400)}>
          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9B7A2A', marginBottom: 12 }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'List Product', icon: Package, action: () => setActiveTab('listings') },
              { name: 'Inquiries', icon: MessageCircle, action: () => setActiveTab('inquiries') },
              { name: 'Documents', icon: FileText, action: () => toast('Document manager coming soon!', { icon: '📄' }) },
            ].map((f, i) => (
              <button
                key={f.name}
                onClick={f.action}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 16,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#E8F5E9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={18} color="#0C3825" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }
  // ═══════════════════════ LISTINGS TAB ════════════════════════════════════════
  const ListingsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="e-fu" style={{ ...D(0), display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ color: COLORS.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 3px' }}>
            Marketplace
          </p>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: COLORS.text, fontSize: 26, margin: 0 }}>
            My Listings
          </h2>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/exporter/add-listing')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13 }}
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      {!isVerified ? (
        <LockedState message="Your account is pending review. Please wait for approval." />
      ) : (
        <div className="split-listing-container">
          <ExporterTipsPanel messages={ROTATING_MESSAGES} />

          <div className="listings-grid-right">
            {listingsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2DDD6', borderRadius: 12, padding: 18 }}>
                  <Skeleton w={52} h={52} />
                  <div style={{ marginTop: 10 }}><Skeleton w="65%" h={14} /></div>
                  <div style={{ marginTop: 7 }}><Skeleton w="40%" h={20} /></div>
                  <div style={{ marginTop: 7 }}><Skeleton w="75%" h={11} /></div>
                </div>
              ))
            ) : listings.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '56px 20px', background: 'white', borderRadius: 12, border: '1.5px dashed #D1CBC1' }}>
                <Package size={32} color="#D1CBC1" style={{ margin: '0 auto 14px', display: 'block' }} />
                <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: COLORS.text, fontSize: 20, margin: '0 0 7px' }}>No listings yet</p>
                <p style={{ color: COLORS.gray500, fontSize: 13, margin: '0 0 18px' }}>Add your first product to start receiving buyer enquiries</p>
                <button className="btn-primary" onClick={() => navigate('/dashboard/exporter/add-listing')}
                  style={{ padding: '10px 22px', borderRadius: 8, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Plus size={14} /> Add First Listing
                </button>
              </div>
            ) : (
              listings.map((item, i) => {
                const meta       = getCategoryMeta(item.category, item.title)
                const statusMeta = LISTING_STATUS[item.status] || LISTING_STATUS.inactive
                return (
                  <div
                    key={item.id}
                    className="e-pi"
                    style={{
                      ...D(i * 35),
                      background: 'white', border: '1px solid #E2DDD6', borderRadius: 12,
                      overflow: 'hidden', cursor: 'pointer',
                      transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                    }}
                    onClick={() => { setSelectedProduct(item); setShowProductModal(true); }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(26,92,65,0.25)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = '#E2DDD6'
                    }}
                  >
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent}44)` }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 12,
                          background: `${meta.accent}10`, border: `1.5px solid ${meta.accent}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22, flexShrink: 0, overflow: 'hidden',
                        }}>
                          {item.photos?.length ? (
                            <img src={item.photos[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : <span>{meta.emoji}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                            <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 14, margin: 0, lineHeight: 1.2 }}>
                              {item.title.length > 32 ? item.title.slice(0, 29) + '…' : item.title}
                            </h3>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                              background: statusMeta.bg, color: statusMeta.color,
                              border: `1px solid ${statusMeta.border}`,
                              flexShrink: 0, marginLeft: 7,
                            }}>
                              {statusMeta.label}
                            </span>
                          </div>
                          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 17, color: meta.accent, margin: '4px 0 4px' }}>
                            {formatMoney(item.price_per_unit, item.currency)}<span style={{ fontSize: 11, fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>/{item.unit}</span>
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', marginBottom: 8 }}>
                            <span style={{ fontSize: 10, color: COLORS.gray400, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={9} /> {item.origin_state}
                            </span>
                            <span style={{ fontSize: 10, color: COLORS.gray400 }}>Min {item.min_order_quantity} {item.unit}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Eye size={12} color={COLORS.gray400} />
                              <span style={{ fontSize: 11, color: COLORS.gray500 }}>{item.views_count || 0} views</span>
                            </div>
                            {item.enquiry_count > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A' }}>{item.enquiry_count} enquiries</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )

  // ═══════════════════════ INQUIRIES TAB (with filters) ═══════════════════════════════════════
  const InquiriesTab = () => {
    const [query, setQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')

    const statuses = React.useMemo(() => {
      const s = new Set(inquiries.map(i => i.order_status).filter(Boolean))
      return ['all', ...Array.from(s)]
    }, [inquiries])

    const filtered = React.useMemo(() => {
      let result = inquiries
      if (query) {
        const q = query.toLowerCase()
        result = result.filter(i =>
          i.buyer_company?.toLowerCase().includes(q) ||
          i.listing_title?.toLowerCase().includes(q) ||
          i.order_status?.toLowerCase().includes(q)
        )
      }
      if (selectedStatus !== 'all') {
        result = result.filter(i => i.order_status === selectedStatus)
      }
      return result
    }, [inquiries, query, selectedStatus])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="e-fu" style={D(0)}>
          <p style={{ color: COLORS.primary, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 3px' }}>
            Deal Room
          </p>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: COLORS.text, fontSize: 26, margin: 0 }}>
            Buyer Inquiries
          </h2>
        </div>

        <div className="e-fu" style={D(50)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: 'white',
              border: '1px solid #E2DDD6',
              borderRadius: 10,
            }}>
              <Search size={16} color="#A8A29E" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by buyer, product, or status..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 14, color: COLORS.text,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={14} color="#A8A29E" />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    border: selectedStatus === status ? '1.5px solid ' + COLORS.primary : '1px solid #E2DDD6',
                    background: selectedStatus === status ? COLORS.primary : 'white',
                    color: selectedStatus === status ? 'white' : COLORS.gray600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                  {status !== 'all' && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: 10,
                      background: selectedStatus === status ? 'rgba(255,255,255,0.25)' : '#F5F2EC',
                      padding: '1px 6px',
                      borderRadius: 10,
                    }}>
                      {inquiries.filter(i => i.order_status === status).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isVerified ? (
          <LockedState message="Your account is pending review. Please wait for approval." />
        ) : inquiriesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map(i => <div key={i} className="skel" style={{ height: 140, borderRadius: 12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="e-pi" style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 12, border: '1.5px dashed #D1CBC1' }}>
            <MessageCircle size={32} color="#D1CBC1" style={{ margin: '0 auto 14px', display: 'block' }} />
            <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: COLORS.text, fontSize: 20, margin: '0 0 7px' }}>No inquiries found</p>
            <p style={{ color: COLORS.gray500, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
              {query || selectedStatus !== 'all' ? 'Try clearing your filters.' : "When buyers enquire on your listings, they will appear here."}
            </p>
            {(query || selectedStatus !== 'all') && (
              <button className="btn-outline e-pi" onClick={() => { setQuery(''); setSelectedStatus('all'); }}
                style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13 }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((inq, i) => {
              const statusLabel = ORDER_STATUS_LABEL[inq.order_status] || inq.order_status
              const isNew = inq.order_status === 'enquiring'
              return (
                <div key={inq.id} className="e-pi" style={{
                  ...D(i * 50),
                  background: 'white', border: '1px solid #E2DDD6', borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid #F0ECE8',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#FAF9F7',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: COLORS.primaryDark,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15,
                        flexShrink: 0,
                      }}>
                        {inq.buyer_company.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: COLORS.text, fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inq.buyer_company}
                        </p>
                        <p style={{ color: COLORS.gray500, fontSize: 12, margin: 0 }}>
                          {inq.listing_title}{inq.quantity > 0 ? ` · ${inq.quantity} ${inq.listing_unit}` : ''}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 5, flexShrink: 0,
                      background: isNew ? '#FEF3C7' : '#F5F2EC',
                      color: isNew ? '#92400E' : COLORS.gray600,
                      border: `1px solid ${isNew ? 'rgba(217,119,6,0.25)' : '#DDD8D0'}`,
                      textTransform: 'capitalize',
                    }}>
                      {isNew ? 'New' : statusLabel.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: COLORS.gray500, fontSize: 12, margin: '0 0 3px' }}>
                        Est. value: <span style={{ fontWeight: 700, color: COLORS.accent }}>{formatMoney(inq.total_amount)}</span>
                      </p>
                      <p style={{ color: COLORS.gray400, fontSize: 11, margin: 0 }}>{formatDate(inq.created_at)}</p>
                    </div>
                    <button
                      className="btn-primary e-pi"
                      onClick={() => navigate(`/deal/${inq.id}`)}
                      style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                    >
                      <MessageCircle size={13} /> Reply
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  // ═══════════════════════ TRACK TAB ════════════════════════════════════════════
  const TrackTab = () => {
    useEffect(() => { navigate('/dashboard/exporter/track') }, [])
    return (
      <div className="e-pi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 14 }}>
        <Loader2 size={26} color={COLORS.primary} className="e-spin" />
        <p style={{ color: COLORS.gray500, fontSize: 14, fontWeight: 500 }}>Opening shipment tracker…</p>
      </div>
    )
  }

  // ═══════════════════════ PROFILE TAB ══════════════════════════════════════════
  const ProfileTab = () => {
    if (!profile) return null
    const memberSince          = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    const totalEarnedFormatted = `$${(stats.totalEarned || 0).toLocaleString()}`
    const dealsDone            = profile.deals_completed || 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="e-pi" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E2DDD6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ height: 96, background: 'linear-gradient(135deg, #0C3825 0%, #1A5C41 100%)', position: 'relative', borderRadius: '12px 12px 0 0' }}>
            <div style={{ position: 'absolute', bottom: -38, left: 22 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: `linear-gradient(135deg, ${COLORS.accent}, #7A600F)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: 'white', border: '4px solid white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900,
              }}>
                {initials}
              </div>
            </div>
          </div>
          <div style={{ padding: '50px 22px 18px', borderBottom: '1px solid #F0ECE8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, margin: '0 0 3px' }}>{companyName}</h1>
                <p style={{ color: COLORS.gray400, fontSize: 13, margin: '0 0 8px' }}>@{profile.email.split('@')[0]}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, rowGap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.gray600 }}>
                    <Globe size={11} /> From {profile.country || 'Nigeria'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.gray600 }}>
                    <Calendar size={11} /> Since {memberSince}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isVerified ? '#16A34A' : COLORS.accent }}>
                    {isVerified ? <CheckCircle2 size={11} color="#16A34A" /> : <Clock size={11} color={COLORS.accent} />}
                    {isVerified ? 'Verified Exporter' : 'Pending Review'}
                  </span>
                </div>
              </div>
              <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8 }}>
                <Edit2 size={13} /> Edit Profile
              </button>
            </div>
          </div>
          <div className="fiverr-stats-grid">
            <div className="fiverr-stat-card">
              <Briefcase size={18} color={COLORS.primary} style={{ marginBottom: 5 }} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 20, color: COLORS.gray900 }}>{stats.activeListings}</div>
              <div style={{ fontSize: 11, color: COLORS.gray400 }}>Active Listings</div>
            </div>
            <div className="fiverr-stat-card">
              <DollarSign size={18} color={COLORS.accent} style={{ marginBottom: 5 }} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 20, color: COLORS.gray900 }}>{totalEarnedFormatted}</div>
              <div style={{ fontSize: 11, color: COLORS.gray400 }}>Total Earned</div>
            </div>
            <div className="fiverr-stat-card">
              <Award size={18} color={COLORS.primary} style={{ marginBottom: 5 }} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 20, color: COLORS.gray900 }}>{dealsDone}</div>
              <div style={{ fontSize: 11, color: COLORS.gray400 }}>Deals Completed</div>
            </div>
          </div>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F0ECE8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Video size={20} color={COLORS.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Intro video</h3>
                <p style={{ color: COLORS.gray400, fontSize: 12, margin: 0 }}>Stand out with a short introduction video.</p>
              </div>
              <button className="btn-outline" style={{ borderRadius: 8, padding: '7px 16px', fontSize: 12, flexShrink: 0 }}>Get started →</button>
            </div>
          </div>
          <div style={{ padding: '18px 22px' }}>
            <div style={{ background: COLORS.primaryLight, borderRadius: 10, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, border: '1px solid rgba(26,92,65,0.1)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <PlusCircle size={15} color={COLORS.primary} />
                  <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Expand your catalogue</h3>
                </div>
                <p style={{ fontSize: 12, color: COLORS.gray600, margin: 0 }}>Add more products to attract international buyers.</p>
              </div>
              <button className="btn-primary" onClick={() => navigate('/dashboard/exporter/add-listing')}
                style={{ borderRadius: 8, padding: '9px 16px', fontSize: 13 }}>
                Add a new listing →
              </button>
            </div>
          </div>

          <div style={{ padding: '18px 22px', borderTop: '1px solid #F0ECE8' }}>
            <button
              className="btn-outline"
              onClick={handleSignOut}
              style={{ width: '100%', justifyContent: 'center', gap: 8, borderColor: '#E2DDD6', color: COLORS.gray600 }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        <div style={{
          background: COLORS.primaryDark, borderRadius: 12, padding: '22px 20px',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(155,122,42,0.1)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Your Referral</p>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 19, color: 'white', marginBottom: 5 }}>Earn ₦10,000 per referral</div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>Share your unique link and earn reward for every exporter you bring in.</p>
            <button className="btn-primary" onClick={handleShareReferral}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', borderRadius: 8, background: COLORS.primary }}>
              <Share2 size={13} /> Copy Referral Link
            </button>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              Code: <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{profile.referral_code || profile.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>
      </div>
    )
  }



// ═══════════════════════ PRODUCT DETAIL MODAL ═════════════════════════════════
const ProductDetailModal = ({
  product,
  listings,
  onClose,
  isVerified,
}: {
  product: ExporterListing
  listings: ExporterListing[]
  onClose: () => void
  isVerified: boolean
}) => {
  const navigate = useNavigate()
  const meta = getCategoryMeta(product.category, product.title)

  const productViews = product.views_count || 0
  const productEnquiries = product.enquiry_count || 0
  const conversionRate = productViews > 0 ? Math.round((productEnquiries / productViews) * 100) : 0

  const sortedByViews = [...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
  const productRank = sortedByViews.findIndex(l => l.id === product.id) + 1

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="e-fi"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="e-si"
        style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: 600,
          maxHeight: '85vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#DDD8D0' }} />
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12, right: 12,
            width: 32, height: 32,
            borderRadius: 10,
            background: '#F5F2EC',
            border: '1px solid #E2DDD6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <X size={16} color={COLORS.gray600} />
        </button>

        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: `${meta.accent}10`,
              border: `2px solid ${meta.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, flexShrink: 0, overflow: 'hidden',
            }}>
              {product.photos?.length ? (
                <img src={product.photos[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{meta.emoji}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h2 style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800, fontSize: 22, margin: 0,
                  color: COLORS.text,
                }}>
                  {product.title}
                </h2>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 5,
                  background: LISTING_STATUS[product.status]?.bg || '#F5F2EC',
                  color: LISTING_STATUS[product.status]?.color || '#44403C',
                  border: `1px solid ${LISTING_STATUS[product.status]?.border || '#DDD8D0'}`,
                  textTransform: 'capitalize',
                }}>
                  {LISTING_STATUS[product.status]?.label || product.status}
                </span>
              </div>
              <p style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 20,
                color: meta.accent, margin: '0 0 6px',
              }}>
                {formatMoney(product.price_per_unit, product.currency)}
                <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.gray500 }}>/{product.unit}</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                <span style={{ fontSize: 12, color: COLORS.gray500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {product.origin_state}
                </span>
                <span style={{ fontSize: 12, color: COLORS.gray500 }}>
                  Min order: {product.min_order_quantity} {product.unit}
                </span>
                <span style={{ fontSize: 12, color: COLORS.gray500 }}>
                  Stock: {product.available_quantity} {product.unit}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#9B7A2A', marginBottom: 12,
            }}>
              Performance Analysis
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{
                background: '#F5F2EC', borderRadius: 12,
                padding: '14px 10px', textAlign: 'center',
                border: '1px solid #E2DDD6',
              }}>
                <Eye size={18} color={COLORS.primary} style={{ margin: '0 auto 6px', display: 'block' }} />
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800, fontSize: 20, color: COLORS.text,
                }}>
                  {productViews}
                </div>
                <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600 }}>Total Views</div>
              </div>
              <div style={{
                background: '#F5F2EC', borderRadius: 12,
                padding: '14px 10px', textAlign: 'center',
                border: '1px solid #E2DDD6',
              }}>
                <MessageCircle size={18} color={COLORS.accent} style={{ margin: '0 auto 6px', display: 'block' }} />
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800, fontSize: 20, color: COLORS.text,
                }}>
                  {productEnquiries}
                </div>
                <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600 }}>Enquiries</div>
              </div>
              <div style={{
                background: '#F5F2EC', borderRadius: 12,
                padding: '14px 10px', textAlign: 'center',
                border: '1px solid #E2DDD6',
              }}>
                <TrendingUp size={18} color={COLORS.primary} style={{ margin: '0 auto 6px', display: 'block' }} />
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800, fontSize: 20, color: COLORS.text,
                }}>
                  {conversionRate}%
                </div>
                <div style={{ fontSize: 11, color: COLORS.gray500, fontWeight: 600 }}>Conv. Rate</div>
              </div>
            </div>

            {listings.length > 1 && (
              <div style={{
                marginTop: 10,
                background: COLORS.primaryLight,
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Award size={16} color={COLORS.primary} />
                <span style={{ fontSize: 13, color: COLORS.gray600, fontWeight: 600 }}>
                  Ranked <strong style={{ color: COLORS.primary }}>#{productRank}</strong> out of {listings.length} listings by views
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#9B7A2A', marginBottom: 12,
            }}>
              Product Details
            </p>
            <div style={{
              background: '#FAF9F7',
              borderRadius: 12,
              border: '1px solid #E2DDD6',
              overflow: 'hidden',
            }}>
              {[
                { label: 'Category', value: product.category || '—' },
                { label: 'Quality Grade', value: product.quality_grade || '—' },
                { label: 'Origin State', value: product.origin_state || '—' },
                { label: 'Min Order', value: `${product.min_order_quantity} ${product.unit}` },
                { label: 'Available', value: `${product.available_quantity} ${product.unit}` },
                { label: 'Listed On', value: new Date(product.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: idx < 5 ? '1px solid #E2DDD6' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: COLORS.gray500, fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button
              className="btn-primary"
              onClick={() => {
                onClose()
                navigate('/dashboard/exporter/add-listing')
              }}
              style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: 10, fontSize: 13 }}
            >
              <Edit2 size={14} /> Edit Listing
            </button>
            <button
              className="btn-outline"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: 10, fontSize: 13 }}
            >
              Close
            </button>
          </div>

          <div style={{
            background: '#FEF3C7',
            borderRadius: 12,
            padding: '14px 16px',
            border: '1px solid rgba(217,119,6,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Zap size={16} color="#92400E" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>
                  Tip for this listing
                </p>
                <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                  {productViews === 0
                    ? 'This listing has no views yet. Consider sharing it on social media or lowering the price to attract initial interest.'
                    : productEnquiries === 0
                    ? 'Buyers are viewing but not enquiring. Check your price competitiveness or add more product details.'
                    : 'Great engagement! Respond to enquiries quickly to convert them into deals.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 'max(20px, env(safe-area-inset-bottom, 20px))' }} />
      </div>
    </div>
  )
}

// ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F1EDE6', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      }}>
        <div className="e-pi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            border: '2.5px solid #DDD8D0',
            borderTopColor: COLORS.primary,
            animation: 'eSpin 0.9s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: COLORS.text, fontSize: 15, fontWeight: 700, margin: '0 0 3px', fontFamily: 'Barlow Condensed, sans-serif' }}>IziXport</p>
            <p style={{ color: COLORS.gray500, fontSize: 13, fontWeight: 400, margin: 0 }}>Loading your dashboard…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="exp-root">
      <div className="exp-sidebar e-fi">
        <div style={{ padding: '20px 18px 16px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/logo.jpeg" alt="IziXport" style={{ height: 28, width: 'auto', display: 'block', borderRadius: 7 }} />
        </div>

        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const isActive = activeTab === item.tab
            return (
              <button
                key={item.name}
                className={`exp-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.tab === 'track') navigate('/dashboard/exporter/track')
                  else setActiveTab(item.tab)
                }}
              >
                <item.icon size={17} color={isActive ? 'white' : 'rgba(255,255,255,0.4)'} />
                {item.name}
                {isActive && <span className="exp-nav-dot" />}
              </button>
            )
          })}
        </div>

        {profile && (
          <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.07)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: COLORS.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: 'white',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {companyName.split(' ')[0]}
                </p>
                <p style={{ color: isVerified ? COLORS.accent : 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, fontWeight: 600 }}>
                  {isVerified ? 'Verified Exporter' : 'Pending Review'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                marginTop: 12,
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        )}
      </div>

      <header className="e-fi" style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E0DAD3',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div className="exp-header-inner" style={{
          maxWidth: 720, margin: '0 auto', padding: '11px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E2DDD6', display: 'inline-flex' }}>
            <img src="/logo.jpeg" alt="IziXport" style={{ height: 30, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <div className="e-pi" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: isVerified ? '#F0FDF4' : '#FEF3C7',
              border: `1px solid ${isVerified ? 'rgba(22,163,74,0.25)' : 'rgba(217,119,6,0.25)'}`,
              color: isVerified ? '#16A34A' : '#92400E',
            }}>
              {isVerified ? <><CheckCircle2 size={10} /> Verified</> : <><Clock size={10} /> Pending Review</>}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: COLORS.gray600,
                fontSize: 12,
                fontWeight: 500,
              }}
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span style={{ display: 'none' }}>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="exp-content-inner" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 0' }}>
        {activeTab === 'home'      && (
          <HomeTab
            stats={stats}
            statsLoading={statsLoading}
            listings={listings}
            listingsLoading={listingsLoading}
            inquiries={inquiries}
            inquiriesLoading={inquiriesLoading}
            isVerified={isVerified}
          />
        )}
        {activeTab === 'listings'  && <ListingsTab />}
        {activeTab === 'inquiries' && <InquiriesTab />}
        {activeTab === 'track'     && <TrackTab />}
        {activeTab === 'profile'   && <ProfileTab />}
      </div>

      <nav className="exp-bottom-nav e-si" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #E0DAD3',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 8px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            paddingTop: 7, paddingBottom: 'max(7px, env(safe-area-inset-bottom, 7px))',
          }}>
            {navItems.map(item => {
              const isActive = activeTab === item.tab
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.tab === 'track') navigate('/dashboard/exporter/track')
                    else setActiveTab(item.tab)
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '6px 8px', borderRadius: 10, background: 'none', border: 'none',
                    cursor: 'pointer', minWidth: 52, minHeight: 44, position: 'relative',
                  }}
                >
                  <item.icon size={21} color={isActive ? COLORS.primaryDark : '#A8A29E'} />
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 700 : 500,
                    color: isActive ? COLORS.primaryDark : '#A8A29E',
                    letterSpacing: '0.01em', lineHeight: 1,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {item.name}
                  </span>
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: 2, width: 4, height: 4,
                      borderRadius: '50%', background: COLORS.accent,
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {showProductModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          listings={listings}
          onClose={() => setShowProductModal(false)}
          isVerified={isVerified}
        />
      )}
    </div>
  )
}