// src/pages/dashboard/Track.tsx
// Redesigned with manual B/L tracking — no APIs needed
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, Search, Package, Truck, User, Shield,
  Clock, ArrowRight, CheckCircle2, FileText, Download,
  Loader2, Bell, X, AlertTriangle, Globe, MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase/client'
import { displayName, formatMoney } from '../../lib/format'
import '../../styles/marketplace.css'

type FilterTab = 'all' | 'processing' | 'in_transit' | 'delivered' | 'disputed'

interface Order {
  id: string
  buyer_id: string
  exporter_id: string
  order_status: string
  shipment_status: string
  total_amount: number
  currency: string
  quantity: number
  shipping_terms: string
  // B/L & manual tracking fields
  bl_document_url: string | null
  bl_uploaded_at: string | null
  vessel_name: string | null
  container_number: string | null
  tracking_number: string | null
  shipping_line: string | null
  etd: string | null
  eta: string | null
  shipper_notes: string | null
  delivery_confirmed: boolean
  delivery_confirmed_at: string | null
  created_at: string
  listing: { title: string; price_per_unit: number; unit: string; origin_state: string }
  exporter: { full_name: string; company_name: string }
}

interface CurrentUser {
  id: string
  role: 'buyer' | 'exporter'
  full_name: string
  company_name?: string
  email?: string
  verification_status?: string
}

type BuyerTab = 'home' | 'search' | 'orders' | 'track' | 'profile'

const countryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    Netherlands: '🇳🇱', Germany: '🇩🇪', 'United States': '🇺🇸',
    France: '🇫🇷', 'United Kingdom': '🇬🇧', China: '🇨🇳',
  }
  return flags[country] || '🌍'
}

const productEmoji = (title: string): string => {
  const t = title.toLowerCase()
  if (t.includes('sesame')) return '🌾'
  if (t.includes('shea')) return '🧴'
  if (t.includes('ginger')) return '🫚'
  if (t.includes('cocoa')) return '🍫'
  if (t.includes('cashew')) return '🥜'
  if (t.includes('palm')) return '🌴'
  if (t.includes('hibiscus')) return '🌺'
  if (t.includes('pepper')) return '🌶️'
  return '📦'
}

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const hoursUntil = (iso: string): number => {
  if (!iso) return 0
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.floor(diff / 3_600_000))
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  escrow_confirmed: { label: 'Awaiting B/L', bg: '#FEF3C7', color: '#92400E' },
  shipped:          { label: 'In transit',  bg: '#F0FDF4', color: '#16A34A' },
  delivered:        { label: 'Delivered',   bg: '#F0FDF4', color: '#16A34A' },
  completed:        { label: 'Completed',   bg: '#F0FDF4', color: '#16A34A' },
  disputed:         { label: 'Disputed',    bg: '#FEF2F2', color: '#DC2626' },
  payment_pending:  { label: 'Processing',  bg: '#FEF3C7', color: '#92400E' },
}

function SkeletonCard() {
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ background: '#F9FAFB', padding: 18, height: 60, borderBottom: '1px solid #E5E7EB' }} />
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, width: '60%', background: '#F3F4F6', borderRadius: 4 }} />
        <div style={{ height: 12, width: '40%', background: '#F3F4F6', borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <div style={{ height: 40, flex: 1, borderRadius: 10, background: '#F3F4F6' }} />
          <div style={{ height: 40, flex: 1, borderRadius: 10, background: '#F3F4F6' }} />
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, currentUser, onTrack }: {
  order: Order
  currentUser: CurrentUser
  onTrack: (order: Order) => void
}) {
  const badge = STATUS_BADGE[order.order_status] || { label: order.order_status || 'Unknown', bg: '#F3F4F6', color: '#6B7280' }
  const isBuyer = currentUser.role === 'buyer'
  const hoursLeft = order.delivery_confirmed_at
    ? hoursUntil(new Date(new Date(order.delivery_confirmed_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
    : null
  const canDispute = order.order_status === 'delivered' && order.delivery_confirmed && hoursLeft && hoursLeft > 0

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s ease', cursor: 'pointer'
    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>

      <div style={{
        background: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Order</p>
          <h3 style={{ color: '#111827', fontWeight: 800, fontSize: 16, margin: 0 }}>
            #{order.id.substring(0, 9).toUpperCase()}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: 12, margin: '2px 0 0' }}>Placed {formatDate(order.created_at)}</p>
        </div>
        <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${badge.color}30` }}>
          {badge.label}
        </span>
      </div>

      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {productEmoji(order.listing.title)}
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, lineHeight: 1.4, marginBottom: 6, wordBreak: 'break-word' }}>
              {order.listing.title}
            </p>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>
              {order.quantity} {order.listing.unit}s · {order.shipping_terms}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontWeight: 800, color: '#111827', fontSize: 18, margin: 0 }}>
              {formatMoney(order.total_amount, order.currency)}
            </p>
            <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600, margin: '2px 0 0' }}>Escrow held</p>
          </div>
        </div>

        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: '#4B5563' }}>
          {isBuyer
            ? <>From <strong style={{ color: '#111827' }}>{order.exporter?.company_name || order.exporter?.full_name || 'IziXport Seller'}</strong> 🇳🇬</>
            : <>To <strong style={{ color: '#111827' }}>Buyer</strong></>
          }
        </div>

        {/* B/L uploaded indicator */}
        {order.bl_document_url && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          }}>
            <FileText size={16} color="#16A34A" />
            <span style={{ fontSize: 12, color: '#166534', fontWeight: 600, flex: 1 }}>Bill of Lading uploaded</span>
            <span style={{ fontSize: 11, color: '#16A34A' }}>View in tracker →</span>
          </div>
        )}

        {/* Shipper notes preview */}
        {order.shipper_notes && (
          <div style={{
            background: '#FEF3C7', border: '1px solid rgba(217,119,6,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          }}>
            <p style={{ fontSize: 11, color: '#92400E', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Latest from exporter</p>
            <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.5 }}>{order.shipper_notes}</p>
          </div>
        )}

        {/* Dispute warning */}
        {canDispute && hoursLeft && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> {hoursLeft}h left to raise dispute
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          <button onClick={() => onTrack(order)} style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            Track shipment <ArrowRight size={14} />
          </button>
          {order.order_status === 'delivered' && !order.delivery_confirmed && (
            <button onClick={() => {}} style={{ width: '100%', padding: '10px', background: '#000000', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Confirm delivery
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const TIMELINE_STEPS = [
  { key: 'confirmed',   label: 'Order confirmed' },
  { key: 'escrow',      label: 'Escrow funded' },
  { key: 'bl_uploaded', label: 'B/L uploaded' },
  { key: 'shipped',     label: 'Shipped — in transit' },
  { key: 'delivered',   label: 'Delivered' },
  { key: 'released',    label: 'Escrow released' },
]

const statusToStep: Record<string, number> = {
  payment_pending: 1,
  escrow_confirmed: 2,
  shipped: 4,
  delivered: 5,
  completed: 6,
  disputed: 4,
}

function TrackingModal({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (orderId: string) => void }) {
  const currentStep = statusToStep[order.order_status] || 1
  const badge = STATUS_BADGE[order.order_status] || { label: order.order_status, bg: '#F3F4F6', color: '#6B7280' }
  const isDelivered = order.order_status === 'delivered'
  const isCompleted = order.order_status === 'completed'
  const disputeDeadline = order.delivery_confirmed_at
    ? new Date(new Date(order.delivery_confirmed_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null
  const canDispute = isDelivered && order.delivery_confirmed && disputeDeadline && disputeDeadline > new Date()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: '24px 24px 0 0', maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#DDD8D0' }} />
        </div>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, width: 32, height: 32,
          borderRadius: 10, background: '#F5F2EC', border: '1px solid #E2DDD6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><X size={16} color="#78716A" /></button>

        <div style={{ padding: '0 24px 24px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Shipment</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
            #{order.tracking_number || order.id.substring(0, 9)}
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 16px' }}>
            {order.listing.origin_state || 'Nigeria'} → Your destination via {order.shipping_line || 'TBD'}
          </p>
          <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${badge.color}30` }}>
            {badge.label}
          </span>

          {/* Timeline */}
          <div style={{ marginTop: 28 }}>
            {TIMELINE_STEPS.map((step, i) => {
              const done = i < currentStep
              const active = i === currentStep - 1
              return (
                <div key={step.key} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: done ? '#10B981' : active ? '#111827' : '#F3F4F6',
                      border: done ? 'none' : active ? 'none' : '2px solid #E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', flexShrink: 0,
                    }}>
                      {done && <CheckCircle2 size={14} />}
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 24, background: done ? '#10B981' : '#E5E7EB', margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: done ? '#111827' : active ? '#111827' : '#9CA3AF', margin: 0 }}>
                      {step.label}
                    </p>
                    {done && <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{formatDate(order.created_at)}</p>}
                    {active && <p style={{ fontSize: 13, margin: '2px 0 0', color: '#10B981', fontWeight: 600 }}>Currently here</p>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* B/L Document Section */}
          {order.bl_document_url && (
            <div style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, padding: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FileText size={20} color="#16A34A" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#166534', margin: '0 0 2px' }}>Bill of Lading</p>
                  <p style={{ fontSize: 12, color: '#16A34A', margin: 0 }}>Uploaded {formatDate(order.bl_uploaded_at || order.created_at)}</p>
                </div>
              </div>
              <a
                href={order.bl_document_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', padding: '10px', background: '#16A34A', color: 'white',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                }}
              >
                <Download size={14} /> View / Download B/L
              </a>
            </div>
          )}

          {/* Shipping Details */}
          {(order.vessel_name || order.container_number || order.tracking_number || order.shipping_line || order.etd || order.eta) && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.1em', margin: '0 0 12px' }}>Shipping Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {order.vessel_name && (
                  <div><span style={{ fontSize: 11, color: '#9CA3AF' }}>Vessel</span><p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '2px 0 0' }}>{order.vessel_name}</p></div>
                )}
                {order.container_number && (
                  <div><span style={{ fontSize: 11, color: '#9CA3AF' }}>Container</span><p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '2px 0 0' }}>{order.container_number}</p></div>
                )}
                {order.tracking_number && (
                  <div><span style={{ fontSize: 11, color: '#9CA3AF' }}>B/L Number</span><p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '2px 0 0' }}>{order.tracking_number}</p></div>
                )}
                {order.shipping_line && (
                  <div><span style={{ fontSize: 11, color: '#9CA3AF' }}>Shipping Line</span><p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '2px 0 0' }}>{order.shipping_line}</p></div>
                )}
                {order.etd && (
                  <div><span style={{ fontSize: 11, color: '#9CA3AF' }}>ETD</span><p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '2px 0 0' }}>{formatDate(order.etd)}</p></div>
                )}
                {order.eta && (
                  <div><span style={{ fontSize: 11, color: '#9CA3AF' }}>ETA</span><p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '2px 0 0' }}>{formatDate(order.eta)}</p></div>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '12px 0 0', lineHeight: 1.5 }}>
                Track this container on the shipping line's website using the B/L number above.
              </p>
            </div>
          )}

          {/* Shipper Notes */}
          {order.shipper_notes && (
            <div style={{ background: '#FEF3C7', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 12, padding: 16, marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>Exporter Updates</p>
              <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.6 }}>{order.shipper_notes}</p>
            </div>
          )}

          {/* Actions */}
          {isDelivered && !order.delivery_confirmed && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { onConfirm(order.id); onClose(); }}
                style={{
                  width: '100%', padding: '14px', background: '#000000', color: 'white',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
                Confirm Delivery — Release Escrow
              </button>
              {canDispute && (
                <button
                  onClick={() => { toast('Dispute feature coming soon'); }}
                  style={{
                    width: '100%', padding: '12px', background: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <AlertTriangle size={14} /> Raise Dispute ({hoursUntil(disputeDeadline!.toISOString())}h left)
                </button>
              )}
            </div>
          )}

          {isCompleted && (
            <div style={{ marginTop: 20, background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <CheckCircle2 size={20} color="#16A34A" style={{ margin: '0 auto 6px', display: 'block' }} />
              <p style={{ fontWeight: 700, fontSize: 14, color: '#166534', margin: 0 }}>Delivery confirmed — escrow released</p>
            </div>
          )}

          <button onClick={onClose} style={{ width: '100%', padding: '14px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, marginTop: 20, cursor: 'pointer' }}>
            Close Tracker
          </button>
        </div>
        <div style={{ height: 'max(20px, env(safe-area-inset-bottom, 20px))' }} />
      </div>
    </div>
  )
}

function EmptyState({ filter }: { filter: FilterTab }) {
  const navigate = useNavigate()
  return (
    <div style={{ background: 'white', border: '1px dashed #D1D5DB', borderRadius: 16, textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Truck size={28} color="#9CA3AF" />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
        {filter === 'all' ? 'No active shipments yet' : `No ${filter.replace('_', ' ')} orders`}
      </h3>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>
        {filter === 'all'
          ? 'Your orders appear here once payment is confirmed and the exporter uploads the B/L.'
          : `You have no orders with ${filter.replace('_', ' ')} status.`}
      </p>
      {filter === 'all' && (
        <button onClick={() => navigate('/dashboard/buyer?tab=search')} style={{ background: '#000000', color: 'white', padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Browse listings <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}

export default function Track() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data: profile, error } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (error || !profile) {
        toast.error('Profile not found')
        await supabase.auth.signOut()
        navigate('/login')
        return
      }
      if (profile.role === 'exporter') { navigate('/dashboard/exporter/track', { replace: true }); return }
      setCurrentUser(profile as CurrentUser)
      setIsVerified(profile.verification_status === 'approved')
      setAuthLoading(false)
    }
    getUser()
  }, [navigate])

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    console.log('Buyer Track: Fetching for buyer_id =', currentUser.id)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        listings!listing_id(title, price_per_unit, unit, origin_state),
        exporter:users!exporter_id(full_name, company_name)
      `)
      .eq('buyer_id', currentUser.id)
      .not('order_status', 'in', '("enquiring","cancelled")')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Buyer Track fetch error:', error)
      toast.error('Failed to load shipments: ' + error.message)
      setLoading(false)
      return
    }
    console.log('Buyer Track: fetched', data?.length || 0, 'orders')
    if (data) {
      setOrders(data.map((o: any) => ({
        ...o,
        listing: o.listings || { title: 'Unknown', price_per_unit: 0, unit: 'unit', origin_state: '' },
        exporter: o.exporter || { full_name: 'Unknown', company_name: '' },
      })))
    }
    setLoading(false)
  }, [currentUser])

  useEffect(() => { if (currentUser) fetchOrders() }, [currentUser, fetchOrders])

  useEffect(() => {
    if (!currentUser) return
    const channel = supabase
      .channel('buyer-tracking-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `buyer_id=eq.${currentUser.id}` },
        (payload) => { console.log('Real-time update:', payload); setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUser])

  const handleConfirmDelivery = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_confirmed: true, order_status: 'completed', delivery_confirmed_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) toast.error('Failed to confirm delivery')
    else {
      toast.success('Delivery confirmed. Escrow released to exporter.')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_confirmed: true, order_status: 'completed', delivery_confirmed_at: new Date().toISOString() } : o))
    }
  }

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all',         label: 'All' },
    { key: 'processing',  label: 'Awaiting B/L' },
    { key: 'in_transit',  label: 'In transit' },
    { key: 'delivered',   label: 'Delivered' },
    { key: 'disputed',    label: 'Disputed' },
  ]

  const filteredOrders = activeFilter === 'all' ? orders : orders.filter(o => {
    if (activeFilter === 'processing') return o.order_status === 'escrow_confirmed' || o.order_status === 'payment_pending'
    if (activeFilter === 'in_transit') return o.order_status === 'shipped'
    if (activeFilter === 'delivered') return o.order_status === 'delivered'
    if (activeFilter === 'disputed') return o.order_status === 'disputed'
    return true
  })

  const inTransitCount = orders.filter(o => o.order_status === 'shipped').length
  const deliveredCount = orders.filter(o => o.order_status === 'delivered').length
  const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

  const navItems: { name: string; icon: typeof Home; tab: BuyerTab; path: string }[] = [
    { name: 'Home',    icon: Home,    tab: 'home',    path: '/dashboard/buyer?tab=home' },
    { name: 'Market',  icon: Search,  tab: 'search',  path: '/dashboard/buyer?tab=search' },
    { name: 'Orders',  icon: Package, tab: 'orders',  path: '/dashboard/buyer?tab=orders' },
    { name: 'Track',   icon: Truck,   tab: 'track',   path: '/dashboard/track' },
    { name: 'Profile', icon: User,    tab: 'profile', path: '/dashboard/buyer?tab=profile' },
  ]

  const userDisplayName = displayName(currentUser, 'My Account')
  const userInitials = userDisplayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const goNav = (tab: BuyerTab, path: string) => {
    if (tab === 'track') return
    navigate(path)
  }

  if (authLoading || !currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F9FAFB' }}>
        <Loader2 size={32} className="mk-spin" color="#111827" />
      </div>
    )
  }

  return (
    <div className="track-wrapper-root">
      {/* Sidebar */}
      <div className="buyer-sidebar">
        <div className="buyer-sidebar-logo">
          <img src="/logo.jpeg" alt="IziXport" style={{ height: 28, width: 'auto', display: 'block', borderRadius: 7 }} />
        </div>
        <div className="buyer-sidebar-nav">
          {navItems.map(item => {
            const isActive = item.tab === 'track'
            return (
              <button key={item.name} className={`bsnav-item ${isActive ? 'active' : ''}`} onClick={() => goNav(item.tab, item.path)}>
                <item.icon size={18} color={isActive ? 'white' : 'rgba(255,255,255,0.4)'} />
                {item.name}
                {isActive && <span className="bsnav-dot" />}
              </button>
            )
          })}
        </div>
        {currentUser && (
          <div className="buyer-sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: '#9B7A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 14, color: 'white' }}>
                {userInitials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userDisplayName.split(' ')[0]}
                </p>
                <p style={{ color: isVerified ? '#9B7A2A' : 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, fontWeight: 500 }}>
                  {isVerified ? 'Verified Buyer' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="buyer-content-pane">
        <header className="buyer-header">
          <div className="buyer-header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB', display: 'inline-flex' }}>
                <img src="/logo.jpeg" alt="IziXport" style={{ height: 32, width: 'auto', display: 'block' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ width: 36, height: 36, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} color="#4B5563" />
                <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: '#EF4444', borderRadius: '50%', border: '1.5px solid white' }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: isVerified ? '#F0FDF4' : '#FEF3C7', border: `1px solid ${isVerified ? '#BBF7D0' : '#FDE68A'}`, color: isVerified ? '#16A34A' : '#D97706' }}>
                {isVerified ? <><CheckCircle2 size={12} /> Verified</> : <><Clock size={12} /> Pending</>}
              </div>
            </div>
          </div>
        </header>

        <div className="track-container">
          <section className="track-hero">
            <div className="track-hero-grid">
              <div>
                <p style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>Logistics Control</p>
                <h1 style={{ fontWeight: 800, fontSize: 32, color: '#111827', lineHeight: 1.1, margin: 0 }}>Shipment Tracker</h1>
                <p style={{ color: '#6B7280', fontSize: 14, marginTop: 12, maxWidth: 600, lineHeight: 1.6 }}>
                  Track your orders from B/L upload to delivery confirmation. View Bills of Lading, vessel details, and shipping line info — all uploaded manually by your exporter.
                </p>
              </div>
              <div className="track-stats-grid">
                {[
                  { label: 'Active', value: orders.filter(o => !['completed', 'cancelled'].includes(o.order_status)).length },
                  { label: 'In transit', value: inTransitCount },
                  { label: 'Delivered', value: deliveredCount },
                  { label: 'Portfolio value', value: `$${totalValue.toLocaleString()}` },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '14px 16px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', margin: '0 0 6px' }}>{stat.label}</p>
                    <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', lineHeight: 1 }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                    border: activeFilter === f.key ? '1px solid #111827' : '1px solid #E5E7EB',
                    background: activeFilter === f.key ? '#111827' : '#FFFFFF',
                    color: activeFilter === f.key ? '#FFFFFF' : '#4B5563',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}>{f.label}</button>
                ))}
              </div>

              <div className="track-cards-grid">
                {loading
                  ? [1,2,3].map(i => <SkeletonCard key={i} />)
                  : filteredOrders.length === 0
                    ? <div style={{ gridColumn: '1/-1' }}><EmptyState filter={activeFilter} /></div>
                    : filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} currentUser={currentUser} onTrack={setTrackedOrder} />
                      ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {trackedOrder && <TrackingModal order={trackedOrder} onClose={() => setTrackedOrder(null)} onConfirm={handleConfirmDelivery} />}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {navItems.map(item => {
          const isActive = item.tab === 'track'
          return (
            <button key={item.name} type="button" onClick={() => goNav(item.tab, item.path)} className="mobile-nav-btn" style={{ '--active-color': isActive ? '#111827' : '#9CA3AF' } as React.CSSProperties}>
              <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.name}</span>
            </button>
          )
        })}
      </nav>

      <style>{`
        html, body { margin: 0; padding: 0; height: 100%; overflow-x: hidden; background: #F9FAFB; }
        #root, .track-wrapper-root { height: 100%; overflow-x: hidden; }
        .track-wrapper-root { display: flex; height: 100vh; height: 100dvh; width: 100%; overflow-x: hidden; background: #F9FAFB; font-family: 'Plus Jakarta Sans', sans-serif; }
        .buyer-content-pane { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)); }
        .buyer-sidebar { display: none; position: fixed; left:0; top:0; bottom:0; width: 240px; background: #0C3825; flex-direction: column; z-index: 40; overflow-y: auto; }
        .buyer-sidebar-logo { padding: 20px 18px 16px; background: rgba(0,0,0,0.15); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .buyer-sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
        .buyer-sidebar-footer { padding: 12px 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .bsnav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; border: none; background: none; cursor: pointer; color: rgba(255,255,255,0.5); font-weight: 600; font-size: 13.5px; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; text-align: left; transition: all 0.15s; white-space: nowrap; }
        .bsnav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
        .bsnav-item.active { background: rgba(255,255,255,0.1); color: #FFFFFF; font-weight: 700; }
        .bsnav-item .bsnav-dot { margin-left: auto; width: 7px; height: 7px; border-radius: 50%; background: #9B7A2A; flex-shrink: 0; }
        .buyer-header { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #E5E7EB; box-shadow: 0 1px 4px rgba(0,0,0,0.02); width: 100%; }
        .buyer-header-inner { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 60px; width: 100%; }
        .track-container { padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%; overflow-x: hidden; }
        .track-hero { background: white; border: 1px solid #E5E7EB; border-radius: 20px; padding: 32px; margin-bottom: 24px; }
        .track-hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; align-items: center; }
        .track-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .track-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .mobile-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.98); backdrop-filter: blur(12px); border-top: 1px solid #E5E7EB; display: flex; justify-content: space-around; align-items: center; padding: 8px 12px; padding-bottom: max(8px, env(safe-area-inset-bottom, 8px)); z-index: 100; transform: translateY(0); transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1); box-shadow: 0 -2px 10px rgba(0,0,0,0.02); }
        @keyframes slideUpNav { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .mobile-bottom-nav { animation: slideUpNav 0.25s ease-out; }
        .mobile-nav-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; padding: 6px 12px; border-radius: 30px; transition: all 0.15s; color: var(--active-color, #9CA3AF); font-weight: 500; font-size: 10px; }
        .mobile-nav-btn svg { stroke: currentColor; transition: stroke 0.1s; }
        .mobile-nav-btn span { font-size: 10px; font-weight: 600; }
        @media (min-width: 768px) { .buyer-sidebar { display: flex !important; } .mobile-bottom-nav { display: none !important; } .buyer-content-pane { padding-left: 240px !important; padding-bottom: 0 !important; } .buyer-header-inner { max-width: none !important; } .buyer-content-pane { overflow-y: auto; overflow-x: hidden; padding-bottom: 0; } html, body, #root, .track-wrapper-root { overflow: auto; } }
        @media (max-width: 900px) { .track-hero-grid { grid-template-columns: 1fr !important; gap: 16px; } .track-cards-grid { grid-template-columns: 1fr !important; } .track-container { padding: 16px; overflow-x: hidden; } .track-hero { padding: 24px 20px; } }
      `}</style>
    </div>
  )
}