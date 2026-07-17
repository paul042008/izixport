// src/pages/dashboard/BuyerDashboard.tsx
// REDESIGNED - Gemini Style UI

import React from 'react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock, PackageSearch, Send, ShoppingBag, Truck, Users,
  CheckCircle2, Clock, MessageCircle, Shield, Home, Search,
  Package, MapPin, User, Share2, Filter, Bell,
  ArrowUpRight, ChevronRight, Globe, DollarSign, Loader2,
  ExternalLink, Zap, Award,
  X, Check, Calendar, Edit2,
  Briefcase, Video, PlusCircle, Plus, Camera,
  ChevronDown, LogOut
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { BUYER_SHELL_CSS } from '@/lib/dashboard/buyer-shell-css'
import { displayName, displayProductTitle, formatMoney, formatDate } from '@/lib/format'

// ─── Types ────────────────────────────────────────────────────────────────────
type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected'
type Tab = 'home' | 'search' | 'orders' | 'track' | 'profile'

interface UserProfile {
  id: string; email: string; full_name: string; company_name: string
  country: string; verification_status: VerificationStatus
  referral_code: string; total_traded: number; deals_completed: number; created_at: string
  email_verified?: boolean
}
interface Listing {
  id: string; title: string; price_per_unit: number; currency: string; unit: string
  min_order_quantity: number; available_quantity: number; origin_state: string; quality_grade: string
  enquiry_count: number; exporter_id: string; exporter_name: string
  exporter_verified: boolean; category: string; photos: string[] | null
  description?: string; shipping_terms?: string
}
interface Order {
  id: string; listing_id: string; listing_title: string; listing_unit: string
  price_per_unit: number; origin_state: string; quantity: number
  total_amount: number; currency: string; order_status: string
  escrow_status: string; created_at: string
  exporter_name?: string
  checklist?: { step_key: string; step_label: string; completed: boolean }[]
}
interface Stats { activeOrders: number; totalSpent: number; suppliersSaved: number }

// ─── Commodity meta ───────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; accent: string }> = {
  'hibiscus': { emoji: '🌺', accent: '#C06080' },
  'sesame':   { emoji: '🌾', accent: '#C4A84A' },
  'ginger':   { emoji: '🫚', accent: '#D4A843' },
  'cashew':   { emoji: '🥜', accent: '#B87840' },
  'cocoa':    { emoji: '🍫', accent: '#8B5E3C' },
  'pepper':   { emoji: '🌶️', accent: '#D45050' },
  'palm oil': { emoji: '🛢️', accent: '#D4721A' },
  'shea':     { emoji: '🌿', accent: '#6AAD5A' },
}
const getCategoryMeta = (cat: string, title: string) => {
  const k = Object.keys(CATEGORY_META).find(k =>
    cat?.toLowerCase().includes(k) || title?.toLowerCase().includes(k))
  return k ? CATEGORY_META[k] : { emoji: '📦', accent: '#9B7A2A' }
}

// ─── Brand colors ─────────────────────────────────────────────────────────────
const COLORS = {
  navBg: '#0C3825',
  primary: '#1A5C41',
  primaryDark: '#0C3825',
  primaryLight: 'rgba(26,92,65,0.08)',
  accent: '#9B7A2A',
  accentLight: 'rgba(155,122,42,0.08)',
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
}

// ─── Status configs ───────────────────────────────────────────────────────────
const ORDER_STATUS: Record<string,{label:string;color:string;bg:string;border:string}> = {
  enquiring:        {label:'Negotiating',      color:'#92400E', bg:'#FEF3C7', border:'rgba(217,119,6,0.25)'},
  payment_pending:  {label:'Payment Pending',  color:'#1D4ED8', bg:'#EFF6FF', border:'rgba(59,130,246,0.25)'},
  escrow_funded:    {label:'Escrow Funded',    color:'#166534', bg:'#F0FDF4', border:'rgba(22,163,74,0.25)'},
  escrow_pending:   {label:'Escrow Pending',   color:'#78716C', bg:'#F5F5F4', border:'rgba(168,162,158,0.3)'},
  escrow_confirmed: {label:'In Escrow',        color:'#166534', bg:'#F0FDF4', border:'rgba(22,163,74,0.25)'},
  freight_quoted:   {label:'Freight Quoted',   color:'#0369A1', bg:'#E0F2FE', border:'rgba(14,165,233,0.25)'},
  freight_approved: {label:'Freight Approved', color:'#0F766E', bg:'#CCFBF1', border:'rgba(20,184,166,0.25)'},
  shipped:          {label:'Shipped',          color:'#6D28D9', bg:'#F5F3FF', border:'rgba(139,92,246,0.25)'},
  delivered:        {label:'Delivered',        color:'#166534', bg:'#F0FDF4', border:'rgba(22,163,74,0.25)'},
  completed:        {label:'Completed',        color:'#111827', bg:'#F3F4F6', border:'rgba(17,24,39,0.15)'},
  cancelled:        {label:'Cancelled',        color:'#991B1B', bg:'#FEF2F2', border:'rgba(239,68,68,0.25)'},
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes bFadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes bFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes bScaleIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes bSlideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:none} }
  @keyframes bSpin    { to{transform:rotate(360deg)} }
  @keyframes bShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .bfu  { animation: bFadeUp  0.45s cubic-bezier(.16,1,.3,1) both }
  .bfi  { animation: bFadeIn  0.3s ease both }
  .bsi  { animation: bScaleIn 0.3s cubic-bezier(.16,1,.3,1) both }
  .bslu { animation: bSlideUp 0.35s cubic-bezier(.16,1,.3,1) both }
  .bspin { animation: bSpin 0.9s linear infinite }

  .buyer-root {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F9FAFB;
    min-height: 100vh;
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 8px));
    overflow-x: hidden;
  }

  .buyer-sidebar {
    display: none;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 240px;
    background: #0C3825;
    flex-direction: column;
    z-index: 40;
    overflow-y: auto;
  }
  .buyer-sidebar-logo {
    padding: 20px 18px 16px;
    background: rgba(0,0,0,0.15);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .buyer-sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  .buyer-sidebar-footer {
    padding: 12px 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .bsnav-item {
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
  .bsnav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
  .bsnav-item.active {
    background: rgba(255,255,255,0.1);
    color: #FFFFFF;
    font-weight: 700;
  }
  .bsnav-item .bsnav-dot {
    margin-left: auto;
    width: 7px; height: 7px; border-radius: 50%;
    background: #9B7A2A;
    flex-shrink: 0;
  }

  .buyer-header {
    position: sticky; top: 0; z-index: 30;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #E5E7EB;
    box-shadow: 0 1px 4px rgba(0,0,0,0.02);
    padding-top: env(safe-area-inset-top, 0px);
  }
  .buyer-header-inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; height: 60px;
    max-width: 100%;
  }

  .buyer-page {
    padding: 28px 24px 40px;
    max-width: 100%;
  }

  .buyer-bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(12px);
    border-top: 1px solid #E5E7EB;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
  }
  .buyer-bottom-nav-inner {
    display: flex; justify-content: space-around; align-items: center;
    padding: 6px 8px;
    padding-bottom: max(6px, env(safe-area-inset-bottom, 6px));
  }
  .bbnav-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 10px; border-radius: 10px;
    background: none; border: none; cursor: pointer;
    min-width: 52px; min-height: 44px;
    position: relative;
  }
  .bbnav-item span {
    font-size: 10px; font-weight: 500;
    color: #9CA3AF; letter-spacing: 0.01em; line-height: 1;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bbnav-item.active span { color: #0C3825; font-weight: 700; }
  .bbnav-dot {
    position: absolute; bottom: 3px;
    width: 4px; height: 4px; border-radius: 50%;
    background: #9B7A2A;
  }

  .buyer-card {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .buyer-card-hover {
    transition: transform 0.18s, box-shadow 0.18s;
    cursor: pointer;
  }
  .buyer-card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  }

  .bpage-eyebrow {
    font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: #9B7A2A; margin-bottom: 4px;
  }
  .bpage-heading {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 24px; color: #111827;
    line-height: 1.1;
  }

  .bstats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .bstat-tile {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 16px 14px;
    position: relative;
    overflow: hidden;
  }
  .bstat-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.05em; text-transform: uppercase;
    color: #6B7280; margin-bottom: 8px;
  }
  .bstat-value {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 22px; font-weight: 800; color: #111827; line-height: 1;
  }

  .baction-tile {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 18px 16px;
    cursor: pointer;
    transition: all 0.18s;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .baction-tile:hover {
    border-color: rgba(26,92,65,0.35);
    box-shadow: 0 4px 16px rgba(26,92,65,0.07);
    transform: translateY(-1px);
  }
  .baction-tile.locked { opacity: 0.5; cursor: not-allowed; }
  .baction-tile.locked:hover { transform: none; box-shadow: none; border-color: #E5E7EB; }

  .bhiw-step {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid #F3F4F6;
  }
  .bhiw-step:last-child { border-bottom: none; }
  .bhiw-num {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(26,92,65,0.07);
    border: 1px solid rgba(26,92,65,0.12);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 13px; color: #1A5C41;
    flex-shrink: 0;
  }

  .bmarket-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    align-items: start;
  }
  .bmarket-sidebar {
    background: #0C3825;
    border-radius: 16px;
    padding: 24px 20px;
    color: white;
    position: sticky;
    top: 88px;
  }
  .blistings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .blisting-card {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }
  .blisting-card:hover {
    border-color: #D1D5DB;
    box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }

  .border-card {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .border-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px;
    background: #F9FAFB;
    border-bottom: 1px solid #E5E7EB;
  }

  .bstatus-pill {
    display: inline-flex; align-items: center;
    padding: 4px 10px; border-radius: 6px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.01em;
    border-width: 1px; border-style: solid;
  }

  .bprofile-cover {
    height: 100px;
    background: linear-gradient(135deg, #0C3825 0%, #1A5C41 100%);
    border-radius: 16px 16px 0 0;
    position: relative;
  }
  .bprofile-avatar {
    position: absolute; bottom: -38px; left: 22px;
    width: 76px; height: 76px; border-radius: 16px;
    background: linear-gradient(135deg, #9B7A2A, #7A600F);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 26px; font-weight: 800; color: white;
    border: 4px solid white;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
  .bprofile-stats-row {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: #E5E7EB;
  }
  .bprofile-stat { background: white; padding: 16px 12px; text-align: center; }

  .bver-track {
    display: flex; align-items: center; justify-content: space-between;
    position: relative; padding: 0 8px; margin: 18px 0;
  }
  .bver-track::before {
    content: ''; position: absolute;
    top: 15px; left: 24px; right: 24px;
    height: 1.5px; background: #E5E7EB; z-index: 0;
  }
  .bver-fill {
    position: absolute; top: 15px; left: 24px;
    height: 1.5px; width: 33%;
    background: #9B7A2A; z-index: 1;
  }
  .bver-step {
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    position: relative; z-index: 2;
  }
  .bver-dot {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
  }

  .bdark-panel {
    background: #0C3825;
    border-radius: 16px;
    padding: 24px 20px;
    color: white;
    position: relative; overflow: hidden;
  }

  .bbtn-primary {
    background: #000000;
    color: white; border: none; border-radius: 12px;
    padding: 12px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600; font-size: 14px;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .bbtn-primary:hover { background: #1F2937; }
  .bbtn-primary:active { transform: scale(.98); }
  .bbtn-primary:disabled { opacity: .6; cursor: not-allowed; }

  .bbtn-outline {
    background: white; color: #374151;
    border: 1px solid #D1D5DB; border-radius: 12px;
    padding: 11px 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600; font-size: 14px;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.15s;
  }
  .bbtn-outline:hover { background: #F9FAFB; border-color: #9CA3AF; }

  .bsearch-bar-container {
    display: flex; flex-direction: column; gap: 12px;
    margin-bottom: 16px;
  }
  .bsearch-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    transition: border-color 0.15s;
    flex: 1;
  }
  .bsearch-bar:focus-within { border-color: #9CA3AF; }
  .bsearch-bar input {
    flex: 1; background: none; border: none; outline: none;
    font-size: 15px; color: #111827;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bsearch-bar input::placeholder { color: #9CA3AF; }

  .bfilter-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    font-size: 14px; font-weight: 500; color: #374151;
    cursor: pointer;
  }

  .bchip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 13px; font-weight: 500;
    cursor: pointer; border: 1px solid #E5E7EB;
    background: white; color: #4B5563;
    transition: all 0.15s; white-space: nowrap;
  }
  .bchip:hover { background: #F9FAFB; border-color: #D1D5DB; }
  .bchip.active { background: #111827; color: white; border-color: #111827; }

  .bskel {
    background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);
    background-size: 200% 100%;
    animation: bShimmer 1.5s infinite;
    border-radius: 8px;
  }

  .bempty {
    text-align: center; padding: 56px 24px;
    background: white; border-radius: 16px;
    border: 1px dashed #D1D5DB;
  }

  .bmodal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .bmodal-sheet {
    width: 100%; max-width: 640px;
    max-height: 94vh;
    background: white; border-radius: 24px 24px 0 0;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
    animation: bSlideUp 0.35s cubic-bezier(.16,1,.3,1) both;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .bmodal-content {
    overflow-y: auto;
    flex: 1;
    padding-bottom: 24px;
  }
  .bmodal-footer {
    border-top: 1px solid #E5E7EB;
    background: white;
    padding: 16px 24px;
    padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
    display: flex; flex-direction: column; gap: 12px;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }

  @media (min-width: 768px) {
    .buyer-sidebar { display: flex !important; }
    .buyer-bottom-nav { display: none !important; }
    .buyer-root { padding-bottom: 0 !important; }
    .buyer-header-inner { padding-left: 264px !important; padding-right: 32px !important; max-width: none !important; }
    .buyer-page { margin-left: 240px !important; max-width: none !important; padding: 28px 32px 40px !important; }
    .bmodal-overlay { align-items: center; }
    .bmodal-sheet { border-radius: 24px; max-height: 90vh; }
  }
  @media (max-width: 1100px) {
    .bmarket-layout { grid-template-columns: 1fr; }
    .bmarket-sidebar { position: static; display: none; }
    .blistings-grid { grid-template-columns: repeat(2, 1fr); }
    .bstats-row { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 767px) {
    .buyer-page { padding: 16px 16px calc(80px + env(safe-area-inset-bottom, 16px)) !important; }
    .buyer-header-inner { padding: 0 16px !important; }
    .bstats-row { grid-template-columns: repeat(2, 1fr); }
    .blistings-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .bstats-row { grid-template-columns: 1fr 1fr; }
    .blistings-grid { grid-template-columns: repeat(2, 1fr); }
  }
`

// ─── CSS injection ─────────────────────────────────────────────────────────────
let _cssInjected = false
function injectCSS(extra: string) {
  if (_cssInjected) return
  _cssInjected = true
  const el = document.createElement('style')
  el.id = 'buyer-dashboard-styles'
  el.textContent = CSS + extra
  document.head.appendChild(el)
}

const D = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms`, animationFillMode: 'both' })

const Skel = ({ w = '100%', h = 16, style }: { w?: string | number; h?: number; style?: React.CSSProperties }) =>
  <div className="bskel" style={{ width: w, height: h, ...style }} />

// ─── Verification Lock ────────────────────────────────────────────────────────
const VerificationLock = ({ message }: { message: string }) => (
  <div className="bempty">
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: '#F3F4F6', border: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 16px',
    }}>
      <Lock size={20} color="#9CA3AF" />
    </div>
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 8 }}>
      Verification Required
    </div>
    <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
      {message}
    </p>
  </div>
)


// ─── Enhanced Enquiry Modal (with view counter) ───────────────────────────────
interface EnquiryModalProps {
  listing: Listing; onConfirm: (requestedQuantity: number) => void; onCancel: () => void; loading: boolean
}
const EnquiryModal = ({ listing, onConfirm, onCancel, loading }: EnquiryModalProps) => {
  const meta = getCategoryMeta(listing.category, listing.title)
  const total = listing.price_per_unit * listing.min_order_quantity
  const hasRecordedView = useRef(false)
  const [activeImage, setActiveImage] = useState(0)
  const images = listing.photos || []

  // ── Quantity negotiation ──
  const [requestedQuantity, setRequestedQuantity] = useState<number>(listing.min_order_quantity)
  const [quantityError, setQuantityError] = useState('')

  const validateQuantity = (qty: number): string => {
    if (isNaN(qty) || qty <= 0) return 'Please enter a valid quantity.'
    if (qty < listing.min_order_quantity)
      return `Minimum order quantity is ${listing.min_order_quantity.toLocaleString()} ${listing.unit}.`
    if (qty > listing.available_quantity)
      return `Only ${listing.available_quantity.toLocaleString()} ${listing.unit} available.`
    return ''
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = e.target.valueAsNumber
    setRequestedQuantity(qty)
    setQuantityError(validateQuantity(qty))
  }

  const subtotal = (isNaN(requestedQuantity) ? 0 : requestedQuantity) * listing.price_per_unit

  useEffect(() => {
    if (!listing?.id || hasRecordedView.current) return

    const recordView = async () => {
      const { error } = await supabase.rpc('increment_views', { listing_id: listing.id })
      if (error) console.error('Failed to record view:', error)
    }

    recordView()
    hasRecordedView.current = true
  }, [listing?.id])

  return (
    <div className="bmodal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="bmodal-sheet">
        {/* Top Handle / Close */}
        <div style={{ position: 'relative' }}>
           <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, borderRadius: 2, background: '#D1D5DB', zIndex: 10 }} />
           <button onClick={onCancel} style={{
             position: 'absolute', top: 16, right: 16, zIndex: 10,
             background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', border: '1px solid #E5E7EB',
             borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
           }}>
             <X size={16} color="#4B5563" />
           </button>
        </div>

        <div className="bmodal-content">
          {/* Main Image */}
          <div style={{
            width: '100%', height: 320, background: '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid #E5E7EB',
            position: 'relative',
          }}>
            {images.length > 0 ? (
              <img 
                src={images[activeImage]} 
                alt={listing.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <Package size={64} color="#D1D5DB" />
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{
              display: 'flex', gap: 8, padding: '12px 16px',
              overflowX: 'auto', background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
            }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    width: 60, height: 60, flexShrink: 0,
                    borderRadius: 8, overflow: 'hidden',
                    border: idx === activeImage ? '2px solid #111827' : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    background: '#F3F4F6',
                    padding: 0,
                  }}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: '24px' }}>
            {/* Category Pill */}
            <div style={{ marginBottom: 12 }}>
               <span style={{ 
                 background: '#E8F5E9', color: '#2E7D32', fontSize: 12, fontWeight: 600, 
                 padding: '4px 12px', borderRadius: 16, display: 'inline-block' 
               }}>
                 {listing.category || 'Agriculture'}
               </span>
            </div>

            {/* Title & Price */}
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginBottom: 16 }}>
              {listing.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#111827' }}>${listing.price_per_unit}</span>
              <span style={{ fontSize: 16, color: '#6B7280', fontWeight: 500 }}>per {listing.unit}</span>
            </div>

            {/* 2x2 Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Available', value: `${listing.available_quantity.toLocaleString()} ${listing.unit}` },
                { label: 'Min Order', value: `${listing.min_order_quantity.toLocaleString()} ${listing.unit}` },
                { label: 'Origin', value: <span style={{display: 'flex', alignItems: 'center', gap: 4}}><MapPin size={14}/> {listing.origin_state}</span> },
                { label: 'Currency', value: listing.currency || 'USD' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 12, padding: '12px 16px' }}>
                   <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{item.label}</div>
                   <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Quantity Request - Prominent Section */}
            <div style={{ 
              marginBottom: 24, 
              background: '#F9FAFB', 
              padding: '20px', 
              borderRadius: 16,
              border: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12, textAlign: 'center' }}>
                Request Quantity
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                <input
                  type="number"
                  value={isNaN(requestedQuantity) ? '' : requestedQuantity}
                  onChange={handleQuantityChange}
                  min={listing.min_order_quantity}
                  max={listing.available_quantity}
                  step="any"
                  style={{
                    width: '160px',
                    padding: '14px 16px',
                    fontSize: 22,
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#111827',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    background: 'white',
                    outline: 'none',
                    border: `2px solid ${quantityError ? '#EF4444' : '#D1D5DB'}`,
                    borderRadius: 12,
                  }}
                />
                <span style={{ fontSize: 18, fontWeight: 600, color: '#6B7280' }}>{listing.unit}</span>
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                Min: {listing.min_order_quantity.toLocaleString()} {listing.unit} &nbsp;·&nbsp; Available: {listing.available_quantity.toLocaleString()} {listing.unit}
              </p>
              {quantityError && (
                <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#DC2626', marginTop: 8 }}>{quantityError}</p>
              )}
            </div>

            {/* Live Subtotal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 12,
              padding: '14px 20px',
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Estimated Goods Value
              </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>
                ${subtotal.toLocaleString()}
              </span>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Description</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B7280', whiteSpace: 'pre-wrap' }}>
                {listing.description || 'Premium quality organically grown export commodity. Ideal for extraction, confectionery, and general industrial use. Processed and packaged following standard international export quality guidelines.'}
              </p>
            </div>

            {/* Escrow note */}
            <div style={{ display: 'flex', gap: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 16px' }}>
              <Shield size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: '#166534', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                100% Escrow Protected. Your payment is held securely until you confirm safe delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bmodal-footer">
          {/* Seller Profile Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
             <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#4B5563' }}>
                {listing.exporter_name.slice(0, 1).toUpperCase()}
             </div>
             <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                 <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{listing.exporter_name}</span>
                 <CheckCircle2 size={14} color="#10B981" />
               </div>
               <span style={{ fontSize: 13, color: '#6B7280' }}>Verified Exporter · {listing.origin_state}</span>
             </div>
          </div>

          <button className="bbtn-primary" onClick={() => onConfirm(requestedQuantity)} disabled={loading || !!quantityError} style={{ width: '100%' }}>
            {loading ? <><Loader2 size={18} className="bspin" /> Processing...</> : 'Open Deal Room'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Rotating Tips (memoized) ─────────────────────────────────────────────────
const RotatingTipsPanel = React.memo(({ messages, currentIndex }: { messages: string[]; currentIndex: number }) => (
  <div className="bmarket-sidebar">
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
      <Zap size={14} color={COLORS.accent} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Why IziXport?</span>
    </div>
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 18, lineHeight: 1.2 }}>
      Nigeria's #1 Export Marketplace
    </div>
    <div style={{
      minHeight: 80, fontSize: 13, lineHeight: 1.7,
      color: 'rgba(255,255,255,0.7)',
      borderLeft: `2px solid ${COLORS.accent}80`,
      paddingLeft: 12, transition: 'opacity .3s',
    }}>
      {messages[currentIndex]}
    </div>
    <div style={{ display: 'flex', gap: 5, marginTop: 16 }}>
      {messages.map((_, i) => (
        <div key={i} style={{
          width: i === currentIndex ? 18 : 5, height: 3, borderRadius: 2,
          background: i === currentIndex ? COLORS.accent : 'rgba(255,255,255,0.18)',
          transition: 'all .3s',
        }} />
      ))}
    </div>
    <div style={{
      marginTop: 18, padding: 14,
      background: 'rgba(255,255,255,0.06)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <Shield size={14} color={COLORS.accent} style={{ marginBottom: 7 }} />
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
        100% escrow protection · Dispute resolution · Verified exporters only
      </p>
    </div>
  </div>
))

const getNextPendingStep = (order: Order) => {
  if (!order.checklist || order.checklist.length === 0) return null
  const validSteps = ['commercial_invoice','packing_list','certificate_of_origin','phytosanitary_cert','goods_to_carrier','bill_of_lading','delivered']
  const validChecklist = order.checklist.filter(c => validSteps.includes(c.step_key))
  const pending = validChecklist.filter(c => !c.completed)
  if (pending.length === 0) return null
  pending.sort((a, b) => validSteps.indexOf(a.step_key) - validSteps.indexOf(b.step_key))
  return pending[0]
}

const getChecklistProgress = (order: Order) => {
  if (!order.checklist || order.checklist.length === 0) return { completed: 0, total: 0 }
  const validSteps = ['commercial_invoice','packing_list','certificate_of_origin','phytosanitary_cert','goods_to_carrier','bill_of_lading','delivered']
  const validChecklist = order.checklist.filter(c => validSteps.includes(c.step_key))
  return {
    completed: validChecklist.filter(c => c.completed).length,
    total: validSteps.length,
  }
}

// ─── HOME TAB (REDESIGNED - Gemini Style) ─────────────────────────────────────
interface HomeTabProps {
  profile: UserProfile | null; isVerified: boolean; accountName: string
  stats: Stats; statsLoading: boolean; listings: Listing[]; listingsLoading: boolean
  orders: Order[]; ordersLoading: boolean
  getGreeting: () => string; handleShareReferral: () => void
  setActiveTab: (t: Tab) => void; navigate: ReturnType<typeof useNavigate>
  handleEnquiryClick: (listing: Listing) => void
}

const HomeTab = React.memo(({
  profile, isVerified, accountName, stats, statsLoading,
  listings, listingsLoading, orders, ordersLoading, getGreeting, handleShareReferral, setActiveTab, navigate, handleEnquiryClick,
}: HomeTabProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {/* Hero Card - Gemini Style */}
    <div className="bfu" style={{
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
          {profile?.company_name || profile?.full_name || 'Guest'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: isVerified ? 'rgba(134,239,172,0.15)' : 'rgba(255,255,255,0.15)',
            border: `1px solid ${isVerified ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.2)'}`,
            color: isVerified ? '#86EFAC' : '#FFFFFF',
          }}>
            {isVerified ? <><CheckCircle2 size={12} /> Verified Buyer</> : <><Clock size={12} /> Pending Verification</>}
          </span>
        </div>
      </div>

      {/* Stats Row inside Hero */}
      <div style={{ 
        display: 'flex', 
        gap: 0, 
        marginTop: 24, 
        borderTop: '1px solid rgba(255,255,255,0.1)', 
        paddingTop: 20 
      }}>
        <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{stats.activeOrders}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Active Orders</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D4A843' }}>
            {statsLoading ? '—' : stats.totalSpent >= 1000 ? `$${(stats.totalSpent / 1000).toFixed(1)}K` : `$${stats.totalSpent}`}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Total Spent</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{stats.suppliersSaved}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Suppliers</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button 
          onClick={() => setActiveTab('search')}
          style={{
            flex: 1,
            background: 'white',
            color: '#0C3825',
            border: 'none',
            borderRadius: 12,
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Search size={16} /> Browse Market
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          style={{
            flex: 1,
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 12,
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Package size={16} /> My Orders
        </button>
      </div>
    </div>

    {/* Discovery + Trust — Home Tab */}
    <div className="bfu" style={D(100)}>

      {/* New Arrivals */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="bpage-eyebrow">New Arrivals</p>
          <button onClick={() => setActiveTab('search')} style={{ background: 'none', border: 'none', color: '#1A5C41', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            See all <ChevronRight size={14} />
          </button>
        </div>

        {listingsLoading ? (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ minWidth: 220, height: 260, borderRadius: 16, overflow: 'hidden' }}>
                <div className="bskel" style={{ width: '100%', height: 140 }} />
                <div style={{ padding: 12 }}>
                  <div className="bskel" style={{ width: '80%', height: 16, marginBottom: 8 }} />
                  <div className="bskel" style={{ width: '50%', height: 14 }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bempty" style={{ padding: 24 }}>
            <Package size={24} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, color: '#6B7280' }}>No new listings yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
            {listings.slice(0, 5).map((item, i) => {
              const meta = getCategoryMeta(item.category, item.title)
              return (
                <div
                  key={item.id}
                  className="bfu"
                  style={{ ...D(i * 60), minWidth: 220, flexShrink: 0, scrollSnapAlign: 'start' }}
                  onClick={() => handleEnquiryClick(item)}
                >
                  <div style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.18s, boxShadow 0.18s',
                    }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{ height: 140, background: '#F3F4F6', position: 'relative' }}>
                      {item.photos && item.photos.length > 0 ? (
                        <img src={item.photos[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Package size={32} color="#D1D5DB" />
                        </div>
                      )}
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'white', color: '#374151',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      }}>
                        {item.category || 'Agriculture'}
                      </span>
                    </div>
                    <div style={{ padding: '14px' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 6, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                          ${item.price_per_unit.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>/{item.unit}</span>
                        </span>
                        <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} /> {item.origin_state}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{item.exporter_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Browse by Commodity */}
      <div style={{ marginBottom: 24 }}>
        <p className="bpage-eyebrow" style={{ marginBottom: 14 }}>Browse by Commodity</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { name: 'Sesame', emoji: '🌾', color: '#C4A84A' },
            { name: 'Cashew', emoji: '🥜', color: '#B87840' },
            { name: 'Cocoa', emoji: '🍫', color: '#8B5E3C' },
            { name: 'Hibiscus', emoji: '🌺', color: '#C06080' },
            { name: 'Ginger', emoji: '🫚', color: '#D4A843' },
            { name: 'Shea', emoji: '🌿', color: '#6AAD5A' },
          ].map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab('search')}
              className="bfu"
              style={{ ...D(i * 40),
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = cat.color
                e.currentTarget.style.boxShadow = `0 4px 12px ${cat.color}15`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{cat.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Why IziXport — Trust Strip */}
      <div className="bfu" style={D(200)}>
        <p className="bpage-eyebrow" style={{ marginBottom: 14 }}>Why IziXport</p>
        <div style={{
          background: 'linear-gradient(135deg, #0C3825 0%, #1A5C41 100%)',
          borderRadius: 20,
          padding: '24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={18} color="#D4A843" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>100% Escrow</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Funds held until you confirm delivery</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} color="#D4A843" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Verified Only</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Every exporter is KYC-verified</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={18} color="#D4A843" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Live Tracking</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Track every shipment milestone</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={18} color="#D4A843" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Dispute Ready</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>7-day dispute window after delivery</p>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveTab('search')} style={{
              width: '100%',
              background: 'white',
              color: '#0C3825',
              border: 'none',
              borderRadius: 12,
              padding: '12px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <Search size={16} /> Start Browsing
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bfu" style={D(300)}>
        <p className="bpage-eyebrow" style={{ marginBottom: 14 }}>How It Works</p>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { num: '1', title: 'Browse & Enquire', desc: 'Find verified Nigerian exporters and send enquiries' },
            { num: '2', title: 'Negotiate & Approve', desc: 'Agree on price and freight in your Trade Room' },
            { num: '3', title: 'Pay into Escrow', desc: 'Fund escrow securely. Exporter ships your goods' },
            { num: '4', title: 'Confirm Delivery', desc: 'Inspect goods, confirm delivery, escrow releases' },
          ].map((step, i) => (
            <div key={step.num} className="bhiw-step" style={{ borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
              <div className="bhiw-num">{step.num}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3 }}>{step.title}</p>
                <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {/* Quick Actions - 3 Only */}
    <div className="bfu" style={D(200)}>
      <p className="bpage-eyebrow" style={{ marginBottom: 12 }}>Quick Actions</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { name: 'Browse', icon: Search, action: () => setActiveTab('search') },
          { name: 'Orders', icon: Package, action: () => setActiveTab('orders') },
          { name: 'Messages', icon: MessageCircle, action: () => navigate('/messages') },
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
))


// ─── SEARCH TAB (Marketplace UI Redesign with Working Filters) ───────────────
interface SearchTabProps {
  isVerified: boolean; listings: Listing[]; listingsLoading: boolean
  rotatingMessages: string[]; currentMessageIndex: number
  handleEnquiryClick: (l: Listing) => void
}

const SearchTab = React.memo(({
  isVerified, listings, listingsLoading, rotatingMessages, currentMessageIndex, handleEnquiryClick,
}: SearchTabProps) => {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Extract unique categories from listings
  const categories = React.useMemo(() => {
    const cats = new Set(listings.map(l => l.category).filter(Boolean))
    return ['all', ...Array.from(cats)]
  }, [listings])

  const filtered = React.useMemo(() => {
    let result = listings
    if (query) {
      result = result.filter(l =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.origin_state?.toLowerCase().includes(query.toLowerCase()) ||
        l.category?.toLowerCase().includes(query.toLowerCase())
      )
    }
    if (selectedCategory !== 'all') {
      result = result.filter(l => l.category === selectedCategory)
    }
    return result
  }, [listings, query, selectedCategory])

  return (
    <div className="bfu" style={{ ...D(0), display: 'flex', flexDirection: 'column', gap: 20 }}>

      {!isVerified ? (
        <VerificationLock message="Complete identity verification to access verified Nigerian supplier listings." />
      ) : (
        <div className="bmarket-layout">
          <RotatingTipsPanel messages={rotatingMessages} currentIndex={currentMessageIndex} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Search and Filter Row */}
            <div className="bsearch-bar-container">
              <div className="bsearch-bar">
                <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." />
                {query && (
                  <button onClick={() => setQuery('')} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={12} color="#6B7280" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`bchip ${selectedCategory === cat ? 'active' : ''}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    border: selectedCategory === cat ? '1px solid #111827' : '1px solid #E5E7EB',
                    background: selectedCategory === cat ? '#111827' : 'white',
                    color: selectedCategory === cat ? 'white' : '#4B5563',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="blistings-grid">
              {listingsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="blisting-card" style={{ padding: 0 }}>
                      <Skel w="100%" h={200} style={{ borderRadius: '12px 12px 0 0' }} />
                      <div style={{ padding: 16 }}>
                         <Skel w="80%" h={18} /><div style={{ marginTop: 12 }}><Skel w="40%" h={14} /></div><div style={{ marginTop: 12 }}><Skel w="30%" h={20} /></div>
                      </div>
                    </div>
                  ))
                : filtered.map((item, i) => {
                    return (
                      <div key={item.id} className="blisting-card bfu" style={D(40 + i * 20)} onClick={() => handleEnquiryClick(item)}>
                        {/* Image Section */}
                        <div style={{ position: 'relative', width: '100%', height: 220, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <span style={{ 
                             position: 'absolute', top: 12, left: 12, background: 'white', color: '#374151', 
                             padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                           }}>
                             {item.category || 'Agriculture'}
                           </span>
                           {item.photos && item.photos.length > 0 ? (
                             <img src={item.photos[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                             <Package size={48} color="#D1D5DB" />
                           )}
                        </div>
                        {/* Details Section */}
                        <div style={{ padding: '16px' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 10, lineHeight: 1.3 }}>
                            {item.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <CheckCircle2 size={14} color="#10B981" />
                            <span style={{ fontSize: 13, color: '#6B7280' }}>{item.exporter_name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                            <MapPin size={14} color="#9CA3AF" />
                            <span style={{ fontSize: 13, color: '#6B7280' }}>{item.origin_state}</span>
                          </div>
                          {/* Updated stacked layout: price above unit, quantity above available */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>${item.price_per_unit.toLocaleString()}</span>
                              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>/{item.unit}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{item.available_quantity.toLocaleString()}</span>
                              <span style={{ fontSize: 12, color: '#6B7280' }}>available</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
              }
              {filtered.length === 0 && !listingsLoading && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="bempty">
                    <Search size={32} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 8 }}>No products found</p>
                    <button className="bbtn-outline" onClick={() => { setQuery(''); setSelectedCategory('all'); }}>Clear Filters</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// ─── ORDERS TAB (with Search + Status Filters) ─────────────────────────────────
interface OrdersTabProps {
  isVerified: boolean; orders: Order[]; ordersLoading: boolean
  stats: Stats; setActiveTab: (t: Tab) => void; navigate: ReturnType<typeof useNavigate>
}

const OrdersTab = React.memo(({ isVerified, orders, ordersLoading, stats, setActiveTab, navigate }: OrdersTabProps) => {
  const [query, setQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const statuses = React.useMemo(() => {
    const s = new Set(orders.map(o => o.order_status).filter(Boolean))
    return ['all', ...Array.from(s)]
  }, [orders])

  const filtered = React.useMemo(() => {
    let result = orders
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(o =>
        o.listing_title?.toLowerCase().includes(q) ||
        o.order_status?.toLowerCase().includes(q) ||
        o.exporter_name?.toLowerCase().includes(q)
      )
    }
    if (selectedStatus !== 'all') {
      result = result.filter(o => o.order_status === selectedStatus)
    }
    return result
  }, [orders, query, selectedStatus])

  return (
    <div className="bfu" style={{ ...D(0) }}>
      <div style={{ marginBottom: 24 }}>
        <p className="bpage-eyebrow">Procurement</p>
        <div className="bpage-heading">My Orders</div>
      </div>

      {!isVerified ? (
        <VerificationLock message="Verify your identity to view and manage your purchase orders." />
      ) : ordersLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => (
            <div key={i} className="bskel" style={{ height: 140, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Search + Filter */}
          <div className="bfu" style={{ ...D(50), marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
              }}>
                <Search size={16} color="#9CA3AF" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by product, exporter, or status..."
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontSize: 14, color: '#111827',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={14} color="#9CA3AF" />
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
                      border: selectedStatus === status ? '1.5px solid #111827' : '1px solid #E5E7EB',
                      background: selectedStatus === status ? '#111827' : 'white',
                      color: selectedStatus === status ? 'white' : '#4B5563',
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
                        background: selectedStatus === status ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                        padding: '1px 6px',
                        borderRadius: 10,
                      }}>
                        {orders.filter(o => o.order_status === status).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bempty">
              <Search size={32} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 8 }}>No orders found</p>
              <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                {query || selectedStatus !== 'all'
                  ? 'Try clearing your filters.'
                  : "Browse the marketplace and send your first enquiry to a verified Nigerian exporter."}
              </p>
              {query || selectedStatus !== 'all' ? (
                <button className="bbtn-outline" onClick={() => { setQuery(''); setSelectedStatus('all'); }}>
                  Clear Filters
                </button>
              ) : (
                <button className="bbtn-primary" onClick={() => setActiveTab('search')}>
                  <PackageSearch size={16} /> Browse Market
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((order, i) => {
                const status = ORDER_STATUS[order.order_status] || ORDER_STATUS.enquiring
                const meta   = getCategoryMeta('', order.listing_title)
                return (
                  <div key={order.id} className="border-card bfu" style={D(40 + i * 45)}>
                    <div className="border-head">
                      <div>
                        <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Order</p>
                        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 2 }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: 12 }}>
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="bstatus-pill" style={{ background: status.bg, color: status.color, borderColor: status.border }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                          background: '#F3F4F6', border: `1px solid #E5E7EB`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        }}>{meta.emoji}</div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <p style={{ fontWeight: 700, color: '#111827', fontSize: 15, lineHeight: 1.4, marginBottom: 6, wordBreak: 'break-word' }}>
                            {order.listing_title}
                          </p>
                          <p style={{ color: '#6B7280', fontSize: 13, wordBreak: 'break-word' }}>
                            {order.quantity > 0 ? `${order.quantity} ${order.listing_unit}` : 'Qty TBC'}
                            {order.origin_state ? ` · ${order.origin_state}, NG` : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, color: '#111827', lineHeight: 1, marginBottom: 4 }}>
                            ${order.total_amount.toLocaleString()}
                          </p>
                          <p style={{ color: order.escrow_status === 'held' ? '#10B981' : '#9CA3AF', fontSize: 11, fontWeight: 700 }}>
                            {order.escrow_status === 'held' ? '🔒 Escrow' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                        <button className="bbtn-primary" onClick={() => navigate(`/deal/${order.id}`)}
                          style={{ width: '100%', justifyContent: 'center', padding: '10px 0', borderRadius: 8, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <MessageCircle size={14} /> Trade Room
                        </button>
                        <button className="bbtn-outline" onClick={() => navigate('/dashboard/track')}
                          style={{ width: '100%', justifyContent: 'center', padding: '10px 0', borderRadius: 8, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Truck size={14} /> Track
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
})

// ─── TRACK TAB ────────────────────────────────────────────────────────────────
interface TrackTabProps { navigate: ReturnType<typeof useNavigate> }

const TrackTab = React.memo(({ navigate }: TrackTabProps) => {
  useEffect(() => { navigate('/dashboard/track') }, [navigate])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
      <Loader2 size={32} color="#111827" className="bspin" />
      <p style={{ color: '#6B7280', fontSize: 15, fontWeight: 500 }}>Opening shipment tracker…</p>
    </div>
  )
})

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
interface ProfileTabProps {
  profile: UserProfile; isVerified: boolean; accountName: string
  initials: string; stats: Stats; handleShareReferral: () => void
}

const ProfileTab = React.memo(({ profile, isVerified, accountName, initials, stats, handleShareReferral }: ProfileTabProps) => {
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      gap: 24,
      alignItems: 'start',
      ...D(0)
    }} className="bprofile-layout bfu">
      <div className="buyer-card">
        <div className="bprofile-cover">
          <div className="bprofile-avatar">{initials}</div>
        </div>
        <div style={{ padding: '48px 22px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 24, color: '#111827', marginBottom: 4 }}>
                {profile.company_name || profile.full_name}
              </div>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 12 }}>@{profile.email.split('@')[0]}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, rowGap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4B5563' }}><Globe size={14} /> {profile.country || 'Nigeria'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4B5563' }}><Calendar size={14} /> Since {memberSince}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: isVerified ? '#10B981' : '#D97706', fontWeight: 500 }}>
                  {isVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {isVerified ? 'Verified Buyer' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .bprofile-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
})


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BuyerDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [verStatus, setVerStatus] = useState<VerificationStatus>('pending')
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const [stats, setStats]                     = useState<Stats>({ activeOrders: 0, totalSpent: 0, suppliersSaved: 0 })
  const [statsLoading, setStatsLoading]       = useState(true)
  const [listings, setListings]               = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [orders, setOrders]                   = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading]     = useState(true)
  const [enquiryTarget, setEnquiryTarget]     = useState<Listing | null>(null)
  const [enquiryLoading, setEnquiryLoading]   = useState(false)

  const rotatingMessages = [
    "🛡️ All payments protected by IziXport Escrow — funds released only after you confirm delivery.",
    "🇳🇬 Source directly from verified Nigerian exporters with no middlemen involved.",
    "🚢 Full logistics support and live cargo tracking included on every order.",
    "💰 Best price guarantee — negotiate directly in your private Trade Room.",
    "⭐ Only A+ rated commodity suppliers pass our verification process.",
    "📦 Minimum order quantities as low as 1 ton, perfect for new importers.",
  ]
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    injectCSS(BUYER_SHELL_CSS)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % rotatingMessages.length)
    }, 5000)
    return () => clearInterval(id)
  }, [rotatingMessages.length])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab') as Tab | null
    if (tabParam && ['home', 'search', 'orders', 'track', 'profile'].includes(tabParam)) {
      if (tabParam !== activeTab) setActiveTab(tabParam)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab') as Tab | null
      if (tabParam && ['home', 'search', 'orders', 'track', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data: prof, error } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (error || !prof) { toast.error('Failed to load profile'); await supabase.auth.signOut(); navigate('/login'); return }
      setProfile(prof as UserProfile)
      setVerStatus(prof.verification_status as VerificationStatus)
      setLoading(false)
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => { if (!s) navigate('/login') })
    return () => { sub?.subscription.unsubscribe() }
  }, [navigate])

  const fetchStats = useCallback(async () => {
    if (!profile) return
    setStatsLoading(true)
    const { data: orders } = await supabase.from('orders').select('id,order_status,total_amount,exporter_id').eq('buyer_id', profile.id)
    if (orders) {
      setStats({
        activeOrders:   orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length,
        totalSpent:     orders.reduce((s, o) => s + (o.total_amount || 0), 0),
        suppliersSaved: new Set(orders.map(o => o.exporter_id)).size,
      })
    }
    setStatsLoading(false)
  }, [profile])

  const fetchListings = useCallback(async () => {
    setListingsLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select(`id,title,price_per_unit,currency,unit,min_order_quantity,available_quantity,origin_state,
               quality_grade,enquiry_count,exporter_id,category,photos,description,shipping_terms,
               exporter:users!listings_exporter_id_fkey(full_name,company_name,verified)`)
      .eq('status', 'active').limit(20)
    if (!error && data) {
      setListings(data.map((l: any) => ({
        id: l.id, title: l.title, price_per_unit: l.price_per_unit,
        currency: l.currency || 'USD', unit: l.unit, min_order_quantity: l.min_order_quantity,
        available_quantity: l.available_quantity || 0,
        origin_state: l.origin_state, quality_grade: l.quality_grade,
        enquiry_count: l.enquiry_count || 0, exporter_id: l.exporter_id,
        exporter_name: l.exporter?.company_name || l.exporter?.full_name || 'IziXport Seller',
        exporter_verified: l.exporter?.verified || false, category: l.category || '', photos: l.photos || null,
        description: l.description || undefined,
        shipping_terms: l.shipping_terms || undefined,
      })))
    }
    setListingsLoading(false)
  }, [])

  const fetchOrders = useCallback(async () => {
    if (!profile) return
    setOrdersLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`id,listing_id,quantity,total_amount,currency,order_status,escrow_status,created_at,
               listings:listing_id(title,price_per_unit,unit,origin_state),
               exporter:users!orders_exporter_id_fkey(company_name,full_name),
               deal_checklist(step_key,step_label,completed)`)
      .eq('buyer_id', profile.id).order('created_at', { ascending: false })
    if (!error && data) {
      setOrders(data.map((o: any) => ({
        id: o.id, listing_id: o.listing_id,
        listing_title: displayProductTitle(o.listings?.title),
        listing_unit: o.listings?.unit || 'unit',
        price_per_unit: o.listings?.price_per_unit || 0,
        origin_state: o.listings?.origin_state || '',
        quantity: o.quantity || 0, total_amount: o.total_amount || 0,
        currency: o.currency || 'USD', order_status: o.order_status,
        escrow_status: o.escrow_status, created_at: o.created_at,
        exporter_name: o.exporter?.company_name || o.exporter?.full_name || 'IziXport Seller',
        checklist: (o.deal_checklist || []).map((c: any) => ({
          step_key: c.step_key,
          step_label: c.step_label,
          completed: c.completed,
        })),
      })))
    }
    setOrdersLoading(false)
  }, [profile])

  useEffect(() => {
    if (profile) { fetchStats(); fetchListings(); fetchOrders() }
  }, [profile, fetchStats, fetchListings, fetchOrders])

  // Real-time: refresh orders when exporter updates checklist
  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('buyer-checklist-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deal_checklist' },
        () => { fetchOrders() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, fetchOrders])

  const isVerified  = verStatus === 'approved'
  const accountName = profile?.company_name || profile?.full_name || 'My Account'
  const initials    = accountName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const getGreeting = useCallback(() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }, [])

  const handleShareReferral = useCallback(async () => {
    const ref  = profile?.referral_code || profile?.id || 'buyer'
    const link = `${window.location.origin}/signup?ref=${ref}`
    try { await navigator.clipboard.writeText(link); toast.success('Referral link copied!') }
    catch { toast.error('Failed to copy link') }
  }, [profile])

  const handleEnquiryClick = useCallback((listing: Listing) => {
    if (!isVerified) { toast.error('Complete identity verification to send enquiries.'); return }
    setEnquiryTarget(listing)
  }, [isVerified])

  const handleConfirmEnquiry = useCallback(async (requestedQuantity: number) => {
    if (!enquiryTarget || !profile) return
    if (isNaN(requestedQuantity) ||
        requestedQuantity < enquiryTarget.min_order_quantity ||
        requestedQuantity > enquiryTarget.available_quantity) {
      toast.error('Please enter a valid quantity before confirming.')
      return
    }
    setEnquiryLoading(true)
    try {
      const subtotal = requestedQuantity * enquiryTarget.price_per_unit
      const { data: order, error: orderErr } = await supabase
        .from('orders').insert({
          buyer_id: profile.id,
          exporter_id: enquiryTarget.exporter_id,
          listing_id: enquiryTarget.id,
          order_status: 'enquiring', escrow_status: 'pending',
          requested_quantity: requestedQuantity,
          quantity: requestedQuantity,
          unit_price: enquiryTarget.price_per_unit,
          subtotal: subtotal,
          total_amount: subtotal,
          quantity_unit: enquiryTarget.unit,   // use the listing's unit
          currency: 'USD',
          quantity_locked: false,
        }).select().single()
      if (orderErr) throw orderErr

      // ─── INSERT SYSTEM MESSAGE ────────────────────────────────────────
      await supabase.from('messages').insert({
        order_id: order.id,
        sender_type: 'system',
        is_ai: true,
        content: `Buyer requested:

${requestedQuantity} ${enquiryTarget.unit}

Unit Price:
${formatMoney(enquiryTarget.price_per_unit, 'USD')}

Estimated Goods Value:
${formatMoney(subtotal, 'USD')}

Waiting for exporter response.`,
      })

      await supabase.from('notifications').insert({
        user_id: enquiryTarget.exporter_id,
        title: 'New Enquiry Received',
        message: `${profile?.company_name || profile?.full_name || 'A buyer'} is interested in ${enquiryTarget.title}. Open your Trade Room to respond.`,
        type: 'deal',
        read: false,
        link: `/deal/${order.id}`,
      })

      toast.success('Trade room opened! 🤝', { icon: '🌍' })
      setEnquiryTarget(null)
      setEnquiryLoading(false)
      setTimeout(() => navigate(`/deal/${order.id}`), 400)
    } catch (err: any) {
      toast.error(err?.message || 'Could not open trade room.')
      setEnquiryLoading(false)
    }
  }, [enquiryTarget, profile, navigate])

  const handleSignOut = useCallback(async () => {
    const confirmSignOut = window.confirm('Are you sure you want to sign out?')
    if (!confirmSignOut) return

    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }, [navigate])

  const navItems: { name: string; icon: React.ElementType; tab: Tab }[] = [
    { name: 'Home',    icon: Home,    tab: 'home'    },
    { name: 'Market',  icon: Search,  tab: 'search'  },
    { name: 'Orders',  icon: Package, tab: 'orders'  },
    { name: 'Track',   icon: Truck,   tab: 'track'   },
    { name: 'Profile', icon: User,    tab: 'profile' },
  ]

  // ─── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Loader2 size={32} color="#111827" className="bspin" />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 4 }}>IziXport</p>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Loading your dashboard…</p>
        </div>
      </div>
    </div>
  )

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="buyer-root">
      {enquiryTarget && (
        <EnquiryModal
          listing={enquiryTarget}
          onConfirm={handleConfirmEnquiry}
          onCancel={() => !enquiryLoading && setEnquiryTarget(null)}
          loading={enquiryLoading}
        />
      )}

      {/* Desktop sidebar */}
      <div className="buyer-sidebar">
        <div className="buyer-sidebar-logo">
          <img src="/logo.jpeg" alt="IziXport" style={{ height: 28, width: 'auto', display: 'block', borderRadius: 7 }} />
        </div>
        <div className="buyer-sidebar-nav">
          {navItems.map(item => {
            const isActive = activeTab === item.tab
            return (
              <button
                key={item.name}
                className={`bsnav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.tab === 'track') navigate('/dashboard/track')
                  else setActiveTab(item.tab)
                }}
              >
                <item.icon size={18} color={isActive ? 'white' : 'rgba(255,255,255,0.4)'} />
                {item.name}
                {isActive && <span className="bsnav-dot" />}
              </button>
            )
          })}
        </div>
        {profile && (
          <div className="buyer-sidebar-footer">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.07)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: COLORS.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 14, color: 'white',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.company_name?.split(' ')[0] || profile.full_name?.split(' ')[0] || 'User'}
                </p>
                <p style={{ color: isVerified ? COLORS.accent : 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, fontWeight: 500 }}>
                  {isVerified ? 'Verified Buyer' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="buyer-header">
        <div className="buyer-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB', display: 'inline-flex' }}>
              <img src="/logo.jpeg" alt="IziXport" style={{ height: 32, width: 'auto', display: 'block' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}>
              <Bell size={16} color="#4B5563" />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: '#EF4444', borderRadius: '50%', border: '1.5px solid white' }} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: isVerified ? '#F0FDF4' : '#FEF3C7',
              border: `1px solid ${isVerified ? '#BBF7D0' : '#FDE68A'}`,
              color: isVerified ? '#16A34A' : '#D97706',
            }}>
              {isVerified ? <><CheckCircle2 size={12} /> Verified</> : <><Clock size={12} /> Pending</>}
            </div>

            <button
              onClick={handleSignOut}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: '#4B5563',
              }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>

          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="buyer-page">
        {activeTab === 'home' && (
          <HomeTab
            profile={profile}
            isVerified={isVerified}
            accountName={accountName}
            stats={stats}
            statsLoading={statsLoading}
            listings={listings}
            listingsLoading={listingsLoading}
            orders={orders}
            ordersLoading={ordersLoading}
            getGreeting={getGreeting}
            handleShareReferral={handleShareReferral}
            setActiveTab={setActiveTab}
            navigate={navigate}
            handleEnquiryClick={handleEnquiryClick}
          />
        )}
        {activeTab === 'search' && (
          <SearchTab
            isVerified={isVerified}
            listings={listings}
            listingsLoading={listingsLoading}
            rotatingMessages={rotatingMessages}
            currentMessageIndex={currentMessageIndex}
            handleEnquiryClick={handleEnquiryClick}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            isVerified={isVerified}
            orders={orders}
            ordersLoading={ordersLoading}
            stats={stats}
            setActiveTab={setActiveTab}
            navigate={navigate}
          />
        )}
        {activeTab === 'track' && <TrackTab navigate={navigate} />}
        {activeTab === 'profile' && profile && (
          <ProfileTab
            profile={profile}
            isVerified={isVerified}
            accountName={accountName}
            initials={initials}
            stats={stats}
            handleShareReferral={handleShareReferral}
          />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="buyer-bottom-nav">
        <div className="buyer-bottom-nav-inner">
          {navItems.map(item => {
            const isActive = activeTab === item.tab
            return (
              <button
                key={item.name}
                className={`bbnav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.tab === 'track') navigate('/dashboard/track')
                  else setActiveTab(item.tab)
                }}
              >
                <item.icon size={22} color={isActive ? '#111827' : '#9CA3AF'} />
                <span>{item.name}</span>
                {isActive && <span className="bbnav-dot" style={{ background: '#111827' }} />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}