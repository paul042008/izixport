import type { CSSProperties } from 'react'

/** IziXport dashboard design system — use only these tokens in dashboard/deal UI */
export const DS = {
  cream: '#F8F6F1',
  card: '#FFFFFF',
  night: '#002E1A',
  nightLogo: '#001A10',
  green: '#006B3F',
  greenMid: '#004D2E',
  gold: '#C8991A',
  goldLight: 'rgba(200,153,26,0.1)',
  greenLight: 'rgba(0,107,63,0.08)',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
} as const

export const heroGradient = `linear-gradient(135deg, ${DS.night} 0%, ${DS.greenMid} 50%, ${DS.green} 100%)`

export const cardStyle: CSSProperties = {
  background: DS.card,
  border: `1px solid ${DS.border}`,
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  padding: 20,
}

export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: DS.cream,
  fontFamily: 'Barlow, system-ui, sans-serif',
  paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
  overflow: 'auto',
}

export const sectionLabel: CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: DS.gold,
  margin: '0 0 8px',
}

export const displayHeading: CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: DS.text,
}
