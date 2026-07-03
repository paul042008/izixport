// src/pages/dashboard/ExporterTrack.tsx
import React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, CheckCircle2, Package, MapPin, Globe, FileText, Upload,
  ArrowRight, Clock, Loader2, Library, Home, MessageCircle,
  User, TrendingUp, AlertTriangle, X, Edit2, Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import NotificationBell from '@/components/NotificationBell'
import toast from 'react-hot-toast'
import '@/styles/marketplace.css'

interface Shipment {
  id: string
  listing_title: string
  listing_category: string
  buyer_company: string
  buyer_country: string
  quantity: number
  total_amount: number
  currency: string
  escrow_status: string
  order_status: string
  shipment_status: string | null
  bl_document_url: string | null
  bl_uploaded_at: string | null
  vessel_name: string | null
  container_number: string | null
  tracking_number: string | null
  shipping_line: string | null
  etd: string | null
  eta: string | null
  shipper_notes: string | null
  delivery_confirmed_at: string | null
  created_at: string
}

type FilterTab = 'all' | 'pending_bl' | 'shipped' | 'delivered' | 'completed'

const COLORS = {
  primary: '#1A5C41',
  primaryDark: '#0C3825',
  accent: '#9B7A2A',
  gray400: '#A8A29E',
  gray500: '#78726A',
  gray600: '#57534E',
  gray900: '#1C1917',
  text: '#1C1917',
}

const NAV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes eFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes eSpin    { to{transform:rotate(360deg)} }
  .e-fi   { animation: eFadeIn 0.3s ease both }
  .e-spin { animation: eSpin 0.9s linear infinite }
  .et-root {
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
  .et-header {
    position: sticky; top: 0; z-index: 30;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #E0DAD3;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    padding-top: env(safe-area-inset-top, 0px);
  }
  .et-header-inner {
    max-width: 720px; margin: 0 auto; padding: 11px 20px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .et-content { padding: 24px 20px 0; }
  .exp-bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(12px);
    border-top: 1px solid #E0DAD3;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
  }
  .exp-bottom-nav-inner {
    max-width: 720px; margin: 0 auto; padding: 0 8px;
    display: flex; justify-content: space-around; align-items: center;
    padding-top: 7px;
    padding-bottom: max(7px, env(safe-area-inset-bottom, 7px));
  }
  .exp-bnav-btn {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 8px; border-radius: 10px;
    background: none; border: none; cursor: pointer;
    min-width: 52px; min-height: 44px; position: relative;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .exp-bnav-btn span {
    font-size: 10px; letter-spacing: 0.01em; line-height: 1;
  }
  .exp-bnav-dot {
    position: absolute; bottom: 2px;
    width: 4px; height: 4px; border-radius: 50%;
    background: #9B7A2A;
  }
  @media (min-width: 768px) {
    .exp-bottom-nav    { display: none !important; }
    .exp-sidebar       { display: flex !important; }
    .et-root           { padding-bottom: 0 !important; }
    .et-header-inner   { max-width: none !important; padding-left: 264px !important; padding-right: 32px !important; }
    .et-content        { margin-left: 240px !important; max-width: none !important; padding: 28px 32px 40px !important; }
  }
  @media (max-width: 767px) {
    .et-content { padding: 16px 16px 0 !important; max-width: 100% !important; }
    .et-header-inner { padding-left: 16px !important; padding-right: 16px !important; }
  }
  ::-webkit-scrollbar { width:3px; height:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:rgba(26,92,65,.2); border-radius:3px }
`

const CATEGORY_EMOJI: Record<string, string> = {
  cashew: '🥜', cocoa: '🫘', sesame: '🌾', shea: '🧴',
  ginger: '🫚', 'palm oil': '🛢️', leather: '👜', textiles: '👘',
  hibiscus: '🌺', pepper: '🌶️', groundnut: '🥜'
}
const getEmoji = (cat: string, title: string) => {
  const k = Object.keys(CATEGORY_EMOJI).find(k => cat?.toLowerCase().includes(k) || title?.toLowerCase().includes(k))
  return k ? CATEGORY_EMOJI[k] : '📦'
}

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  payment_pending:  { label: 'Awaiting Payment',  bg: '#FEF3C7', color: '#92400E', border: 'rgba(217,119,6,0.25)' },
  escrow_confirmed: { label: 'Awaiting B/L Upload', bg: '#FEF3C7', color: '#92400E', border: 'rgba(217,119,6,0.25)' },
  shipped:          { label: 'B/L Uploaded — Shipped', bg: '#F0FDF4', color: '#166534', border: 'rgba(22,163,74,0.25)' },
  delivered:        { label: 'Delivered — Confirm Release', bg: '#FEF3C7', color: '#92400E', border: 'rgba(217,119,6,0.25)' },
  completed:        { label: 'Completed',         bg: '#F0FDF4', color: '#166534', border: 'rgba(22,163,74,0.25)' },
  cancelled:        { label: 'Cancelled',         bg: '#FEF2F2', color: '#991B1B', border: 'rgba(239,68,68,0.25)' },
}

const FILTER_MATCH: Record<FilterTab, (s: Shipment) => boolean> = {
  all:        () => true,
  pending_bl: s => s.order_status === 'escrow_confirmed' && !s.bl_document_url,
  shipped:    s => s.order_status === 'shipped' || (s.order_status === 'escrow_confirmed' && !!s.bl_document_url),
  delivered:  s => s.order_status === 'delivered',
  completed:  s => s.order_status === 'completed',
}

const TIMELINE = [
  { key: 'escrow',    label: 'Escrow Funded' },
  { key: 'bl',        label: 'B/L Uploaded' },
  { key: 'shipped',   label: 'Seller Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const getStepsDone = (s: Shipment): number => {
  const st = s.order_status
  if (st === 'completed')        return 4
  if (st === 'delivered')        return 3
  if (st === 'shipped')          return 3
  if (st === 'escrow_confirmed' || st === 'payment_pending') return 1
  return 1
}

const Sk = ({ w = '100%', h = 16 }: { w?: string | number; h?: number }) => (
  <div className="mk-skeleton" style={{ width: w, height: h, background: '#F3F4F6', borderRadius: 4, animation: 'eShimmer 1.5s infinite' }} />
)

const NAV_ITEMS = [
  { name: 'Home',      icon: Home,          path: '/dashboard/exporter?tab=home' },
  { name: 'Listings',  icon: Library,       path: '/dashboard/exporter?tab=listings' },
  { name: 'Inquiries', icon: MessageCircle, path: '/dashboard/exporter?tab=inquiries' },
  { name: 'Track',     icon: MapPin,        path: '/dashboard/exporter/track' },
  { name: 'Profile',   icon: User,          path: '/dashboard/exporter?tab=profile' },
]

export default function ExporterTrack() {
  const navigate = useNavigate()

  const [profile, setProfile]       = useState<{ id: string; initials: string; firstName: string } | null>(null)
  const [shipments, setShipments]   = useState<Shipment[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<FilterTab>('all')
  const [isVerified, setIsVerified] = useState(false)
  const [uploadingBL, setUploadingBL] = useState<string | null>(null)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // ── Inject nav CSS once ────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'et-nav-styles'
    style.textContent = NAV_CSS
    if (!document.getElementById('et-nav-styles')) {
      document.head.appendChild(style)
    }
    return () => {
      const el = document.getElementById('et-nav-styles')
      if (el) el.remove()
    }
  }, [])

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data: userData } = await supabase
        .from('users')
        .select('verification_status, full_name, company_name')
        .eq('id', session.user.id)
        .single()
      if (userData) {
        setIsVerified(userData.verification_status === 'approved')
        const name = userData.company_name || userData.full_name || 'Exporter'
        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        const firstName = name.split(' ')[0]
        setProfile({ id: session.user.id, initials, firstName })
      }
    }
    init()
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate('/login')
    })
    return () => { listener?.subscription.unsubscribe() }
  }, [navigate])

  // ── Shipments ──────────────────────────────────────────────────────────────
  const fetchShipments = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    console.log('ExporterTrack: Fetching for exporter_id =', profile.id)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, quantity, total_amount, currency,
        escrow_status, order_status, shipment_status,
        bl_document_url, bl_uploaded_at,
        vessel_name, container_number, tracking_number,
        shipping_line, etd, eta, shipper_notes, delivery_confirmed_at,
        created_at,
        listings!listing_id ( title, category ),
        buyer:users!buyer_id ( full_name, company_name, country )
      `)
      .eq('exporter_id', profile.id)
      .not('order_status', 'in', '("enquiring","cancelled")')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('ExporterTrack fetch error:', error)
      toast.error('Failed to load shipments: ' + error.message)
      setLoading(false)
      return
    }
    console.log('ExporterTrack: fetched', data?.length || 0, 'orders')
    if (data) {
      setShipments(data.map((o: any) => ({
        id:                 o.id,
        listing_title:      o.listings?.title    || 'Unknown Product',
        listing_category:   o.listings?.category || '',
        buyer_company:      o.buyer?.company_name || o.buyer?.full_name || 'Unknown Buyer',
        buyer_country:      o.buyer?.country     || '',
        quantity:           o.quantity || 0,
        total_amount:       o.total_amount || 0,
        currency:           o.currency || 'USD',
        escrow_status:      o.escrow_status,
        order_status:       o.order_status,
        shipment_status:    o.shipment_status,
        bl_document_url:    o.bl_document_url,
        bl_uploaded_at:     o.bl_uploaded_at,
        vessel_name:        o.vessel_name,
        container_number:   o.container_number,
        tracking_number:    o.tracking_number,
        shipping_line:      o.shipping_line,
        etd:                o.etd,
        eta:                o.eta,
        shipper_notes:      o.shipper_notes,
        delivery_confirmed_at: o.delivery_confirmed_at,
        created_at:         o.created_at,
      })))
    }
    setLoading(false)
  }, [profile])

  useEffect(() => { if (profile) fetchShipments() }, [profile, fetchShipments])

  // Real-time updates
  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('exporter-track-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `exporter_id=eq.${profile.id}` },
        (payload) => { console.log('Real-time update:', payload); fetchShipments() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, fetchShipments])

  // ── B/L Upload ─────────────────────────────────────────────────────────────
  const handleBLUpload = async (shipmentId: string, file: File) => {
    if (!profile || file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }
    setUploadingBL(shipmentId)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/bl-${shipmentId}-${Date.now()}.${ext}`
      const { error: upError } = await supabase.storage
        .from('shipping-documents')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upError) throw upError

      const { data: urlData } = supabase.storage
        .from('shipping-documents')
        .getPublicUrl(path)

      const { error: dbError } = await supabase
        .from('orders')
        .update({
          bl_document_url: urlData.publicUrl,
          order_status: 'shipped',
          bl_uploaded_at: new Date().toISOString(),
        })
        .eq('id', shipmentId)

      if (dbError) throw dbError
      toast.success('B/L uploaded! Buyer can now track shipment.')
      fetchShipments()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingBL(null)
    }
  }

  // ── Update Shipping Details ────────────────────────────────────────────────
  const handleUpdateDetails = async (shipmentId: string, details: {
    vessel_name?: string
    container_number?: string
    tracking_number?: string
    shipping_line?: string
    etd?: string
    eta?: string
    shipper_notes?: string
  }) => {
    const { error } = await supabase
      .from('orders')
      .update(details)
      .eq('id', shipmentId)
    if (error) {
      toast.error('Failed to update')
      return
    }
    toast.success('Shipping details updated')
    fetchShipments()
    setShowUpdateModal(false)
    setSelectedShipment(null)
  }

  // ── Derived stats ────────────────────────────────────────────────────────
  const filtered        = shipments.filter(FILTER_MATCH[filter])
  const pendingBLCount  = shipments.filter(s => s.order_status === 'escrow_confirmed' && !s.bl_document_url).length
  const shippedCount    = shipments.filter(s => s.order_status === 'shipped' || (s.order_status === 'escrow_confirmed' && !!s.bl_document_url)).length
  const deliveredCount  = shipments.filter(s => s.order_status === 'delivered').length
  const completedCount  = shipments.filter(s => s.order_status === 'completed').length
  const totalValue      = shipments.reduce((sum, s) => sum + s.total_amount, 0)

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'pending_bl', label: 'Awaiting B/L' },
    { key: 'shipped',    label: 'Shipped' },
    { key: 'delivered',  label: 'Delivered' },
    { key: 'completed',  label: 'Completed' },
  ]

  const handleNav = (path: string) => navigate(path)

  return (
    <div className="et-root">
      {/* ── Desktop sidebar ── */}
      <div className="exp-sidebar e-fi">
        <div style={{ padding: '20px 18px 16px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/logo.jpeg" alt="IziXport" style={{ height: 28, width: 'auto', display: 'block', borderRadius: 7 }} />
        </div>
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = item.name === 'Track'
            return (
              <button key={item.name} className={`exp-nav-item ${active ? 'active' : ''}`} onClick={() => handleNav(item.path)}>
                <item.icon size={17} color={active ? 'white' : 'rgba(255,255,255,0.4)'} />
                {item.name}
                {active && <span className="exp-nav-dot" />}
              </button>
            )
          })}
        </div>
        {profile && (
          <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: 'white' }}>
                {profile.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.firstName}</p>
                <p style={{ color: isVerified ? COLORS.accent : 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, fontWeight: 600 }}>{isVerified ? 'Verified Exporter' : 'Pending'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Header ── */}
      <header className="et-header e-fi">
        <div className="et-header-inner">
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E2DDD6', display: 'inline-flex' }}>
            <img src="/logo.jpeg" alt="IziXport" style={{ height: 30, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: isVerified ? '#F0FDF4' : '#FEF3C7', border: `1px solid ${isVerified ? 'rgba(22,163,74,0.25)' : 'rgba(217,119,6,0.25)'}`, color: isVerified ? '#16A34A' : '#92400E' }}>
              {isVerified ? <><CheckCircle2 size={10} /> Verified</> : <><Clock size={10} /> Pending</>}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="et-content">
        <div className="mk-container mk-fade-up" style={{ maxWidth: 1440, padding: 0 }}>

          {/* Hero */}
          <section style={{
            background: 'linear-gradient(135deg, var(--mk-emerald-dark) 0%, var(--mk-emerald) 100%)',
            borderRadius: 22, padding: '24px 24px 22px', color: '#fff', position: 'relative', overflow: 'hidden',
            boxShadow: '0 18px 40px rgba(13,122,95,.14)', marginBottom: 20,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(201,168,76,.22), transparent 34%), radial-gradient(circle at bottom left, rgba(255,255,255,.08), transparent 30%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18, alignItems: 'center' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,.56)', fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', margin: '0 0 8px' }}>Export operations</p>
                <h1 style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 50px)', lineHeight: 0.95, margin: 0 }}>Shipment cockpit</h1>
                <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, lineHeight: 1.7, maxWidth: 720, margin: '12px 0 0' }}>
                  Upload Bills of Lading, add vessel details, and track every shipment manually. No APIs needed — just documents and updates.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                  <span style={{ padding: '6px 11px', borderRadius: 9999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.10)', color: '#fff', fontSize: 11, fontWeight: 700 }}>Active {shipments.filter(s => !['completed','cancelled'].includes(s.order_status)).length}</span>
                  <span style={{ padding: '6px 11px', borderRadius: 9999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.10)', color: '#fff', fontSize: 11, fontWeight: 700 }}>Awaiting B/L {pendingBLCount}</span>
                  <span style={{ padding: '6px 11px', borderRadius: 9999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.10)', color: '#fff', fontSize: 11, fontWeight: 700 }}>Shipped {shippedCount}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {[
                  { label: 'Active', value: shipments.filter(s => !['completed','cancelled'].includes(s.order_status)).length },
                  { label: 'Awaiting B/L', value: pendingBLCount },
                  { label: 'Shipped', value: shippedCount },
                  { label: 'Delivered', value: deliveredCount },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '14px 12px', borderRadius: 16, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,.58)', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</p>
                    <div style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 800, fontSize: 'clamp(20px, 4vw, 28px)', color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, alignItems: 'start' }} className="exporter-layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p className="mk-eyebrow">Shipment pipeline</p>
                  <h2 className="mk-h2" style={{ marginBottom: 0 }}>Orders in motion</h2>
                </div>
                <span className="mk-text-secondary mk-num" style={{ fontSize: 13 }}>{shipments.length} total</span>
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {FILTER_TABS.map(t => (
                  <button key={t.key} onClick={() => setFilter(t.key)} style={{
                    padding: '10px 16px', borderRadius: 9999, fontFamily: 'var(--mk-font-heading)', fontSize: 13, fontWeight: 600,
                    border: filter === t.key ? '1px solid var(--mk-emerald)' : '1px solid var(--mk-border)',
                    background: filter === t.key ? 'var(--mk-emerald)' : '#fff', color: filter === t.key ? '#fff' : 'var(--mk-text-2)',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 42,
                    boxShadow: filter === t.key ? '0 4px 12px rgba(13,122,95,.2)' : 'none', transition: 'all 0.15s',
                  }}>{t.label}</button>
                ))}
              </div>

              {/* Shipment cards */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="mk-card" style={{ padding: 20 }}>
                      <Sk w="40%" h={14} /><div style={{ height: 12 }} /><Sk w="80%" h={18} /><div style={{ height: 14 }} /><Sk w="100%" h={60} />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="mk-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--mk-emerald-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <Truck size={28} style={{ color: 'var(--mk-emerald)' }} />
                  </div>
                  <h3 className="mk-h2" style={{ marginBottom: 8 }}>No active shipments</h3>
                  <p className="mk-text-secondary" style={{ marginBottom: 20, fontSize: 14 }}>
                    {filter === 'all' ? 'Shipments appear here once escrow is funded.' : `No ${filter.replace('_', ' ')} shipments.`}
                  </p>
                  <button onClick={() => navigate('/dashboard/exporter?tab=inquiries')} className="mk-btn mk-btn-primary">
                    <MessageCircle size={15} /> View inquiries
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                  {filtered.map(s => {
                    const meta = STATUS_META[s.order_status] || { label: s.order_status || 'Unknown', bg: '#F5F2EC', color: '#44403C', border: '#DDD8D0' }
                    const emoji = getEmoji(s.listing_category, s.listing_title)
                    const stepsDone = getStepsDone(s)
                    const needsBL = s.order_status === 'escrow_confirmed' && !s.bl_document_url
                    const isInternational = s.buyer_country && s.buyer_country.toLowerCase() !== 'nigeria'
                    return (
                      <div key={s.id} className="mk-card mk-card-hover" style={{ overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{
                          background: 'linear-gradient(135deg, var(--mk-emerald-dark), var(--mk-emerald))',
                          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        }}>
                          <div>
                            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', margin: '0 0 2px', fontFamily: 'var(--mk-font-heading)' }}>Shipment</p>
                            <p className="mk-num" style={{ color: '#fff', fontFamily: 'var(--mk-font-heading)', fontWeight: 700, fontSize: 17, margin: '0 0 2px' }}>
                              #IZ-{s.id.slice(0, 6).toUpperCase()}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, margin: 0 }}>
                              {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <span style={{ background: 'rgba(255,255,255,.95)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: meta.color, border: `1px solid ${meta.border}` }}>
                            {meta.label}
                          </span>
                        </div>

                        <div style={{ padding: '18px 20px' }}>
                          {/* Product info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--mk-surface-alt)', border: '1px solid var(--mk-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                              {emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 600, color: 'var(--mk-text)', fontSize: 14.5, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.listing_title}
                              </p>
                              <p style={{ color: 'var(--mk-text-2)', fontSize: 12.5, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {isInternational ? <Globe size={11} /> : <MapPin size={11} />}
                                {s.buyer_company} · {s.quantity.toLocaleString()} units
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p className="mk-num" style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 700, color: 'var(--mk-text)', fontSize: 19, margin: '0 0 2px' }}>
                                ${s.total_amount.toLocaleString()}
                              </p>
                              <p style={{ color: 'var(--mk-emerald)', fontSize: 11, fontWeight: 600, margin: 0 }}>
                                {s.escrow_status === 'held' ? 'In escrow' : '—'}
                              </p>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 16, overflowX: 'auto', paddingBottom: 6 }}>
                            {TIMELINE.map((step, idx) => {
                              const done = idx < stepsDone
                              const active = idx === stepsDone - 1
                              return (
                                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 70 }}>
                                  <div style={{
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: done ? 'var(--mk-emerald)' : active ? 'var(--mk-gold)' : '#e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: done ? '0 0 0 3px rgba(13,122,95,.12)' : active ? '0 0 0 3px rgba(201,168,76,.18)' : 'none',
                                  }}>{done && <CheckCircle2 size={9} color="#fff" />}</div>
                                  <span style={{ fontSize: 10, fontWeight: done || active ? 600 : 500, color: done ? 'var(--mk-text)' : active ? 'var(--mk-gold-dark)' : 'var(--mk-text-3)', textAlign: 'center', fontFamily: 'var(--mk-font-heading)' }}>
                                    {step.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* B/L Upload Zone (if needed) */}
                          {needsBL ? (
                            <div style={{ marginBottom: 16 }}>
                              <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={14} /> Upload Bill of Lading to activate tracking
                              </p>
                              <div style={{
                                border: '2px dashed #D1CBC1', borderRadius: 10, padding: '20px',
                                textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#FAF9F7',
                              }}>
                                <input
                                  type="file" accept="application/pdf,image/jpeg,image/png"
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) handleBLUpload(s.id, f); }}
                                  disabled={!!uploadingBL}
                                />
                                {uploadingBL === s.id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Loader2 size={18} color={COLORS.primary} className="e-spin" />
                                    <span style={{ fontSize: 13, color: COLORS.gray600 }}>Uploading B/L…</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload size={24} color={COLORS.accent} style={{ margin: '0 auto 8px', display: 'block' }} />
                                    <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray900, margin: '0 0 3px' }}>Upload Bill of Lading</p>
                                    <p style={{ fontSize: 11, color: COLORS.gray400, margin: 0 }}>PDF or image · Max 10MB</p>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* B/L Document */}
                              {s.bl_document_url && (
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 14px', background: '#F0FDF4', borderRadius: 8,
                                  border: '1px solid rgba(22,163,74,0.2)', marginBottom: 12,
                                }}>
                                  <FileText size={18} color="#16A34A" />
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', margin: 0 }}>Bill of Lading Uploaded</p>
                                    <p style={{ fontSize: 11, color: '#16A34A', margin: 0 }}>Buyer can view this document</p>
                                  </div>
                                  <a href={s.bl_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#166534', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Eye size={12} /> View
                                  </a>
                                </div>
                              )}

                              {/* Shipping Details */}
                              {(s.vessel_name || s.container_number || s.tracking_number || s.shipping_line) && (
                                <div style={{ background: '#FAF9F7', borderRadius: 8, padding: '12px 14px', border: '1px solid #E2DDD6', marginBottom: 12 }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: COLORS.accent, margin: '0 0 8px' }}>Shipping Details</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                                    {s.vessel_name && <div><span style={{ fontSize: 11, color: COLORS.gray400 }}>Vessel</span><p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>{s.vessel_name}</p></div>}
                                    {s.container_number && <div><span style={{ fontSize: 11, color: COLORS.gray400 }}>Container</span><p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>{s.container_number}</p></div>}
                                    {s.tracking_number && <div><span style={{ fontSize: 11, color: COLORS.gray400 }}>B/L #</span><p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>{s.tracking_number}</p></div>}
                                    {s.shipping_line && <div><span style={{ fontSize: 11, color: COLORS.gray400 }}>Line</span><p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>{s.shipping_line}</p></div>}
                                    {s.etd && <div><span style={{ fontSize: 11, color: COLORS.gray400 }}>ETD</span><p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>{new Date(s.etd).toLocaleDateString('en-GB')}</p></div>}
                                    {s.eta && <div><span style={{ fontSize: 11, color: COLORS.gray400 }}>ETA</span><p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>{new Date(s.eta).toLocaleDateString('en-GB')}</p></div>}
                                  </div>
                                </div>
                              )}

                              {/* Shipper Notes */}
                              {s.shipper_notes && (
                                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(217,119,6,0.2)', marginBottom: 12 }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Latest Update</p>
                                  <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.5 }}>{s.shipper_notes}</p>
                                </div>
                              )}
                            </>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: 10 }}>
                            {!needsBL && (
                              <button className="mk-btn mk-btn-outline mk-btn-block mk-btn-sm" onClick={() => { setSelectedShipment(s); setShowUpdateModal(true); }}>
                                <Edit2 size={13} /> Update Details
                              </button>
                            )}
                            {s.order_status === 'shipped' && (
                              <button className="mk-btn mk-btn-primary mk-btn-block mk-btn-sm" onClick={() => navigate(`/deal/${s.id}`)}>
                                <CheckCircle2 size={13} /> Mark Delivered
                              </button>
                            )}
                            {needsBL && (
                              <button className="mk-btn mk-btn-outline mk-btn-block mk-btn-sm" onClick={() => navigate(`/deal/${s.id}`)}>
                                View Deal Room <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Desktop aside rail */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="exporter-layout-rail">
              <div className="mk-card" style={{ padding: 18 }}>
                <p className="mk-eyebrow" style={{ marginBottom: 6 }}>Operations snapshot</p>
                <h3 className="mk-h2" style={{ marginBottom: 12 }}>Desktop summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Awaiting B/L', value: pendingBLCount },
                    { label: 'Shipped', value: shippedCount },
                    { label: 'Delivered', value: deliveredCount },
                    { label: 'Completed', value: completedCount },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '12px 13px', borderRadius: 12, background: '#FAF9F7', border: '1px solid #E7E2DA' }}>
                      <p style={{ color: '#A8A29E', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>{item.label}</p>
                      <div style={{ fontFamily: 'var(--mk-font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--mk-text)', lineHeight: 1 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: '12px 13px', borderRadius: 12, background: 'var(--mk-emerald-light)', border: '1px solid rgba(13,122,95,.14)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--mk-text-2)', lineHeight: 1.65, margin: 0 }}>
                    Upload B/L first, then add vessel details. Buyers track via the B/L number on the shipping line's website.
                  </p>
                </div>
              </div>

              <div className="mk-card" style={{ padding: 18 }}>
                <p className="mk-eyebrow" style={{ marginBottom: 6 }}>How it works</p>
                <h3 className="mk-h2" style={{ marginBottom: 12 }}>No API tracking</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Buyer funds escrow → order appears here.',
                    'Upload B/L PDF/image → status becomes "Shipped".',
                    'Add vessel name, container #, B/L number manually.',
                    'Buyer views B/L and tracks via shipping line website.',
                    'Buyer confirms delivery → escrow releases.',
                  ].map((item, i) => (
                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(13,122,95,.08)', border: '1px solid rgba(13,122,95,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mk-font-heading)', fontWeight: 800, fontSize: 12, color: 'var(--mk-emerald)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--mk-text-2)', margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="exp-bottom-nav e-si">
        <div className="exp-bottom-nav-inner">
          {NAV_ITEMS.map(item => {
            const active = item.name === 'Track'
            return (
              <button key={item.name} className="exp-bnav-btn" onClick={() => handleNav(item.path)}>
                <item.icon size={21} color={active ? COLORS.primaryDark : '#A8A29E'} />
                <span style={{ fontWeight: active ? 700 : 500, color: active ? COLORS.primaryDark : '#A8A29E' }}>{item.name}</span>
                {active && <span className="exp-bnav-dot" />}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Update Shipping Details Modal ── */}
      {showUpdateModal && selectedShipment && (
        <ShippingUpdateModal
          shipment={selectedShipment}
          onClose={() => { setShowUpdateModal(false); setSelectedShipment(null); }}
          onSave={handleUpdateDetails}
        />
      )}

      <style>{`
        @media (min-width: 1180px) {
          .exporter-layout { grid-template-columns: minmax(0, 1.35fr) 360px !important; }
          .exporter-layout-rail { position: sticky; top: 88px; }
        }
        @media (max-width: 1179px) { .exporter-layout-rail { position: static; } }
        @media (max-width: 767px) { .exporter-layout > aside { display: none !important; } }
      `}</style>
    </div>
  )
}

// ─── Shipping Update Modal ────────────────────────────────────────────────────
function ShippingUpdateModal({ shipment, onClose, onSave }: {
  shipment: Shipment
  onClose: () => void
  onSave: (id: string, details: any) => void
}) {
  const [form, setForm] = useState({
    vessel_name: shipment.vessel_name || '',
    container_number: shipment.container_number || '',
    tracking_number: shipment.tracking_number || '',
    shipping_line: shipment.shipping_line || '',
    etd: shipment.etd ? new Date(shipment.etd).toISOString().split('T')[0] : '',
    eta: shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '',
    shipper_notes: shipment.shipper_notes || '',
  })

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="e-fi" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div className="e-si" style={{
        background: 'white', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
        position: 'relative', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#DDD8D0' }} />
        </div>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, width: 32, height: 32,
          borderRadius: 10, background: '#F5F2EC', border: '1px solid #E2DDD6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><X size={16} color={COLORS.gray600} /></button>

        <div style={{ padding: '0 20px 20px' }}>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 20, margin: '0 0 16px' }}>
            Update Shipment Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'vessel_name', label: 'Vessel Name', placeholder: 'e.g. MSC GULSUN' },
              { key: 'container_number', label: 'Container Number', placeholder: 'e.g. MSCU1234567' },
              { key: 'tracking_number', label: 'B/L Number', placeholder: 'e.g. 1234567890' },
              { key: 'shipping_line', label: 'Shipping Line', placeholder: 'e.g. Maersk, MSC, CMA CGM' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, display: 'block' }}>{field.label}</label>
                <input type="text" placeholder={field.placeholder} value={(form as any)[field.key]}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2DDD6', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
                  onFocus={e => e.currentTarget.style.border = `1.5px solid ${COLORS.primary}`}
                  onBlur={e => e.currentTarget.style.border = '1px solid #E2DDD6'}
                />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, display: 'block' }}>ETD</label>
                <input type="date" value={form.etd} onChange={e => setForm(p => ({ ...p, etd: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2DDD6', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, display: 'block' }}>ETA</label>
                <input type="date" value={form.eta} onChange={e => setForm(p => ({ ...p, eta: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2DDD6', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, display: 'block' }}>Status Update Note</label>
              <textarea placeholder="e.g. Container loaded at Lagos port. Estimated departure June 20." rows={3}
                value={form.shipper_notes} onChange={e => setForm(p => ({ ...p, shipper_notes: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2DDD6', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', resize: 'vertical', outline: 'none' }}
                onFocus={e => e.currentTarget.style.border = `1.5px solid ${COLORS.primary}`}
                onBlur={e => e.currentTarget.style.border = '1px solid #E2DDD6'}
              />
            </div>
            <button className="mk-btn mk-btn-primary" onClick={() => onSave(shipment.id, form)} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              Save Details
            </button>
          </div>
        </div>
        <div style={{ height: 'max(20px, env(safe-area-inset-bottom, 20px))' }} />
      </div>
    </div>
  )
}