// src/pages/admin/AdminPanel.tsx
// ROUTE: /admin
// 
// UPGRADED to a fully connected trade operations center.
// - All list pages now use server-side pagination and search.
// - Overview metrics are accurate (escrow held includes freight).
// - Admin chat uses sender_type='admin' and is rendered in DealRoom.
// - Escrow tools in the deal drawer call Pandascrow edge functions.
// - Dispute resolution integrates with Pandascrow release/freeze/refund.
// - Audit logging via reusable helper.
// - Production security: admin ID is never trusted from client.
//
// NEW: Dispute improvements (2026-07-24)
// - Admin deal drawer shows checklist documents and dispute evidence.
// - Admin can resolve disputes with "Release to Exporter" and "Refund Buyer" buttons.
// - File preview for all evidence documents.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard, ShieldCheck, Handshake, AlertTriangle,
  Users, Bell, ChevronRight, CheckCircle2, XCircle,
  Eye, RefreshCw, Ban, UserCheck, ExternalLink,
  Clock, DollarSign, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, X, FileText, LogOut,
  Globe, Search, Download, Copy, MessageCircle,
  Lock, Unlock, Send, ArrowUpRight, ArrowDownRight,
  Activity, Info, RotateCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Brand palette
const C = {
  darkGreen: '#002E1A',
  green: '#006B3F',
  gold: '#C8991A',
  cream: '#F8F6F1',
  white: '#FFFFFF',
};

type AdminTab = 'overview' | 'verifications' | 'deals' | 'disputes' | 'users' | 'notifications';
type VerifTab = 'pending' | 'approved' | 'rejected';
type DealFilter = 'all' | 'negotiating' | 'in_escrow' | 'shipping' | 'delivered' | 'disputed';
type EscrowFilter = 'all' | 'confirmed' | 'pending' | 'released' | 'refunded';

// ════════════════════════════════════════════════════════
// COUNTRY BUSINESS REGISTRY URLS — Admin verification helpers
// ════════════════════════════════════════════════════════
const COUNTRY_REGISTRY_URLS: Record<string, { registry: string; urls: { label: string; href: string }[] }> = {
  'Nigeria': {
    registry: 'Corporate Affairs Commission (CAC)',
    urls: [
      { label: 'CAC Public Search', href: 'https://pre.cac.gov.ng/check-availability' },
      { label: 'CAC Online Portal', href: 'https://services.cac.gov.ng' },
      { label: 'NEPC Verification', href: 'https://nepc.gov.ng' },
    ]
  },
  'India': {
    registry: 'Ministry of Corporate Affairs (MCA)',
    urls: [
      { label: 'MCA Company/LLP Search', href: 'https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do' },
      { label: 'MCA Portal', href: 'https://www.mca.gov.in' },
    ]
  },
  'China': {
    registry: 'National Enterprise Credit Info',
    urls: [
      { label: 'Enterprise Credit Search', href: 'http://www.gsxt.gov.cn' },
      { label: 'SAMR Portal', href: 'https://www.samr.gov.cn' },
    ]
  },
  'United Arab Emirates': {
    registry: 'Department of Economic Development (DED)',
    urls: [
      { label: 'Dubai DED License Search', href: 'https://www.ded.ae/en/public-services/business-name-search' },
      { label: 'Abu Dhabi DED', href: 'https://www.tamm.abudhabi/en/services/business' },
      { label: 'UAE MOE Portal', href: 'https://moe.gov.ae' },
    ]
  },
  'United Kingdom': {
    registry: 'Companies House',
    urls: [
      { label: 'Find Company Info', href: 'https://find-and-update.company-information.service.gov.uk' },
      { label: 'Companies House API', href: 'https://developer.company-information.service.gov.uk' },
    ]
  },
  'Germany': {
    registry: 'Handelsregister (Federal Gazette)',
    urls: [
      { label: 'Handelsregister Search', href: 'https://www.handelsregister.de' },
      { label: 'Federal Gazette', href: 'https://www.bundesanzeiger.de' },
    ]
  },
  'United States': {
    registry: 'Secretary of State / SEC',
    urls: [
      { label: 'SEC EDGAR (Public Companies)', href: 'https://www.sec.gov/edgar/searchedgar/companysearch' },
      { label: 'OpenCorporates (All States)', href: 'https://opencorporates.com' },
      { label: 'SBA SAM', href: 'https://sam.gov' },
    ]
  },
  'Singapore': {
    registry: 'ACRA (BizFile)',
    urls: [
      { label: 'ACRA BizFile+', href: 'https://www.bizfile.gov.sg' },
      { label: 'ACRA Search', href: 'https://www.acra.gov.sg' },
    ]
  },
  'South Africa': {
    registry: 'CIPC',
    urls: [
      { label: 'CIPC Company Search', href: 'https://www.cipc.co.za' },
      { label: 'CIPC eServices', href: 'https://eservices.cipc.co.za' },
    ]
  },
  'Kenya': {
    registry: 'eCitizen / BRS',
    urls: [
      { label: 'eCitizen Business', href: 'https://www.ecitizen.go.ke' },
      { label: 'BRS Search', href: 'https://brs.go.ke' },
    ]
  },
  'Ghana': {
    registry: "Registrar General's Department",
    urls: [
      { label: 'RGD Portal', href: 'https://rgd.gov.gh' },
      { label: 'Online Business Name Search', href: 'https://rgd.gov.gh/online-services' },
    ]
  },
  'Australia': {
    registry: 'ASIC',
    urls: [
      { label: 'ASIC Search', href: 'https://connectonline.asic.gov.au' },
      { label: 'ABN Lookup', href: 'https://abr.business.gov.au' },
    ]
  },
  'Canada': {
    registry: 'Corporations Canada / Provincial',
    urls: [
      { label: 'Corporations Canada', href: 'https://www.ic.gc.ca/app/scr/cc/CorporationsCanada/fdrlCrpSrch.html' },
      { label: 'Ontario Business Registry', href: 'https://www.ontario.ca/page/business-registry' },
    ]
  },
  'France': {
    registry: 'INPI / Infogreffe',
    urls: [
      { label: 'Infogreffe Search', href: 'https://www.infogreffe.fr' },
      { label: 'INPI National Registry', href: 'https://data.inpi.fr' },
    ]
  },
  'Netherlands': {
    registry: 'KVK (Chamber of Commerce)',
    urls: [
      { label: 'KVK Business Register', href: 'https://www.kvk.nl' },
    ]
  },
  'Brazil': {
    registry: 'Receita Federal (CNPJ)',
    urls: [
      { label: 'CNPJ Consulta', href: 'https://servicos.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp' },
    ]
  },
  'Turkey': {
    registry: 'MERSIS',
    urls: [
      { label: 'MERSIS Search', href: 'https://mersis.gumruk.gov.tr' },
    ]
  },
  'Saudi Arabia': {
    registry: 'MC.gov.sa',
    urls: [
      { label: 'Ministry of Commerce', href: 'https://mc.gov.sa' },
      { label: 'Commercial Registration', href: 'https://mc.gov.sa/en/eservices/Pages/commercialregistration.aspx' },
    ]
  },
  'Malaysia': {
    registry: 'SSM (Companies Commission)',
    urls: [
      { label: 'SSM e-Info', href: 'https://www.ssm-einfo.my' },
      { label: 'SSM Portal', href: 'https://www.ssm.com.my' },
    ]
  },
  'Indonesia': {
    registry: 'AHU / OSS',
    urls: [
      { label: 'AHU Online', href: 'https://ahu.go.id' },
      { label: 'OSS Portal', href: 'https://oss.go.id' },
    ]
  },
  'Thailand': {
    registry: 'DBD (Department of Business Development)',
    urls: [
      { label: 'DBD Search', href: 'https://www.dbd.go.th' },
    ]
  },
  'Vietnam': {
    registry: 'National Business Registration',
    urls: [
      { label: 'Business Registry', href: 'https://dangkykinhdoanh.gov.vn' },
    ]
  },
  'Japan': {
    registry: 'National Tax Agency / Legal Affairs',
    urls: [
      { label: 'NTA Corporate Number', href: 'https://www.houjin-bangou.nta.go.jp' },
      { label: 'Ministry of Justice', href: 'https://www.moj.go.jp' },
    ]
  },
  'South Korea': {
    registry: 'Hometax / Supreme Court',
    urls: [
      { label: 'Hometax Business', href: 'https://www.hometax.go.kr' },
    ]
  },
  'Russia': {
    registry: 'ФНС России (EGRUL)',
    urls: [
      { label: 'EGRUL Search', href: 'https://egrul.nalog.ru' },
    ]
  },
  'Mexico': {
    registry: 'SIEM / SAT',
    urls: [
      { label: 'SIEM Search', href: 'https://www.siem.gob.mx' },
      { label: 'SAT RFC Lookup', href: 'https://www.sat.gob.mx' },
    ]
  },
  'Italy': {
    registry: 'Registro Imprese',
    urls: [
      { label: 'Registro Imprese', href: 'https://www.registroimprese.it' },
      { label: 'InfoCamere', href: 'https://www.infocamere.it' },
    ]
  },
  'Spain': {
    registry: 'Registro Mercantil Central',
    urls: [
      { label: 'eRM Central', href: 'https://www.registradores.org' },
    ]
  },
  'Switzerland': {
    registry: 'UID / ZEFIX',
    urls: [
      { label: 'ZEFIX Search', href: 'https://www.zefix.ch' },
      { label: 'UID Register', href: 'https://www.uid.admin.ch' },
    ]
  },
  'Sweden': {
    registry: 'Bolagsverket',
    urls: [
      { label: 'Bolagsverket Search', href: 'https://www.bolagsverket.se' },
    ]
  },
  'Norway': {
    registry: 'Brønnøysund Register Centre',
    urls: [
      { label: 'Brønnøysundregistrene', href: 'https://www.brreg.no' },
    ]
  },
  'Denmark': {
    registry: 'CVR',
    urls: [
      { label: 'CVR Search', href: 'https://datacvr.virk.dk' },
    ]
  },
  'Finland': {
    registry: 'YTJ / PRH',
    urls: [
      { label: 'YTJ Search', href: 'https://www.ytj.fi' },
      { label: 'PRH', href: 'https://www.prh.fi' },
    ]
  },
  'Poland': {
    registry: 'KRS (National Court Register)',
    urls: [
      { label: 'KRS Search', href: 'https://ekrs.ms.gov.pl' },
    ]
  },
  'Belgium': {
    registry: 'KBO / BCE',
    urls: [
      { label: 'KBO / BCE Search', href: 'https://kbopub.economie.fgov.be' },
    ]
  },
  'Austria': {
    registry: 'Firmenbuch',
    urls: [
      { label: 'Firmenbuch Search', href: 'https://www.justiz.gv.at/firmenbuch' },
    ]
  },
  'Portugal': {
    registry: 'IRCT / RNPC',
    urls: [
      { label: 'RNPC Search', href: 'https://rnp.justica.gov.pt' },
    ]
  },
  'Ireland': {
    registry: 'CRO (Companies Registration Office)',
    urls: [
      { label: 'CRO Search', href: 'https://core.cro.ie' },
      { label: 'Companies House IE', href: 'https://www.companieshouse.ie' },
    ]
  },
  'New Zealand': {
    registry: 'Companies Office NZ',
    urls: [
      { label: 'NZ Companies Office', href: 'https://companiesoffice.govt.nz' },
    ]
  },
  'Pakistan': {
    registry: 'SECP',
    urls: [
      { label: 'SECP eServices', href: 'https://eservices.secp.gov.pk' },
      { label: 'SECP Company Search', href: 'https://www.secp.gov.pk' },
    ]
  },
  'Bangladesh': {
    registry: 'RJSC',
    urls: [
      { label: 'RJSC Portal', href: 'https://www.roc.gov.bd' },
    ]
  },
  'Egypt': {
    registry: 'GAFI',
    urls: [
      { label: 'GAFI Portal', href: 'https://www.gafi.gov.eg' },
    ]
  },
  'Morocco': {
    registry: 'OMPIC / RC',
    urls: [
      { label: 'OMPIC Search', href: 'https://www.ompic.ma' },
      { label: 'Portail National', href: 'https://www.portailnational.ma' },
    ]
  },
  'Israel': {
    registry: 'Israel Corporations Authority',
    urls: [
      { label: 'Corporations Search', href: 'https://ica.justice.gov.il' },
    ]
  },
  'Colombia': {
    registry: 'RUES',
    urls: [
      { label: 'RUES Search', href: 'https://www.rues.org.co' },
      { label: 'RUES Consulta', href: 'https://www.rues.org.co/RM/Consultas' },
    ]
  },
  'Argentina': {
    registry: 'IGJ (Inspección General de Justicia)',
    urls: [
      { label: 'IGJ Search', href: 'https://www.igj.gob.ar' },
    ]
  },
  'Chile': {
    registry: 'Conservador de Comercio',
    urls: [
      { label: 'Consulta RV', href: 'https://www.conservador.cl' },
    ]
  },
  'Peru': {
    registry: 'SUNARP',
    urls: [
      { label: 'SUNARP Search', href: 'https://www.sunarp.gob.pe' },
    ]
  },
  'Philippines': {
    registry: 'SEC Philippines',
    urls: [
      { label: 'SEC Express System', href: 'https://express.sec.gov.ph' },
      { label: 'SEC Search', href: 'https://www.sec.gov.ph' },
    ]
  },
  'Qatar': {
    registry: 'CR (Commercial Registration)',
    urls: [
      { label: 'Qatar CR Portal', href: 'https://www.cr.gov.qa' },
      { label: 'Ministry of Commerce', href: 'https://www.moci.gov.qa' },
    ]
  },
  'Kuwait': {
    registry: 'MOCI (Ministry of Commerce)',
    urls: [
      { label: 'Kuwait MOCI', href: 'https://www.moci.gov.kw' },
    ]
  },
  'Bahrain': {
    registry: 'Sijilat / MOIC',
    urls: [
      { label: 'Sijilat Portal', href: 'https://www.sijilat.bh' },
    ]
  },
  'Oman': {
    registry: 'MOCIIP / CR',
    urls: [
      { label: 'MOCIIP Portal', href: 'https://www.mociip.gov.om' },
      { label: 'Business Portal', href: 'https://investoreasy.gov.om' },
    ]
  },
  'Jordan': {
    registry: 'Companies Control Department',
    urls: [
      { label: 'CCD Search', href: 'https://www.ccd.gov.jo' },
    ]
  },
  'Lebanon': {
    registry: 'Commercial Register',
    urls: [
      { label: 'Ministry of Economy', href: 'https://www.economy.gov.lb' },
    ]
  },
  'Tanzania': {
    registry: 'BRELA',
    urls: [
      { label: 'BRELA Portal', href: 'https://www.brela.go.tz' },
      { label: 'ORS Online', href: 'https://ors.brela.go.tz' },
    ]
  },
  'Uganda': {
    registry: 'URSB',
    urls: [
      { label: 'URSB Search', href: 'https://www.ursb.go.ug' },
    ]
  },
  'Rwanda': {
    registry: 'RDB / ORS',
    urls: [
      { label: 'RDB Business', href: 'https://rdb.rw' },
      { label: 'ORS Portal', href: 'https://ors.gov.rw' },
    ]
  },
  'Ethiopia': {
    registry: 'Ministry of Trade',
    urls: [
      { label: 'Trade Ministry', href: 'https://www.mot.gov.et' },
    ]
  },
  'Zambia': {
    registry: 'PACRA',
    urls: [
      { label: 'PACRA Search', href: 'https://www.pacra.org.zm' },
    ]
  },
  'Zimbabwe': {
    registry: 'Deeds & Companies',
    urls: [
      { label: 'e-Gov Portal', href: 'https://www.zimtrade.co.zw' },
      { label: 'Companies Office', href: 'https://www.deeds.gov.zw' },
    ]
  },
  'Botswana': {
    registry: 'CIPA',
    urls: [
      { label: 'CIPA Portal', href: 'https://www.cipa.co.bw' },
    ]
  },
  'Namibia': {
    registry: 'BIPA',
    urls: [
      { label: 'BIPA Search', href: 'https://www.bipa.na' },
    ]
  },
  'Malawi': {
    registry: 'Registrar General',
    urls: [
      { label: 'Malawi e-Registry', href: 'https://www.registrar.gov.mw' },
    ]
  },
  'Mozambique': {
    registry: 'CRE (Conservatória)',
    urls: [
      { label: 'CRE Portal', href: 'https://www.portaldogoverno.gov.mz' },
    ]
  },
  'Angola': {
    registry: 'GUE / RCA',
    urls: [
      { label: 'Guichet Único', href: 'https://www.gue.gov.ao' },
    ]
  },
  'Cameroon': {
    registry: 'CFCE',
    urls: [
      { label: 'CFCE Portal', href: 'https://www.cfce.cm' },
    ]
  },
  'Ivory Coast': {
    registry: 'CCI / Guichet Unique',
    urls: [
      { label: 'Guichet Unique', href: 'https://www.guichetunique.ci' },
    ]
  },
  'Senegal': {
    registry: 'APIX / GUCE',
    urls: [
      { label: 'GUCE Senegal', href: 'https://www.guce.gouv.sn' },
    ]
  },
  'Tunisia': {
    registry: 'APII / RNE',
    urls: [
      { label: 'APII Portal', href: 'https://www.apii.tn' },
      { label: 'RNE Search', href: 'https://www.rne.tn' },
    ]
  },
  'Algeria': {
    registry: 'CNRC',
    urls: [
      { label: 'CNRC Portal', href: 'https://www.cnrc.dz' },
    ]
  },
};

function getCountryUrls(countryName: string) {
  const direct = COUNTRY_REGISTRY_URLS[countryName];
  if (direct) return direct;
  const key = Object.keys(COUNTRY_REGISTRY_URLS).find(k => countryName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(countryName.toLowerCase()));
  return key ? COUNTRY_REGISTRY_URLS[key] : null;
}

// ════════════════════════════════════════════════════════
// NEW: Audit Log Helper
// ════════════════════════════════════════════════════════
async function logAuditEvent({
  adminId,
  action,
  targetType,
  targetId,
  details,
  metadata,
}: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  metadata?: any;
}) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || null,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    });
    if (error) console.error('Audit log error:', error);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// ── NEW: Safe clipboard copy ──────────────────────────────
async function safeCopy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy, please copy manually.');
    }
    document.body.removeChild(textArea);
  }
}

// ── Helper to get document URLs from checklist item ──
function getDocumentUrls(step: any): string[] {
  const urls = Array.isArray(step.document_urls) ? step.document_urls.filter(Boolean) : [];
  if (urls.length > 0) return urls;
  return step.document_url ? [step.document_url] : [];
}

// ── Helper to check if order is fully closed ──────────
const isOrderClosed = (status: string) => {
  return ['completed', 'refunded', 'cancelled'].includes(status);
};

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('users')
        .select('role, full_name, email')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') { navigate('/'); return; }

      setAdminUser({ ...profile, id: session.user.id });
      setCheckingAuth(false);
    };
    check();
  }, [navigate]);

  // Live pending count
  useEffect(() => {
    if (!adminUser) return;

    const fetchCounts = async () => {
      const [{ count: pending }, { count: unread }] = await Promise.all([
        supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
        supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).eq('read', false),
      ]);
      setPendingCount(pending ?? 0);
      setUnreadCount(unread ?? 0);
    };
    fetchCounts();

    const verifSub = supabase.channel('admin-verif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, fetchCounts)
      .subscribe();
    const notifSub = supabase.channel('admin-notif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(verifSub);
      supabase.removeChannel(notifSub);
    };
  }, [adminUser]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.darkGreen }}>
        <div className="w-8 h-8 border-2 border-t-[#C8991A] border-white/20 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { key: 'verifications', label: 'Verifications', icon: <ShieldCheck size={18} />, badge: pendingCount },
    { key: 'deals', label: 'Active Deals', icon: <Handshake size={18} /> },
    { key: 'disputes', label: 'Disputes', icon: <AlertTriangle size={18} /> },
    { key: 'users', label: 'Users', icon: <Users size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: C.cream, fontFamily: 'Barlow, sans-serif' }}>

      {/* ── Sidebar (desktop) */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full z-40"
        style={{ background: C.darkGreen }}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            IziXport
          </h1>
          <span
            className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded mt-1 inline-block"
            style={{ background: C.gold, color: C.darkGreen }}
          >
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition"
              style={{
                background: activeTab === item.key ? `${C.gold}20` : 'transparent',
                color: activeTab === item.key ? C.gold : 'rgba(255,255,255,0.65)',
              }}
            >
              {item.icon}
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: C.gold, color: C.darkGreen }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: C.gold, color: C.darkGreen }}
            >
              {adminUser?.full_name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{adminUser?.full_name || 'Admin'}</p>
              <p className="text-xs text-white/40 truncate">{adminUser?.email}</p>
            </div>
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}
              className="text-white/40 hover:text-white"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-4 sticky top-0 z-30"
          style={{ background: C.darkGreen }}
        >
          <h1 className="text-lg font-black text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            IziXport Admin
          </h1>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: C.gold, color: C.darkGreen }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-3 sm:p-6">
          {activeTab === 'overview' && <OverviewPage adminId={adminUser?.id} />}
          {activeTab === 'verifications' && <VerificationsPage adminId={adminUser?.id} />}
          {activeTab === 'deals' && <DealsPage adminId={adminUser?.id} />}
          {activeTab === 'disputes' && <DisputesPage adminId={adminUser?.id} />}
          {activeTab === 'users' && <UsersPage />}
          {activeTab === 'notifications' && <NotificationsPage />}
        </div>
      </main>

      {/* ── Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-2 px-2"
        style={{ background: C.darkGreen, borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 relative"
            style={{ color: activeTab === item.key ? C.gold : 'rgba(255,255,255,0.5)' }}
          >
            {item.icon}
            <span className="text-[9px] font-semibold">{item.label.split(' ')[0]}</span>
            {item.badge && item.badge > 0 ? (
              <span
                className="absolute -top-0.5 -right-0.5 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: C.gold, color: C.darkGreen }}
              >
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 1: OVERVIEW — Fixed escrow stats and added metrics
// ════════════════════════════════════════════════════════
function OverviewPage({ adminId }: { adminId: string }) {
  const [stats, setStats] = useState<{
    totalExporters: number;
    totalBuyers: number;
    verifiedUsers: number;
    verifiedExporters: number;
    verifiedBuyers: number;
    escrowHeld: number;
    totalOrders: number;
    pendingVerifications: number;
    dealsNegotiating: number;
    dealsEscrow: number;
    goodsShipped: number;
    disputedDeals: number;
    releasedFunds: number;
    platformRevenue: number;
    pendingReviews: number;
    todayTransactions: number;
    avgDealSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    const [
      { count: totalExporters },
      { count: totalBuyers },
      { count: verifiedUsers },
      { count: verifiedExporters },
      { count: verifiedBuyers },
      { count: pendingVerifications },
      { data: escrowData },
      { count: totalOrders },
      { count: dealsNegotiating },
      { count: dealsEscrow },
      { count: goodsShipped },
      { count: disputedDeals },
      { data: releasedData },
      { data: platformFeeData },
      { count: pendingReviews },
      { count: todayTransactions },
      { data: allOrdersForAvg },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'exporter'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'exporter').eq('verified', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'buyer').eq('verified', true),
      supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
      // Escrow held: sum (total_amount + shipping_amount) where escrow_status in funded/confirmed/held
      supabase.from('orders').select('total_amount, shipping_amount').in('escrow_status', ['funded','confirmed','held']),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'enquiring'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).in('escrow_status', ['funded','confirmed','held']),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'goods_shipped'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'disputed'),
      // Released funds: sum total_amount+shipping_amount where escrow_status = 'released'
      supabase.from('orders').select('total_amount, shipping_amount').eq('escrow_status', 'released'),
      // Platform revenue: sum platform_fee_amount from orders where escrow_status = 'released' or 'completed'
      supabase.from('orders').select('platform_fee_amount').in('escrow_status', ['released', 'completed']),
      supabase.from('exporter_reviews').select('*', { count: 'exact', head: true }).is('review', null),
      // Today's transactions: orders created today
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      // For average deal size: all orders with total_amount
      supabase.from('orders').select('total_amount, shipping_amount'),
    ]);

    const escrowHeld = (escrowData || []).reduce((sum, o) => sum + (Number(o.total_amount) + Number(o.shipping_amount || 0)), 0);
    const releasedFunds = (releasedData || []).reduce((sum, o) => sum + (Number(o.total_amount) + Number(o.shipping_amount || 0)), 0);
    const platformRevenue = (platformFeeData || []).reduce((sum, o) => sum + Number(o.platform_fee_amount || 0), 0);
    const totalDeals = allOrdersForAvg || [];
    const avgDealSize = totalDeals.length ? (totalDeals.reduce((sum, o) => sum + Number(o.total_amount), 0) / totalDeals.length) : 0;

    setStats({
      totalExporters: totalExporters ?? 0,
      totalBuyers: totalBuyers ?? 0,
      verifiedUsers: verifiedUsers ?? 0,
      verifiedExporters: verifiedExporters ?? 0,
      verifiedBuyers: verifiedBuyers ?? 0,
      escrowHeld,
      totalOrders: totalOrders ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
      dealsNegotiating: dealsNegotiating ?? 0,
      dealsEscrow: dealsEscrow ?? 0,
      goodsShipped: goodsShipped ?? 0,
      disputedDeals: disputedDeals ?? 0,
      releasedFunds,
      platformRevenue,
      pendingReviews: pendingReviews ?? 0,
      todayTransactions: todayTransactions ?? 0,
      avgDealSize,
    });
  }, []);

  const fetchActivity = useCallback(async () => {
    const [{ data: verifs }, { data: orders }] = await Promise.all([
      supabase.from('verifications')
        .select('created_at, status, user:users!verifications_user_id_fkey(full_name, role, company_name)')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('orders')
        .select('created_at, order_status, total_amount, currency, listing:listings(title)')
        .order('created_at', { ascending: false }).limit(5),
    ]);

    const feed = [
      ...(verifs || []).map((v: any) => ({
        type: 'verification',
        text: `${v.user?.company_name || v.user?.full_name || 'A user'} submitted for verification`,
        time: v.created_at,
      })),
      ...(orders || []).map((o: any) => ({
        type: 'order',
        text: `Deal ${o.order_status}: ${o.listing?.title || 'Product'} — $${Number(o.total_amount || 0).toLocaleString()}`,
        time: o.created_at,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    setActivity(feed);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchActivity()]);
      setLoading(false);
    };
    init();

    const usersSub = supabase.channel('overview-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchStats)
      .subscribe();
    const verifSub = supabase.channel('overview-verifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => {
        fetchStats();
        fetchActivity();
      })
      .subscribe();
    const ordersSub = supabase.channel('overview-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchStats();
        fetchActivity();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(verifSub);
      supabase.removeChannel(ordersSub);
    };
  }, [fetchStats, fetchActivity]);

  const StatCard = ({ label, value, sub, accent }: { label: string; value: any; sub?: string; accent?: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7280' }}>{label}</p>
      <p
        className="text-4xl font-black"
        style={{ fontFamily: 'Barlow Condensed, sans-serif', color: accent || C.darkGreen }}
      >
        {loading ? '—' : value}
      </p>
      {sub && <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  );

  const totalUsers = (stats?.totalExporters ?? 0) + (stats?.totalBuyers ?? 0);

  return (
    <div>
      <PageHeader title="Overview" subtitle="Platform health at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          sub={`Exporters: ${stats?.totalExporters ?? 0} · Buyers: ${stats?.totalBuyers ?? 0}`}
        />
        <StatCard
          label="Verified Users"
          value={(stats?.verifiedUsers ?? 0).toLocaleString()}
          sub={`${stats?.verifiedExporters ?? 0} exporters, ${stats?.verifiedBuyers ?? 0} buyers`}
          accent={C.green}
        />
        <StatCard
          label="Escrow Held"
          value={`$${(stats?.escrowHeld ?? 0).toLocaleString()}`}
          sub={`${stats?.totalOrders ?? 0} total orders`}
          accent={C.gold}
        />
        <StatCard
          label="Pending Reviews"
          value={stats?.pendingVerifications ?? 0}
          sub={(stats?.pendingVerifications ?? 0) > 0 ? 'Need your review' : 'All caught up!'}
          accent={(stats?.pendingVerifications ?? 0) > 0 ? '#EF4444' : C.green}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Deals Negotiating" value={stats?.dealsNegotiating ?? 0} accent="#2563EB" />
        <StatCard label="In Escrow" value={stats?.dealsEscrow ?? 0} accent={C.gold} />
        <StatCard label="Goods Shipped" value={stats?.goodsShipped ?? 0} accent="#0369A1" />
        <StatCard label="Disputed" value={stats?.disputedDeals ?? 0} accent="#DC2626" />
        <StatCard label="Released Funds" value={`$${(stats?.releasedFunds ?? 0).toLocaleString()}`} accent="#059669" />
        <StatCard label="Platform Revenue" value={`$${(stats?.platformRevenue ?? 0).toLocaleString()}`} accent={C.gold} />
        <StatCard label="Pending Reviews" value={stats?.pendingReviews ?? 0} accent="#8B5CF6" />
        <StatCard label="Today's Transactions" value={stats?.todayTransactions ?? 0} accent="#6B7280" />
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-base" style={{ color: C.darkGreen }}>Recent Activity</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: item.type === 'verification' ? '#E6F2ED' : '#FEF9EC' }}
                >
                  {item.type === 'verification'
                    ? <ShieldCheck size={14} style={{ color: C.green }} />
                    : <Handshake size={14} style={{ color: C.gold }} />
                  }
                </div>
                <p className="text-sm flex-1" style={{ color: '#374151' }}>{item.text}</p>
                <span className="text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                  {timeAgo(item.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 2: VERIFICATIONS — Server-side pagination & search
// ════════════════════════════════════════════════════════
function VerificationsPage({ adminId }: { adminId: string }) {
  const [tab, setTab] = useState<VerifTab>('pending');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectSheet, setRejectSheet] = useState<{ open: boolean; verification: any | null }>({ open: false, verification: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOther, setRejectOther] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  // Document viewer modal
  const [docModal, setDocModal] = useState<{ open: boolean; url: string | null; label: string }>({ open: false, url: null, label: '' });

  // Country registry panel
  const [registryPanel, setRegistryPanel] = useState<{ open: boolean; country: string }>({ open: false, country: '' });

  const REJECT_REASONS = [
    'Documents unclear or unreadable',
    'Business name mismatch',
    'Expired document submitted',
    'Invalid CAC number / registration',
    'Missing required document',
    'Suspicious or altered document',
    'Other (type below)',
  ];

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    const statusMap: Record<VerifTab, string> = {
      pending: 'under_review',
      approved: 'approved',
      rejected: 'rejected',
    };
    let query = supabase
      .from('verifications')
      .select(`
        id, user_id, status, created_at, updated_at,
        cac_verified, nin_verified, cac_number, nin_number, cac_company_name, cac_company_type, cac_registration_date,
        admin_notes, reviewed_by, reviewed_at, documents_deleted,
        cac_document_url, nepc_document_url, id_document_url,
        user:users!verifications_user_id_fkey(
          id, full_name, company_name, country, role, email, created_at, verified, verification_status
        )
      `, { count: 'exact' })
      .eq('status', statusMap[tab])
      .order('created_at', { ascending: tab === 'pending' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Server-side search
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `cac_number.ilike.${term}, nin_number.ilike.${term}, cac_company_name.ilike.${term}, user.full_name.ilike.${term}, user.company_name.ilike.${term}, user.email.ilike.${term}`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('Fetch verifications error:', error);
      toast.error('Failed to load verifications');
    }
    setVerifications(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [tab, page, pageSize, search]);

  useEffect(() => { fetchVerifications(); }, [fetchVerifications]);

  useEffect(() => {
    const sub = supabase.channel('verif-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, fetchVerifications)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchVerifications]);

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    const { data, error } = await supabase.storage
      .from('verifications')
      .createSignedUrl(filePath, 3600);
    if (error) { console.error('Signed URL error:', error); return null; }
    return data?.signedUrl || null;
  };

  const openDocument = async (filePath: string, label: string) => {
    if (!filePath) { toast.error('No document available'); return; }
    const url = await getSignedUrl(filePath);
    if (url) setDocModal({ open: true, url, label });
    else toast.error('Unable to generate document link');
  };

  const handleApprove = async (verification: any) => {
    setActionLoading(verification.id);
    try {
      const { error } = await supabase.functions.invoke('admin-verify-user', {
        body: {
          action: 'approve',
          verificationId: verification.id,
          userId: verification.user_id,
          adminId,
        }
      });
      if (error) throw error;
      toast.success('Account approved and documents deleted');
      await logAuditEvent({ adminId, action: 'approve_verification', targetType: 'verification', targetId: verification.id });
      await fetchVerifications();
    } catch (err: any) {
      toast.error(err.message || 'Approval failed. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    const verification = rejectSheet.verification;
    if (!verification) return;
    const reason = rejectReason === 'Other (type below)' ? rejectOther : rejectReason;
    if (!reason) { toast.error('Please select a rejection reason'); return; }

    setActionLoading(verification.id);
    try {
      const { error } = await supabase.functions.invoke('admin-verify-user', {
        body: {
          action: 'reject',
          verificationId: verification.id,
          userId: verification.user_id,
          adminId,
          reason,
        }
      });
      if (error) throw error;
      toast.success('Account rejected. User notified.');
      await logAuditEvent({ adminId, action: 'reject_verification', targetType: 'verification', targetId: verification.id, details: reason });
      setRejectSheet({ open: false, verification: null });
      setRejectReason('');
      setRejectOther('');
      await fetchVerifications();
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReReview = async (verification: any) => {
    setActionLoading(verification.id);
    try {
      const { error } = await supabase.functions.invoke('admin-verify-user', {
        body: {
          action: 'rereview',
          verificationId: verification.id,
          userId: verification.user_id,
          adminId,
        }
      });
      if (error) throw error;
      toast.success('Moved back to pending review');
      await logAuditEvent({ adminId, action: 'rereview_verification', targetType: 'verification', targetId: verification.id });
      await fetchVerifications();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Verifications" subtitle="Review and approve user business verifications" />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by CAC, NIN, name, email, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ border: '1.5px solid #E5E7EB' }}
          onFocus={(e) => (e.currentTarget.style.border = `1.5px solid ${C.green}`)}
          onBlur={(e) => (e.currentTarget.style.border = '1.5px solid #E5E7EB')}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['pending', 'approved', 'rejected'] as VerifTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-full text-sm font-semibold capitalize transition whitespace-nowrap"
            style={{
              background: tab === t ? C.darkGreen : '#fff',
              color: tab === t ? '#fff' : '#6B7280',
              border: tab === t ? 'none' : '1px solid #E5E7EB',
            }}
          >
            {t} ({tab === t ? totalCount : 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: C.green }} />
          <p className="font-bold text-lg" style={{ color: C.darkGreen }}>
            {tab === 'pending' ? 'All caught up! No pending verifications.' : `No ${tab} verifications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map(v => (
            <VerificationCard
              key={v.id}
              v={v}
              tab={tab}
              actionLoading={actionLoading}
              onApprove={() => handleApprove(v)}
              onReject={() => setRejectSheet({ open: true, verification: v })}
              onReReview={() => handleReReview(v)}
              onOpenDoc={(path: string, label: string) => openDocument(path, label)}
              onOpenRegistry={(country: string) => setRegistryPanel({ open: true, country })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Sheet */}
      {rejectSheet.open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-xl" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
                Reject Verification
              </h3>
              <button onClick={() => setRejectSheet({ open: false, verification: null })}>
                <X size={20} style={{ color: '#9CA3AF' }} />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Rejection reason (user will be notified):
            </p>

            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRejectReason(r)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition"
                  style={{
                    background: rejectReason === r ? '#FEF2F2' : '#F9FAFB',
                    border: rejectReason === r ? '1.5px solid #EF4444' : '1.5px solid #E5E7EB',
                    color: rejectReason === r ? '#DC2626' : '#374151',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {rejectReason === 'Other (type below)' && (
              <textarea
                placeholder="Type your reason..."
                value={rejectOther}
                onChange={e => setRejectOther(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-4 resize-none"
                style={{ border: '1.5px solid #E5E7EB' }}
              />
            )}

            <button
              onClick={handleReject}
              disabled={!rejectReason || actionLoading === rejectSheet.verification?.id}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: '#DC2626' }}
            >
              {actionLoading === rejectSheet.verification?.id ? 'Processing…' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {docModal.open && docModal.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>{docModal.label}</h3>
              <div className="flex items-center gap-2">
                <a href={docModal.url} target="_blank" rel="noreferrer" download className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
                  <Download size={12} /> Download
                </a>
                <button onClick={() => setDocModal({ open: false, url: null, label: '' })} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
              {docModal.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={docModal.url} className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200" title={docModal.label} />
              ) : (
                <img src={docModal.url} alt={docModal.label} className="max-w-full max-h-[70vh] rounded-lg shadow-lg border border-gray-200" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Country Registry Panel */}
      {registryPanel.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={20} style={{ color: C.gold }} />
                <h3 className="font-black text-lg" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
                  Verify {registryPanel.country}
                </h3>
              </div>
              <button onClick={() => setRegistryPanel({ open: false, country: '' })}>
                <X size={20} style={{ color: '#9CA3AF' }} />
              </button>
            </div>

            {(() => {
              const info = getCountryUrls(registryPanel.country);
              if (!info) return (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No direct registry links available for <strong>{registryPanel.country}</strong>.</p>
                  <p className="text-xs text-gray-400 mt-1">Try a general search or request docs from the user.</p>
                </div>
              );
              return (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>
                    Official Registry: {info.registry}
                  </p>
                  <div className="space-y-2">
                    {info.urls.map((u, i) => (
                      <a
                        key={i}
                        href={u.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-[#C8991A] hover:bg-[#FFFBF2] transition group"
                      >
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>{u.label}</span>
                        <ExternalLink size={14} className="text-gray-300 group-hover:text-[#C8991A] transition" />
                      </a>
                    ))}
                  </div>
                  <p className="text-xs mt-4 text-gray-400 leading-relaxed">
                    💡 Copy the company name from the verification card and paste it into the registry search to cross-check registration.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function VerificationCard({ v, tab, actionLoading, onApprove, onReject, onReReview, onOpenDoc, onOpenRegistry }: any) {
  const [expanded, setExpanded] = useState(false);
  const role = v.user?.role;
  const country = v.user?.country || '';
  const isNigerian = country.toLowerCase().includes('nigeria');
  const initials = (v.user?.company_name || v.user?.full_name || '?').slice(0, 2).toUpperCase();

  const docs = isNigerian
    ? [
        v.cac_document_url && { label: 'CAC Certificate', path: v.cac_document_url },
        v.nepc_document_url && { label: 'NEPC Certificate', path: v.nepc_document_url },
        v.id_document_url && { label: 'Passport / National ID', path: v.id_document_url },
      ].filter(Boolean)
    : [
        v.business_registration_url && { label: 'Business Registration', path: v.business_registration_url },
        v.iec_certificate_url && { label: 'Import License', path: v.iec_certificate_url },
        v.passport_url && { label: 'Passport / National ID', path: v.passport_url },
      ].filter(Boolean);

  const registryInfo = getCountryUrls(country);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border overflow-hidden"
      style={{ borderColor: '#E5E7EB' }}
    >
      {/* Header */}
      <div className="p-5" style={{ background: C.cream }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0"
            style={{ background: C.darkGreen, color: C.gold }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-black text-base leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
                {v.user?.company_name || v.user?.full_name || 'Unknown'}
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: role === 'exporter' ? '#E6F2ED' : '#FEF9EC', color: role === 'exporter' ? C.green : C.gold }}
              >
                {role || 'USER'}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: isNigerian ? '#E6F2ED' : '#EFF6FF', color: isNigerian ? C.green : '#2563EB' }}
              >
                {isNigerian ? 'NIGERIAN' : 'INTERNATIONAL'}
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>{v.user?.full_name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{v.user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs" style={{ color: '#6B7280' }}>📍 {country || '—'}</span>
              {registryInfo && tab === 'pending' && (
                <button
                  onClick={() => onOpenRegistry(country)}
                  className="text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition"
                  style={{ background: '#FEF9EC', color: C.gold }}
                >
                  <Globe size={10} /> Verify via Registry
                </button>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{timeAgo(v.created_at)}</p>
            {tab === 'rejected' && v.admin_notes && (
              <p className="text-xs mt-1 text-red-500 max-w-[160px] ml-auto text-right leading-tight">{v.admin_notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Verification Results — MANUAL REVIEW VIEW */}
      <div className="px-5 py-4 border-t border-b border-gray-100">
        {isNigerian ? (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">CAC Number</span>
              <p className="text-sm font-mono text-blue-900 mt-0.5">{v.cac_number || 'Not provided'}</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">NIN Number</span>
              <p className="text-sm font-mono text-blue-900 mt-0.5">{v.nin_number || 'Not provided'}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              ⏳ Awaiting manual review
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              🌍 {country}
            </span>
            <span className="text-xs text-gray-500">
              {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded for manual review
            </span>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="px-5 py-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3 w-full text-left"
          style={{ color: '#6B7280' }}
        >
          <FileText size={13} />
          Submitted Documents
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{docs.length}</span>
          {expanded ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
        </button>

        {expanded && (
          <div className="space-y-2">
            {v.documents_deleted ? (
              <p className="text-xs italic py-2" style={{ color: '#9CA3AF' }}>
                🗑️ Documents deleted after review
              </p>
            ) : docs.length === 0 ? (
              <p className="text-xs py-2" style={{ color: '#9CA3AF' }}>No documents attached</p>
            ) : (
              docs.map((doc: any) => (
                <div
                  key={doc.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="shrink-0" style={{ color: '#9CA3AF' }} />
                    <span className="text-xs font-medium truncate" style={{ color: '#374151' }}>{doc.label}</span>
                  </div>
                  <button
                    onClick={() => onOpenDoc(doc.path, doc.label)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shrink-0 ml-2"
                    style={{ color: C.gold, background: '#FEF9EC' }}
                  >
                    <Eye size={11} /> View
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {tab === 'pending' && (
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onApprove}
            disabled={actionLoading === v.id}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
            style={{ background: C.green }}
          >
            {actionLoading === v.id ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><CheckCircle2 size={15} /> Approve</>
            )}
          </button>
          <button
            onClick={onReject}
            disabled={actionLoading === v.id}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
            style={{ border: `1.5px solid #DC2626`, color: '#DC2626' }}
          >
            <XCircle size={15} /> Reject
          </button>
        </div>
      )}

      {tab === 'rejected' && (
        <div className="px-5 pb-5">
          <button
            onClick={onReReview}
            disabled={actionLoading === v.id}
            className="flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition"
            style={{ color: C.gold }}
          >
            <RefreshCw size={14} /> Re-review
          </button>
        </div>
      )}

      {tab === 'approved' && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
            <CheckCircle2 size={13} />
            Approved by admin on {v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : '—'}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 3: ACTIVE DEALS — Live monitoring with server-side pagination/search, escrow tools, and admin chat
// ════════════════════════════════════════════════════════
function DealsPage({ adminId }: { adminId: string }) {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<DealFilter>('all');
  const [escrowFilter, setEscrowFilter] = useState<EscrowFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // === FIXED: Added filteredDeals definition ===
  const filteredDeals = useMemo(() => {
    let result = deals;

    // Order status filter
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'negotiating') {
        result = result.filter(d => d.order_status === 'enquiring');
      } else if (orderStatusFilter === 'in_escrow') {
        result = result.filter(d => ['funded', 'confirmed', 'held'].includes(d.escrow_status));
      } else if (orderStatusFilter === 'shipping') {
        result = result.filter(d => d.order_status === 'goods_shipped');
      } else if (orderStatusFilter === 'delivered') {
        result = result.filter(d => d.order_status === 'delivered');
      } else if (orderStatusFilter === 'disputed') {
        result = result.filter(d => d.order_status === 'disputed');
      } else {
        result = result.filter(d => d.order_status === orderStatusFilter);
      }
    }

    // Escrow filter
    if (escrowFilter !== 'all') {
      result = result.filter(d => d.escrow_status === escrowFilter);
    }

    // Search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(d => {
        const buyerName = (d.buyer?.company_name || d.buyer?.full_name || '').toLowerCase();
        const exporterName = (d.exporter?.company_name || d.exporter?.full_name || '').toLowerCase();
        const orderId = (d.id || '').toLowerCase();
        const tracking = (d.tracking_number || '').toLowerCase();
        const paymentRef = (d.payment_reference || '').toLowerCase();
        return (
          buyerName.includes(term) ||
          exporterName.includes(term) ||
          orderId.includes(term) ||
          tracking.includes(term) ||
          paymentRef.includes(term)
        );
      });
    }

    return result;
  }, [deals, orderStatusFilter, escrowFilter, searchTerm]);
  // ===========================================

  // Drawer state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [disputeInfo, setDisputeInfo] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Escrow tools state
  const [escrowToolLoading, setEscrowToolLoading] = useState<string | null>(null);
  const [escrowStatusData, setEscrowStatusData] = useState<any>(null);
  const [showEscrowStatus, setShowEscrowStatus] = useState(false);

  // ── New: file preview modal for checklist/evidence ──
  const [previewModal, setPreviewModal] = useState<{ open: boolean; url: string; label: string }>({ open: false, url: '', label: '' });

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`
        *,
        listing:listings(title),
        buyer:users!orders_buyer_id_fkey(company_name, country, email, full_name),
        exporter:users!orders_exporter_id_fkey(company_name, email, full_name)
      `, { count: 'exact' })
      .not('order_status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Order status filter
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'negotiating') query = query.eq('order_status', 'enquiring');
      else if (orderStatusFilter === 'in_escrow') query = query.in('escrow_status', ['funded','confirmed','held']);
      else if (orderStatusFilter === 'shipping') query = query.eq('order_status', 'goods_shipped');
      else if (orderStatusFilter === 'delivered') query = query.eq('order_status', 'delivered');
      else if (orderStatusFilter === 'disputed') query = query.eq('order_status', 'disputed');
      else query = query.eq('order_status', orderStatusFilter);
    }

    // Escrow filter
    if (escrowFilter !== 'all') {
      query = query.eq('escrow_status', escrowFilter);
    }

    // Server-side search
    if (searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(
        `id.ilike.${term}, tracking_number.ilike.${term}, payment_reference.ilike.${term}, buyer.company_name.ilike.${term}, buyer.full_name.ilike.${term}, exporter.company_name.ilike.${term}, exporter.full_name.ilike.${term}`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('Failed to fetch deals:', error);
      toast.error('Could not load deals');
    } else {
      setDeals(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [orderStatusFilter, escrowFilter, searchTerm, page, pageSize]);

  useEffect(() => {
    fetchDeals();
    const sub = supabase.channel('orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDeals)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchDeals]);

  // ── Drawer functions ──
  const openDealDrawer = async (order: any) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      // Fetch checklist
      const { data: checklist } = await supabase
        .from('deal_checklist')
        .select('*')
        .eq('order_id', order.id);
      setChecklistItems(checklist || []);

      // Fetch dispute if exists
      if (order.dispute_raised) {
        const { data: dispute } = await supabase
          .from('disputes')
          .select('*')
          .eq('order_id', order.id)
          .maybeSingle();
        setDisputeInfo(dispute);
      } else {
        setDisputeInfo(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
    await fetchMessages(order.id);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
    setMessages([]);
    setEscrowStatusData(null);
    setChecklistItems([]);
    setDisputeInfo(null);
  };

  const fetchMessages = async (orderId: string) => {
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Could not load messages');
    } else {
      setMessages(data || []);
    }
    setMessagesLoading(false);
  };

  // ── Admin chat sender (now uses sender_type='admin') ──────────────────────
  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedOrder || sending) return;
    // Prevent sending if order is closed (completed/refunded/cancelled)
    if (['completed','refunded','cancelled'].includes(selectedOrder.order_status)) {
      toast.error('This deal is closed. No further messages allowed.');
      return;
    }
    const content = chatInput.trim();
    setChatInput('');
    setSending(true);

    const session = (await supabase.auth.getSession()).data.session;
    const adminId = session?.user?.id;
    if (!adminId) {
      toast.error('You are not signed in');
      setSending(false);
      return;
    }

    const tempId = 'temp-' + Date.now();
    const newMsg = {
      id: tempId,
      order_id: selectedOrder.id,
      sender_type: 'admin',
      sender_id: adminId,
      content,
      is_ai: false,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          order_id: selectedOrder.id,
          sender_type: 'admin',
          sender_id: adminId,
          content,
          is_ai: false,
          is_system: false,
        });

      if (error) throw error;

      toast.success('Message sent');

      await logAuditEvent({
        adminId,
        action: 'admin_sent_message',
        targetType: 'order',
        targetId: selectedOrder.id,
        details: content.slice(0, 100),
      });

      await fetchMessages(selectedOrder.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedOrder) return;
    const channel = supabase.channel(`messages-${selectedOrder.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${selectedOrder.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as any]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedOrder]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── Escrow Tools ─────────────────────────────────────────────────────────────
  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const callPandascrow = async (endpoint: string, method: 'GET' | 'POST', body?: any) => {
    const token = await getAccessToken();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pandascrow-escrow/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error || `Request failed: ${response.status}`);
    return result;
  };

  const refreshEscrow = async (order: any) => {
    if (!order.pandascrow_escrow_id) { toast.error('No escrow ID'); return; }
    setEscrowToolLoading('refresh');
    try {
      const result = await callPandascrow('escrow', 'GET', { uuid: order.pandascrow_escrow_id });
      setEscrowStatusData(result);
      toast.success('Escrow status refreshed');
      await logAuditEvent({ adminId, action: 'refresh_escrow', targetType: 'order', targetId: order.id });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEscrowToolLoading(null);
    }
  };

  const releaseEscrow = async (order: any) => {
    if (!order.pandascrow_escrow_id) { toast.error('No escrow ID'); return; }
    if (!confirm(`Release escrow for order ${order.id.slice(0,8)}?`)) return;
    setEscrowToolLoading('release');
    try {
      await callPandascrow('release', 'POST', { orderId: order.id });
      await supabase.from('orders').update({ escrow_status: 'released', order_status: 'completed' }).eq('id', order.id);
      toast.success('Escrow released');
      await logAuditEvent({ adminId, action: 'release_escrow', targetType: 'order', targetId: order.id });
      fetchDeals();
      // Refresh drawer data
      if (selectedOrder) openDealDrawer(selectedOrder);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEscrowToolLoading(null);
    }
  };

  const freezeEscrow = async (order: any) => {
    if (!order.pandascrow_escrow_id) { toast.error('No escrow ID'); return; }
    if (!confirm(`Freeze escrow for order ${order.id.slice(0,8)}? This will raise a dispute.`)) return;
    setEscrowToolLoading('freeze');
    try {
      await callPandascrow('dispute', 'POST', { orderId: order.id, reason: 'Admin freeze' });
      await supabase.from('orders').update({ escrow_status: 'frozen', order_status: 'disputed', dispute_raised: true }).eq('id', order.id);
      // NEW: ensure a `disputes` row exists (upsert on order_id) so evidence/resolution tooling works.
      await supabase.from('disputes').upsert(
        { order_id: order.id, status: 'open', reason: 'Admin freeze', raised_by: adminId },
        { onConflict: 'order_id', ignoreDuplicates: false }
      );
      toast.success('Escrow frozen (dispute raised)');
      await logAuditEvent({ adminId, action: 'freeze_escrow', targetType: 'order', targetId: order.id });
      fetchDeals();
      if (selectedOrder) openDealDrawer(selectedOrder);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEscrowToolLoading(null);
    }
  };

  const resendOtp = async (order: any) => {
    if (!order.pandascrow_escrow_id) { toast.error('No escrow ID'); return; }
    setEscrowToolLoading('otp');
    try {
      await callPandascrow('resend-otp', 'POST', { uuid: order.pandascrow_escrow_id, orderId: order.id });
      toast.success('OTP resent');
      await logAuditEvent({ adminId, action: 'resend_otp', targetType: 'order', targetId: order.id });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEscrowToolLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    safeCopy(text, label);
  };

  const dealAge = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // ── Dispute resolution handlers ──────────────────────────────────────────
  // NEW: post a system/admin chat message explaining a dispute decision, then lock chat
  // happens implicitly once order_status moves to completed/refunded/cancelled.
  const postDisputeResolutionMessage = async (orderId: string, content: string) => {
    await supabase.from('messages').insert({
      order_id: orderId,
      sender_type: 'admin',
      sender_id: adminId,
      content,
      is_ai: false,
      is_system: false,
    });
  };

  const handleReleaseToExporter = async () => {
    if (!selectedOrder) return;
    if (!confirm(`Release escrow to exporter for order ${selectedOrder.id.slice(0,8)}? This will close the dispute.`)) return;
    try {
      // Call PandaScrow release — never touch Supabase before this succeeds.
      await callPandascrow('release', 'POST', { orderId: selectedOrder.id });
      // Update order
      await supabase.from('orders').update({
        escrow_status: 'released',
        order_status: 'completed',
        dispute_raised: false,
      }).eq('id', selectedOrder.id);
      // Update dispute
      if (disputeInfo) {
        await supabase.from('disputes').update({
          status: 'resolved',
          admin_decision: 'release_to_exporter',
          resolved_by: adminId,
          resolved_at: new Date().toISOString(),
        }).eq('id', disputeInfo.id);
      }
      await postDisputeResolutionMessage(
        selectedOrder.id,
        '✅ Dispute resolved by IziXport Support: escrow has been released to the exporter. This deal is now closed.'
      );
      toast.success('Dispute resolved – funds released to exporter.');
      await logAuditEvent({ adminId, action: 'dispute_release', targetType: 'order', targetId: selectedOrder.id });
      fetchDeals();
      closeDrawer();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve dispute');
    }
  };

  const handleRefundBuyer = async () => {
    if (!selectedOrder) return;
    if (!confirm(`Refund buyer for order ${selectedOrder.id.slice(0,8)}? This will close the dispute and refund the buyer.`)) return;
    try {
      // Call PandaScrow refund — do NOT update Supabase unless this succeeds.
      await callPandascrow('refund', 'POST', { orderId: selectedOrder.id });
      await supabase.from('orders').update({
        escrow_status: 'refunded',
        order_status: 'refunded',
        dispute_raised: false,
      }).eq('id', selectedOrder.id);
      if (disputeInfo) {
        await supabase.from('disputes').update({
          status: 'resolved',
          admin_decision: 'full_refund_buyer',
          resolved_by: adminId,
          resolved_at: new Date().toISOString(),
        }).eq('id', disputeInfo.id);
      }
      await postDisputeResolutionMessage(
        selectedOrder.id,
        '✅ Dispute resolved by IziXport Support: the buyer has been refunded in full. This deal is now closed.'
      );
      toast.success('Dispute resolved – buyer refunded.');
      await logAuditEvent({ adminId, action: 'dispute_refund', targetType: 'order', targetId: selectedOrder.id });
      fetchDeals();
      closeDrawer();
    } catch (err: any) {
      toast.error(err.message || 'Refund failed — order was not updated. Please retry or check the escrow provider.');
    }
  };

  // NEW: Part of dispute resolution toolkit — placeholder only (full partial-split flow already
  // lives in the dedicated Disputes tab / DisputesPage's Partial Resolution modal).
  const handlePartialSettlementPlaceholder = () => {
    toast('Partial settlement isn\'t available from this drawer yet — use the Disputes tab for a full partial-split resolution.', { icon: 'ℹ️' });
  };

  // NEW: ask both parties for more evidence without changing order/dispute state.
  const handleRequestMoreEvidence = async () => {
    if (!selectedOrder) return;
    try {
      await postDisputeResolutionMessage(
        selectedOrder.id,
        '📎 IziXport Support has requested additional evidence from both parties to help resolve this dispute. Please upload any relevant documents or photos.'
      );
      await logAuditEvent({ adminId, action: 'dispute_request_evidence', targetType: 'order', targetId: selectedOrder.id });
      toast.success('Requested more evidence — message posted to the deal chat.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    }
  };

  // ── File preview helper ──
  const openPreview = (url: string, label: string) => {
    if (!url) return;
    setPreviewModal({ open: true, url, label });
  };

  const FILTERS: { key: DealFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'negotiating', label: 'Negotiating' },
    { key: 'in_escrow', label: 'In Escrow' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'disputed', label: 'Disputed' },
  ];

  const ESCROW_FILTERS: { key: EscrowFilter; label: string }[] = [
    { key: 'all', label: 'All Escrow' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'released', label: 'Released' },
    { key: 'refunded', label: 'Refunded' },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    enquiring: { bg: '#EFF6FF', text: '#2563EB' },
    freight_quoted: { bg: '#F5F3FF', text: '#7C3AED' },
    freight_approved: { bg: '#ECFDF5', text: '#059669' },
    escrow_funded: { bg: '#FEF9EC', text: '#C8991A' },
    docs_in_progress: { bg: '#FEF9EC', text: '#C8991A' },
    goods_shipped: { bg: '#F0F9FF', text: '#0369A1' },
    in_transit: { bg: '#F0F9FF', text: '#0369A1' },
    arrived: { bg: '#F0FDF4', text: '#16A34A' },
    delivered: { bg: '#F0FDF4', text: '#16A34A' },
    disputed: { bg: '#FEF2F2', text: '#DC2626' },
  };

  const formatStatus = (status: string) => {
    if (status === 'disputed') return '⚠️ Disputed';
    return status.replace(/_/g, ' ');
  };

  const escrowColor: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    released: '#3B82F6',
    refunded: '#6B7280',
  };

  return (
    <div>
      <PageHeader title="Active Deals" subtitle="All in-progress trades on the platform" />

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by Buyer, Exporter, Order ID, Tracking, Payment Ref…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ border: '1.5px solid #E5E7EB' }}
          onFocus={(e) => (e.currentTarget.style.border = `1.5px solid ${C.green}`)}
          onBlur={(e) => (e.currentTarget.style.border = '1.5px solid #E5E7EB')}
        />
      </div>

      {/* Filters: Order Status */}
      <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setOrderStatusFilter(f.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold capitalize transition whitespace-nowrap"
            style={{
              background: orderStatusFilter === f.key ? C.darkGreen : '#fff',
              color: orderStatusFilter === f.key ? '#fff' : '#6B7280',
              border: orderStatusFilter === f.key ? 'none' : '1px solid #E5E7EB',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filters: Escrow Status */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
        {ESCROW_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setEscrowFilter(f.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap"
            style={{
              background: escrowFilter === f.key ? C.gold : '#fff',
              color: escrowFilter === f.key ? '#fff' : '#6B7280',
              border: escrowFilter === f.key ? 'none' : '1px solid #E5E7EB',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Handshake size={40} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="font-bold" style={{ color: '#9CA3AF' }}>No {orderStatusFilter !== 'all' || escrowFilter !== 'all' ? 'matching ' : ''}deals found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredDeals.map(deal => {
              const sc = statusColors[deal.order_status] || { bg: '#F3F4F6', text: '#6B7280' };
              return (
                <div
                  key={deal.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs" style={{ color: '#9CA3AF' }}>
                      #{deal.id.slice(0, 8)}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {formatStatus(deal.order_status)}
                    </span>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: C.darkGreen }}>
                    {deal.listing?.title || '—'}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                        {deal.exporter?.company_name || '—'} → {deal.buyer?.company_name || '—'}
                      </p>
                      <p className="text-xs" style={{ color: C.gold, fontWeight: 700 }}>
                        ${Number(deal.total_amount || 0).toLocaleString()}
                      </p>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: '#F3F4F6', color: escrowColor[deal.escrow_status] || '#6B7280' }}
                      >
                        Escrow: {deal.escrow_status}
                      </span>
                    </div>
                    <button
                      onClick={() => openDealDrawer(deal)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-2"
                      style={{ background: C.green, color: '#fff' }}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full text-sm">
                <thead>
                  <tr style={{ background: C.cream }}>
                    {['Order ID', 'Exporter → Buyer', 'Product', 'Value', 'Freight', 'Escrow Value', 'Status', 'Escrow Status', 'Tracking', 'Age', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6B7280' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDeals.map(deal => {
                    const sc = statusColors[deal.order_status] || { bg: '#F3F4F6', text: '#6B7280' };
                    const age = dealAge(deal.created_at);
                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-gray-50/50 transition"
                        style={{ borderLeft: deal.order_status === 'disputed' ? '3px solid #FCA5A5' : undefined }}
                      >
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                          #{deal.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-xs" style={{ color: C.darkGreen }}>
                            {deal.exporter?.company_name || '—'}
                          </p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>
                            → {deal.buyer?.company_name || '—'} {deal.buyer?.country ? `· ${deal.buyer.country}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#374151' }}>
                          {deal.listing?.title || '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-sm whitespace-nowrap" style={{ color: C.gold }}>
                          ${Number(deal.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#374151' }}>
                          {deal.freight_cost ? `${deal.currency} ${Number(deal.freight_cost).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-sm whitespace-nowrap" style={{ color: C.gold }}>
                          ${(Number(deal.total_amount || 0) + Number(deal.freight_cost || 0)).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {formatStatus(deal.order_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: '#F3F4F6', color: escrowColor[deal.escrow_status] || '#6B7280' }}
                          >
                            {deal.escrow_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                          {deal.tracking_number || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                          {age} day{age !== 1 ? 's' : ''}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openDealDrawer(deal)}
                            className="text-xs font-semibold flex items-center gap-1"
                            style={{ color: C.green }}
                          >
                            View <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Next
          </button>
        </div>
      )}

      {/* ── Admin Deal Drawer ── */}
      {drawerOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex justify-end"
          onClick={closeDrawer}
        >
          <div
            className="bg-white w-full max-w-2xl h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-black text-lg" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
                Deal #{selectedOrder.id.slice(0, 8)}
              </h3>
              <button onClick={closeDrawer} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} style={{ color: '#9CA3AF' }} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => copyToClipboard(selectedOrder.id, 'Order ID')}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#C8991A] transition"
              >
                <Copy size={13} /> Copy Order ID
              </button>
              {selectedOrder.pandascrow_escrow_id && (
                <button
                  onClick={() => copyToClipboard(selectedOrder.pandascrow_escrow_id, 'Escrow ID')}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#C8991A] transition"
                >
                  <Copy size={13} /> Copy Escrow ID
                </button>
              )}
              <button
                onClick={() => navigate(`/deal/${selectedOrder.id}`)}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#C8991A] text-white border border-[#C8991A] hover:bg-[#B0870E] transition"
              >
                <ExternalLink size={13} /> Open Deal Room
              </button>
            </div>

            {/* Deal Details */}
            <div className="px-6 py-4 border-b border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Buyer</span>
                  <p className="font-semibold" style={{ color: C.darkGreen }}>{selectedOrder.buyer?.company_name || selectedOrder.buyer?.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.buyer?.email}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Exporter</span>
                  <p className="font-semibold" style={{ color: C.darkGreen }}>{selectedOrder.exporter?.company_name || selectedOrder.exporter?.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.exporter?.email}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Listing</span>
                  <p className="text-sm">{selectedOrder.listing?.title || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Quantity</span>
                  <p className="text-sm">{selectedOrder.quantity || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Goods Value</span>
                  <p className="text-sm font-bold" style={{ color: C.gold }}>
                    {selectedOrder.currency || 'USD'} {Number(selectedOrder.total_amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Freight</span>
                  <p className="text-sm">{selectedOrder.freight_cost ? `${selectedOrder.currency || 'USD'} ${Number(selectedOrder.freight_cost).toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Escrow Value</span>
                  <p className="text-sm font-bold" style={{ color: C.gold }}>
                    {selectedOrder.currency || 'USD'} {(Number(selectedOrder.total_amount || 0) + Number(selectedOrder.freight_cost || 0)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Escrow Status</span>
                  <span
                    className="text-sm font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#F3F4F6', color: escrowColor[selectedOrder.escrow_status] || '#6B7280' }}
                  >
                    {selectedOrder.escrow_status}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Status</span>
                  <span className="text-sm font-semibold">{formatStatus(selectedOrder.order_status)}</span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Shipment Status</span>
                  <p className="text-sm">{selectedOrder.shipment_status || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tracking Number</span>
                  <p className="text-sm font-mono">{selectedOrder.tracking_number || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">PandaScrow Escrow ID</span>
                  <p className="text-sm font-mono">{selectedOrder.pandascrow_escrow_id || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Transaction Ref</span>
                  <p className="text-sm font-mono">{selectedOrder.pandascrow_transaction_ref || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Deal Age</span>
                  <p className="text-sm">{dealAge(selectedOrder.created_at)} days</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Created</span>
                  <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Last Updated</span>
                  <p className="text-sm">{new Date(selectedOrder.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* ── Checklist Documents ── */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: C.darkGreen }}>
                <FileText size={14} /> Checklist Documents
              </h4>
              {drawerLoading ? (
                <div className="text-xs text-gray-400">Loading...</div>
              ) : checklistItems.length === 0 ? (
                <div className="text-xs text-gray-400">No checklist items yet.</div>
              ) : (
                <div className="space-y-2 mt-2">
                  {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-xs font-medium">{item.step_label}</span>
                        {item.completed && <span className="text-xs text-green-600 ml-2">✅</span>}
                        {item.reference_number && (
                          <div className="text-xs text-gray-500">Tracking: {item.reference_number}</div>
                        )}
                        {item.carrier_name && (
                          <div className="text-xs text-gray-500">Carrier: {item.carrier_name}</div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {getDocumentUrls(item).map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => openPreview(url, item.step_label)}
                            className="text-xs text-blue-600 underline"
                          >
                            View {idx+1}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Dispute Evidence (buyer + exporter) ── */}
            {disputeInfo && (
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: C.darkGreen }}>
                  <AlertTriangle size={14} /> Dispute Evidence
                </h4>
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Buyer</p>
                  {disputeInfo.buyer_evidence_urls && disputeInfo.buyer_evidence_urls.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {disputeInfo.buyer_evidence_urls.map((url: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => openPreview(url, `Buyer Evidence ${idx+1}`)}
                          className="text-xs text-blue-600 underline"
                        >
                          Evidence {idx+1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">No buyer evidence uploaded.</div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Exporter</p>
                  {disputeInfo.exporter_evidence_urls && disputeInfo.exporter_evidence_urls.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {disputeInfo.exporter_evidence_urls.map((url: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => openPreview(url, `Exporter Evidence ${idx+1}`)}
                          className="text-xs text-blue-600 underline"
                        >
                          Evidence {idx+1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">No exporter evidence uploaded.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Dispute Resolution Buttons ── */}
            {disputeInfo && disputeInfo.status === 'open' && (
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: C.darkGreen }}>
                  <Lock size={14} /> Resolve Dispute
                </h4>
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={handleReleaseToExporter}
                    className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700"
                    style={{ minWidth: 140 }}
                  >
                    Release to Exporter
                  </button>
                  <button
                    onClick={handleRefundBuyer}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700"
                    style={{ minWidth: 140 }}
                  >
                    Refund Buyer
                  </button>
                  <button
                    onClick={handlePartialSettlementPlaceholder}
                    className="flex-1 py-2 rounded-lg text-sm font-bold border hover:bg-gray-50"
                    style={{ minWidth: 140, border: `1.5px solid ${C.gold}`, color: C.gold }}
                  >
                    Partial Settlement
                  </button>
                  <button
                    onClick={handleRequestMoreEvidence}
                    className="flex-1 py-2 rounded-lg text-sm font-bold border hover:bg-gray-50"
                    style={{ minWidth: 140, border: '1.5px solid #9CA3AF', color: '#374151' }}
                  >
                    Request More Evidence
                  </button>
                </div>
              </div>
            )}

            {/* ── Audit Timeline (built from existing order/checklist/dispute data) ── */}
            <DealAuditTimeline order={selectedOrder} checklistItems={checklistItems} disputeInfo={disputeInfo} messages={messages} />

            {/* ── Escrow Tools ── */}
            {selectedOrder.pandascrow_escrow_id && (
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: C.darkGreen }}>
                  <Lock size={14} /> Escrow Tools
                </h4>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => refreshEscrow(selectedOrder)}
                    disabled={escrowToolLoading === 'refresh'}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:border-[#C8991A] transition disabled:opacity-50"
                  >
                    {escrowToolLoading === 'refresh' ? <RefreshCw size={13} className="animate-spin" /> : <RotateCw size={13} />} Refresh
                  </button>
                  <button
                    onClick={() => { setShowEscrowStatus(true); refreshEscrow(selectedOrder); }}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:border-[#C8991A] transition"
                  >
                    <Eye size={13} /> View Status
                  </button>
                  <button
                    onClick={() => releaseEscrow(selectedOrder)}
                    disabled={escrowToolLoading === 'release'}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition disabled:opacity-50"
                  >
                    {escrowToolLoading === 'release' ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Release
                  </button>
                  <button
                    onClick={() => freezeEscrow(selectedOrder)}
                    disabled={escrowToolLoading === 'freeze'}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {escrowToolLoading === 'freeze' ? <RefreshCw size={13} className="animate-spin" /> : <Lock size={13} />} Freeze
                  </button>
                  <button
                    onClick={() => resendOtp(selectedOrder)}
                    disabled={escrowToolLoading === 'otp'}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition disabled:opacity-50"
                  >
                    {escrowToolLoading === 'otp' ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />} Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* Chat Section */}
            <div className="px-6 py-4 flex flex-col h-[calc(100vh-400px)] min-h-[300px]">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} style={{ color: C.gold }} />
                <span className="font-bold text-sm" style={{ color: C.darkGreen }}>Conversation</span>
                <span className="text-xs text-gray-400 ml-auto">{messages.length} messages</span>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No messages yet</div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_type === 'admin';
                      const isBuyer = msg.sender_type === 'buyer';
                      const isExporter = msg.sender_type === 'exporter';
                      const isAI = msg.sender_type === 'ai';

                      let bgColor = '#F3F4F6';
                      let textColor = '#374151';
                      let label = '';

                      if (isAdmin) {
                        bgColor = '#FEF3C7';
                        textColor = '#92400E';
                        label = '🛡 IziXport Support';
                      } else if (isBuyer) {
                        bgColor = '#E6F2ED';
                        textColor = C.darkGreen;
                        label = 'Buyer';
                      } else if (isExporter) {
                        bgColor = '#EFF6FF';
                        textColor = '#1E40AF';
                        label = 'Exporter';
                      } else if (isAI) {
                        bgColor = '#F5F3FF';
                        textColor = '#5B21B6';
                        label = 'AI';
                      } else {
                        // system
                        bgColor = '#FEF9EC';
                        textColor = C.darkGreen;
                        label = 'System';
                      }

                      return (
                        <div key={msg.id} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold" style={{ color: textColor }}>{label}</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                          </div>
                          <div
                            className="rounded-xl px-3 py-2 text-sm max-w-[80%]"
                            style={{ background: bgColor, color: textColor }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input – only if order not closed */}
              {!isOrderClosed(selectedOrder.order_status) && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message as IziXport Support…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                    className="flex-1 px-4 py-2 rounded-xl border text-sm outline-none"
                    style={{ border: '1.5px solid #E5E7EB' }}
                    onFocus={(e) => (e.currentTarget.style.border = `1.5px solid ${C.gold}`)}
                    onBlur={(e) => (e.currentTarget.style.border = '1.5px solid #E5E7EB')}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || sending}
                    className="px-4 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                    style={{ background: C.gold }}
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              )}
              {isOrderClosed(selectedOrder.order_status) && (
                <div className="text-xs text-gray-400 mt-2 text-center">Deal is closed – no new messages.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── File Preview Modal ── */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>{previewModal.label}</h3>
              <div className="flex items-center gap-2">
                <a href={previewModal.url} target="_blank" rel="noreferrer" download className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
                  <Download size={12} /> Download
                </a>
                <button onClick={() => setPreviewModal({ open: false, url: '', label: '' })} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
              {previewModal.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewModal.url} className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200" title={previewModal.label} />
              ) : (
                <img src={previewModal.url} alt={previewModal.label} className="max-w-full max-h-[70vh] rounded-lg shadow-lg border border-gray-200" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Escrow Status Modal */}
      {showEscrowStatus && escrowStatusData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>Escrow Status</h4>
              <button onClick={() => setShowEscrowStatus(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} style={{ color: '#9CA3AF' }} />
              </button>
            </div>
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-[60vh] overflow-auto">
              {JSON.stringify(escrowStatusData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 4: DISPUTES — Integrated with PandaScrow release/freeze/refund
// ════════════════════════════════════════════════════════
function DisputesPage({ adminId }: { adminId: string }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [partialModal, setPartialModal] = useState<{ open: boolean; dispute: any | null }>({ open: false, dispute: null });
  const [refundAmount, setRefundAmount] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(
          id, total_amount, shipping_amount, currency, escrow_status,
          buyer:users!orders_buyer_id_fkey(company_name, country, email),
          exporter:users!orders_exporter_id_fkey(company_name, email),
          listing:listings(title)
        )
      `, { count: 'exact' })
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    setDisputes(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, [page, pageSize]);

  useEffect(() => {
    const sub = supabase.channel('disputes-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, fetchDisputes)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const notifyParties = async (dispute: any, decision: string) => {
    const msgs = {
      release_to_exporter: { buyer: 'Dispute resolved: funds released to exporter. Contact us if you have questions.', exporter: 'Dispute resolved in your favour. Escrow has been released.' },
      full_refund_buyer: { buyer: 'Dispute resolved: you will receive a full refund within 3-5 business days.', exporter: 'Dispute resolved in favour of the buyer. Escrow has been refunded.' },
      partial_resolution: { buyer: 'Dispute partially resolved. A partial refund will be processed.', exporter: 'Dispute partially resolved. Partial payment has been released.' },
    };
    const msg = msgs[decision as keyof typeof msgs];
    if (!msg) return;

    await Promise.all([
      supabase.from('notifications').insert({ user_id: dispute.order?.buyer?.id, title: 'Dispute Resolved', message: msg.buyer, type: 'dispute' }),
      supabase.from('notifications').insert({ user_id: dispute.order?.exporter?.id, title: 'Dispute Resolved', message: msg.exporter, type: 'dispute' }),
    ]);
  };

  const callPandascrow = async (endpoint: string, method: 'GET' | 'POST', body?: any) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pandascrow-escrow/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error || `Request failed: ${response.status}`);
    return result;
  };

  const handleRelease = async (dispute: any) => {
    setActionLoading(dispute.id);
    try {
      await callPandascrow('release', 'POST', { orderId: dispute.order_id });
      await supabase.from('orders').update({ escrow_status: 'released', order_status: 'completed' }).eq('id', dispute.order_id);
      await supabase.from('disputes').update({ status: 'resolved', admin_decision: 'release_to_exporter', resolved_by: adminId, resolved_at: new Date().toISOString() }).eq('id', dispute.id);
      await notifyParties(dispute, 'release_to_exporter');
      await logAuditEvent({ adminId, action: 'dispute_release', targetType: 'order', targetId: dispute.order_id, details: 'Released to exporter' });
      toast.success('Funds released to exporter');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (dispute: any) => {
    setActionLoading(dispute.id);
    try {
      // Never update Supabase unless PandaScrow actually confirms the refund.
      await callPandascrow('refund', 'POST', { orderId: dispute.order_id });
      await supabase.from('orders').update({ escrow_status: 'refunded', order_status: 'refunded' }).eq('id', dispute.order_id);
      await supabase.from('disputes').update({ status: 'resolved', admin_decision: 'full_refund_buyer', resolved_by: adminId, resolved_at: new Date().toISOString() }).eq('id', dispute.id);
      await notifyParties(dispute, 'full_refund_buyer');
      await logAuditEvent({ adminId, action: 'dispute_refund', targetType: 'order', targetId: dispute.order_id, details: 'Full refund to buyer' });
      toast.success('Full refund issued to buyer');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Refund failed — order was not updated. Please retry or check the escrow provider.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePartial = async () => {
    const dispute = partialModal.dispute;
    if (!dispute || !refundAmount) return;
    const total = Number(dispute.order?.total_amount || 0) + Number(dispute.order?.shipping_amount || 0);
    const refund = Number(refundAmount);
    if (isNaN(refund) || refund <= 0 || refund >= total) {
      toast.error('Enter a valid refund amount less than total');
      return;
    }
    const release = total - refund;
    setActionLoading(dispute.id);
    try {
      // Never update Supabase unless PandaScrow actually confirms the split.
      await callPandascrow('partial', 'POST', { orderId: dispute.order_id, refund, release });
      await supabase.from('orders').update({ escrow_status: 'partial', order_status: 'completed' }).eq('id', dispute.order_id);
      await supabase.from('disputes').update({
        status: 'resolved',
        admin_decision: 'partial_resolution',
        refund_amount: refund,
        release_amount: release,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
      }).eq('id', dispute.id);
      await notifyParties(dispute, 'partial_resolution');
      await logAuditEvent({ adminId, action: 'dispute_partial', targetType: 'order', targetId: dispute.order_id, details: `Partial: refund ${refund}, release ${release}` });
      toast.success(`Partial: $${refund} refunded, $${release} released`);
      setPartialModal({ open: false, dispute: null });
      setRefundAmount('');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Partial settlement failed — order was not updated. Please retry or check the escrow provider.');
    } finally {
      setActionLoading(null);
    }
  };

  const daysOpen = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Resolve buyer-exporter trade disputes" />

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: C.green }} />
          <p className="font-bold text-lg" style={{ color: C.darkGreen }}>No active disputes. Platform is healthy! ✅</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => {
            const days = daysOpen(d.created_at);
            const total = Number(d.order?.total_amount || 0) + Number(d.order?.shipping_amount || 0);
            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border overflow-hidden"
                style={{ border: days > 3 ? '2px solid #FCA5A5' : '1px solid #E5E7EB' }}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs" style={{ color: '#9CA3AF' }}>
                          #{d.order_id?.slice(0, 8)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          DISPUTED
                        </span>
                        {days > 3 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                            ⚠️ {days} days old
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base" style={{ color: C.darkGreen }}>
                        {d.order?.listing?.title || 'Trade Dispute'}
                      </p>
                    </div>
                    <p className="text-xl font-black shrink-0 ml-2" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.gold }}>
                      ${total.toLocaleString()}
                    </p>
                  </div>

                  {/* Parties */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Buyer</p>
                      <p className="text-sm font-semibold" style={{ color: '#374151' }}>{d.order?.buyer?.company_name}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{d.order?.buyer?.country} · {d.order?.buyer?.email}</p>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Exporter</p>
                      <p className="text-sm font-semibold" style={{ color: '#374151' }}>{d.order?.exporter?.company_name}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{d.order?.exporter?.email}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="p-3 rounded-xl mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Dispute Reason</p>
                    <p className="text-sm font-semibold text-red-700">{d.reason}</p>
                    {d.description && (
                      <p className="text-xs mt-1 text-red-600">{d.description.slice(0, 200)}{d.description.length > 200 ? '…' : ''}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleRelease(d)}
                      disabled={actionLoading === d.id}
                      className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition"
                      style={{ background: C.green, minWidth: '120px' }}
                    >
                      {actionLoading === d.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={14} /> Release to Exporter</>}
                    </button>
                    <button
                      onClick={() => handleRefund(d)}
                      disabled={actionLoading === d.id}
                      className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition"
                      style={{ border: '1.5px solid #DC2626', color: '#DC2626', minWidth: '120px' }}
                    >
                      <XCircle size={14} /> Refund Buyer
                    </button>
                    <button
                      onClick={() => setPartialModal({ open: true, dispute: d })}
                      disabled={actionLoading === d.id}
                      className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition"
                      style={{ border: `1.5px solid ${C.gold}`, color: C.gold, minWidth: '120px' }}
                    >
                      <DollarSign size={14} /> Partial Resolution
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Partial Modal */}
      {partialModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
                Partial Resolution
              </h3>
              <button onClick={() => setPartialModal({ open: false, dispute: null })}>
                <X size={18} style={{ color: '#9CA3AF' }} />
              </button>
            </div>
            <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
              Total escrow: <strong>${Number(partialModal.dispute?.order?.total_amount || 0).toLocaleString()}</strong>
            </p>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: '#374151' }}>
                Refund Buyer ($)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ border: '1.5px solid #E5E7EB' }}
                onFocus={e => (e.currentTarget.style.border = `1.5px solid ${C.gold}`)}
                onBlur={e => (e.currentTarget.style.border = '1.5px solid #E5E7EB')}
              />
              {refundAmount && Number(refundAmount) > 0 && (
                <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                  Release to exporter:{' '}
                  <strong>${Math.max(0, Number(partialModal.dispute?.order?.total_amount || 0) - Number(refundAmount)).toLocaleString()}</strong>
                </p>
              )}
            </div>
            <button
              onClick={handlePartial}
              disabled={!refundAmount || actionLoading === partialModal.dispute?.id}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: C.gold }}
            >
              {actionLoading === partialModal.dispute?.id ? 'Processing…' : 'Confirm Split'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 5: USERS — Server-side pagination & search
// ════════════════════════════════════════════════════════
function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'exporters' | 'buyers' | 'suspended'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // === FIXED: Added filteredUsers definition ===
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.trim().toLowerCase();
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(term) ||
      u.company_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [users, search]);
  // ===========================================

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .not('role', 'eq', 'admin')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (filter === 'exporters') query = query.eq('role', 'exporter');
    else if (filter === 'buyers') query = query.eq('role', 'buyer');
    else if (filter === 'suspended') query = query.eq('account_status', 'suspended');

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term}, company_name.ilike.${term}, email.ilike.${term}`);
    }

    const { data, count } = await query;
    setUsers(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [filter, search, page, pageSize]);

  const toggleSuspend = async (user: any) => {
    const isSuspended = user.account_status === 'suspended';
    setActionLoading(user.id);
    try {
      await supabase.from('users').update({
        account_status: isSuspended ? 'active' : 'suspended',
      }).eq('id', user.id);
      toast.success(isSuspended ? 'Account reinstated' : 'Account suspended');
      const adminId = (await supabase.auth.getSession()).data.session?.user?.id || '';
      await logAuditEvent({ adminId, action: isSuspended ? 'reinstate_user' : 'suspend_user', targetType: 'user', targetId: user.id });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage all platform users" />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ border: '1.5px solid #E5E7EB' }}
            onFocus={e => (e.currentTarget.style.border = `1.5px solid ${C.green}`)}
            onBlur={e => (e.currentTarget.style.border = '1.5px solid #E5E7EB')}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'exporters', 'buyers', 'suspended'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-sm font-semibold capitalize transition whitespace-nowrap"
              style={{
                background: filter === f ? C.darkGreen : '#fff',
                color: filter === f ? '#fff' : '#6B7280',
                border: filter === f ? 'none' : '1px solid #E5E7EB',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Users size={40} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="font-bold" style={{ color: '#9CA3AF' }}>No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.cream }}>
                  {['User', 'Country', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6B7280' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(user => {
                  const suspended = user.account_status === 'suspended';
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/50 transition"
                      style={{
                        borderLeft: suspended ? '3px solid #FCA5A5' : undefined,
                        background: suspended ? '#FFF5F5' : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: C.darkGreen, color: C.gold }}
                          >
                            {(user.company_name || user.full_name || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm" style={{ color: C.darkGreen }}>
                              {user.company_name || user.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                        {user.country || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{
                            background: user.role === 'exporter' ? '#E6F2ED' : '#FEF9EC',
                            color: user.role === 'exporter' ? C.green : C.gold,
                          }}
                        >
                          {user.role || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.verified
                          ? <CheckCircle2 size={16} className="text-green-500" />
                          : <XCircle size={16} className="text-gray-300" />
                        }
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/profile/${user.id}`)}
                            className="text-xs font-semibold flex items-center gap-1"
                            style={{ color: C.green }}
                          >
                            View <Eye size={11} />
                          </button>
                          <button
                            onClick={() => toggleSuspend(user)}
                            disabled={actionLoading === user.id}
                            className="text-xs font-semibold px-2 py-1 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                            style={{
                              background: suspended ? '#E6F2ED' : '#FEF2F2',
                              color: suspended ? C.green : '#DC2626',
                            }}
                          >
                            {actionLoading === user.id ? '…' : suspended ? <><UserCheck size={11} className="inline" /> Reinstate</> : <><Ban size={11} className="inline" /> Suspend</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 6: NOTIFICATIONS — Server-side pagination
// ════════════════════════════════════════════════════════
function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    setNotifications(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const sub = supabase.channel('admin-notifs-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [page, pageSize]);

  const markAllRead = async () => {
    setMarkingAll(true);
    await supabase.from('admin_notifications').update({ read: true }).eq('read', false);
    await fetchNotifications();
    setMarkingAll(false);
  };

  const typeIcons: Record<string, React.ReactNode> = {
    verification: <ShieldCheck size={16} style={{ color: C.green }} />,
    dispute: <AlertTriangle size={16} className="text-red-500" />,
    order: <Handshake size={16} style={{ color: C.gold }} />,
    user: <Users size={16} style={{ color: '#6B7280' }} />,
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Notifications" subtitle={`${unreadCount} unread`} inline />
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="text-sm font-semibold disabled:opacity-50"
            style={{ color: C.gold }}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Bell size={40} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="font-bold" style={{ color: '#9CA3AF' }}>No notifications yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {notifications.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-4 px-5 py-4 transition"
              style={{ background: n.read ? '#fff' : '#FFFBF2' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: n.read ? '#F3F4F6' : '#FEF9EC' }}
              >
                {typeIcons[n.type] || <Bell size={16} style={{ color: '#9CA3AF' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: C.darkGreen }}>
                  {n.title}
                  {!n.read && (
                    <span
                      className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: C.gold, color: C.darkGreen }}
                    >
                      NEW
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{n.message}</p>
              </div>
              <span className="text-xs whitespace-nowrap shrink-0" style={{ color: C.gold }}>
                {timeAgo(n.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// NEW: Deal Audit Timeline — assembled from data already loaded for the drawer
// (order fields, checklist items, dispute record, messages). No new fetches.
// ════════════════════════════════════════════════════════
function DealAuditTimeline({ order, checklistItems, disputeInfo, messages }: {
  order: any; checklistItems: any[]; disputeInfo: any; messages: any[];
}) {
  if (!order) return null;

  type TimelineEvent = { label: string; time: string; icon: React.ReactNode };
  const events: TimelineEvent[] = [];

  if (order.created_at) {
    events.push({ label: 'Escrow Created', time: order.created_at, icon: <Lock size={12} /> });
  }
  if (order.payment_confirmed_at) {
    events.push({ label: 'Escrow Funded', time: order.payment_confirmed_at, icon: <DollarSign size={12} /> });
  }
  if (order.freight_approved_at) {
    events.push({ label: 'Freight Approved', time: order.freight_approved_at, icon: <CheckCircle2 size={12} /> });
  }
  const photosStep = checklistItems.find(c => c.step_key === 'pre_shipment_photos' && c.completed);
  if (photosStep?.completed_at) {
    events.push({ label: 'Pre-shipment Photos Uploaded', time: photosStep.completed_at, icon: <FileText size={12} /> });
  }
  const bolStep = checklistItems.find(c => c.step_key === 'bill_of_lading' && c.completed);
  if (bolStep?.completed_at) {
    events.push({ label: 'Bill of Lading Uploaded', time: bolStep.completed_at, icon: <FileText size={12} /> });
  }
  const trackingStep = checklistItems.find(c => c.step_key === 'tracking_confirmed' && c.completed);
  if (trackingStep?.completed_at) {
    events.push({ label: 'Tracking Assigned', time: trackingStep.completed_at, icon: <Send size={12} /> });
  }
  if (order.dispute_raised || disputeInfo) {
    events.push({ label: 'Buyer Raised Dispute', time: disputeInfo?.created_at || order.updated_at || order.created_at, icon: <AlertTriangle size={12} /> });
  }
  if (disputeInfo?.buyer_evidence_urls?.length || disputeInfo?.exporter_evidence_urls?.length) {
    events.push({ label: 'Evidence Uploaded', time: disputeInfo.updated_at || disputeInfo.created_at, icon: <FileText size={12} /> });
  }
  (messages || []).filter(m => m.sender_type === 'admin').forEach((m, i) => {
    events.push({ label: `Admin Message${m.content ? ': ' + m.content.slice(0, 40) + (m.content.length > 40 ? '…' : '') : ''}`, time: m.created_at, icon: <MessageCircle size={12} /> });
  });
  if (order.escrow_status === 'released') {
    events.push({ label: 'Escrow Released', time: disputeInfo?.resolved_at || order.updated_at || order.created_at, icon: <CheckCircle2 size={12} /> });
  }
  if (order.escrow_status === 'refunded') {
    events.push({ label: 'Refund Completed', time: disputeInfo?.resolved_at || order.updated_at || order.created_at, icon: <XCircle size={12} /> });
  }

  const sorted = events
    .filter(e => e.time)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  if (sorted.length === 0) return null;

  return (
    <div className="px-6 py-4 border-b border-gray-100">
      <h4 className="font-bold text-sm flex items-center gap-2 mb-3" style={{ color: C.darkGreen }}>
        <Activity size={14} /> Audit Timeline
      </h4>
      <div className="space-y-3">
        {sorted.map((e, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-gray-100" style={{ color: C.gold }}>
              {e.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: '#374151' }}>{e.label}</p>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{new Date(e.time).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SHARED HELPERS
// ════════════════════════════════════════════════════════
function PageHeader({ title, subtitle, inline = false }: { title: string; subtitle: string; inline?: boolean }) {
  if (inline) {
    return (
      <div>
        <h2 className="text-2xl font-black leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      </div>
    );
  }
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-black leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: C.darkGreen }}>
        {title}
      </h2>
      <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{subtitle}</p>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}