// src/pages/admin/AdminPanel.tsx
// ROUTE: /admin

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard, ShieldCheck, Handshake, AlertTriangle,
  Users, Bell, ChevronRight, CheckCircle2, XCircle,
  Eye, RefreshCw, Ban, UserCheck, ExternalLink,
  Clock, DollarSign, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, X, FileText, LogOut,
  Globe, Search, Download
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
          {activeTab === 'deals' && <DealsPage />}
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
// PAGE 1: OVERVIEW
// ════════════════════════════════════════════════════════
function OverviewPage({ adminId }: { adminId: string }) {
  const [stats, setStats] = useState<{
    totalExporters: number;
    totalBuyers: number;
    verifiedUsers: number;
    escrowHeld: number;
    totalOrders: number;
    pendingVerifications: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    const [
      { count: totalExporters },
      { count: totalBuyers },
      { count: verifiedUsers },
      { count: pendingVerifications },
      { data: escrowData },
      { count: totalOrders },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'exporter').neq('role', 'admin'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
      supabase.from('orders').select('total_amount').eq('escrow_status', 'held'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    const escrowHeld = (escrowData || []).reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

    setStats({
      totalExporters: totalExporters ?? 0,
      totalBuyers: totalBuyers ?? 0,
      verifiedUsers: verifiedUsers ?? 0,
      escrowHeld,
      totalOrders: totalOrders ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
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
          sub={stats ? `${Math.round(((stats.verifiedUsers) / Math.max(totalUsers, 1)) * 100)}% of total` : ''}
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
// PAGE 2: VERIFICATIONS — Fully Fixed
// ════════════════════════════════════════════════════════
function VerificationsPage({ adminId }: { adminId: string }) {
  const [tab, setTab] = useState<VerifTab>('pending');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectSheet, setRejectSheet] = useState<{ open: boolean; verification: any | null }>({ open: false, verification: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOther, setRejectOther] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    const { data, error } = await supabase
      .from('verifications')
      .select(`
        id, user_id, status, created_at, updated_at,
        cac_verified, nin_verified, cac_number, nin_number, cac_company_name, cac_company_type, cac_registration_date,
        admin_notes, reviewed_by, reviewed_at, documents_deleted,
        cac_document_url, nepc_document_url, id_document_url,
        user:users!verifications_user_id_fkey(
          id, full_name, company_name, country, role, email, created_at, verified, verification_status
        )
      `)
      .eq('status', statusMap[tab])
      .order('created_at', { ascending: tab === 'pending' });

    if (error) {
      console.error('Fetch verifications error:', error);
      toast.error('Failed to load verifications');
    }
    setVerifications(data || []);
    setLoading(false);
  }, [tab]);

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

  const deleteDocuments = async (verification: any) => {
    const userId = verification.user_id;
    try {
      const { data: files } = await supabase.storage.from('verifications').list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f: any) => `${userId}/${f.name}`);
        await supabase.storage.from('verifications').remove(paths);
      }
    } catch (err) {
      console.error('Storage deletion failed (continuing):', err);
    }

    await supabase.from('verifications').update({
      documents_deleted: true,
      documents_deleted_at: new Date().toISOString(),
      cac_document_url: null,
      nepc_document_url: null,
      id_document_url: null,
    }).eq('id', verification.id);
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
            {t}
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
// PAGE 3: ACTIVE DEALS
// ════════════════════════════════════════════════════════
function DealsPage() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DealFilter>('all');

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          listing:listings(title),
          buyer:users!orders_buyer_id_fkey(company_name, country),
          exporter:users!orders_exporter_id_fkey(company_name)
        `)
        .not('order_status', 'in', '("completed","cancelled")')
        .order('created_at', { ascending: false });
      setDeals(data || []);
      setLoading(false);
    };
    fetchDeals();

    const sub = supabase.channel('orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDeals)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const FILTERS: { key: DealFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'negotiating', label: 'Negotiating' },
    { key: 'in_escrow', label: 'In Escrow' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'disputed', label: 'Disputed' },
  ];

  const filtered = filter === 'all' ? deals : deals.filter(d => d.order_status === filter);

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

  return (
    <div>
      <PageHeader title="Active Deals" subtitle="All in-progress trades on the platform" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold capitalize transition whitespace-nowrap"
            style={{
              background: filter === f.key ? C.darkGreen : '#fff',
              color: filter === f.key ? '#fff' : '#6B7280',
              border: filter === f.key ? 'none' : '1px solid #E5E7EB',
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
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Handshake size={40} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="font-bold" style={{ color: '#9CA3AF' }}>No {filter === 'all' ? '' : filter} deals found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filtered.map(deal => {
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
                    </div>
                    <button
                      onClick={() => navigate(`/deal/${deal.id}`)}
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
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr style={{ background: C.cream }}>
                    {['Order ID', 'Exporter → Buyer', 'Product', 'Value', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6B7280' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(deal => {
                    const sc = statusColors[deal.order_status] || { bg: '#F3F4F6', text: '#6B7280' };
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {formatStatus(deal.order_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                          {new Date(deal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/deal/${deal.id}`)}
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
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 4: DISPUTES
// ════════════════════════════════════════════════════════
function DisputesPage({ adminId }: { adminId: string }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [partialModal, setPartialModal] = useState<{ open: boolean; dispute: any | null }>({ open: false, dispute: null });
  const [refundAmount, setRefundAmount] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(
          id, total_amount, currency, escrow_status,
          buyer:users!orders_buyer_id_fkey(company_name, country, email),
          exporter:users!orders_exporter_id_fkey(company_name, email),
          listing:listings(title)
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: true });
    setDisputes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
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

  const handleRelease = async (dispute: any) => {
    setActionLoading(dispute.id);
    try {
      await supabase.from('orders').update({ escrow_status: 'released', order_status: 'completed' }).eq('id', dispute.order_id);
      await supabase.from('disputes').update({ status: 'resolved', admin_decision: 'release_to_exporter', resolved_by: adminId, resolved_at: new Date().toISOString() }).eq('id', dispute.id);
      await notifyParties(dispute, 'release_to_exporter');
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
      await supabase.from('orders').update({ escrow_status: 'refunded', order_status: 'cancelled' }).eq('id', dispute.order_id);
      await supabase.from('disputes').update({ status: 'resolved', admin_decision: 'full_refund_buyer', resolved_by: adminId, resolved_at: new Date().toISOString() }).eq('id', dispute.id);
      await notifyParties(dispute, 'full_refund_buyer');
      toast.success('Full refund issued to buyer');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePartial = async () => {
    const dispute = partialModal.dispute;
    if (!dispute || !refundAmount) return;
    const total = Number(dispute.order?.total_amount || 0);
    const refund = Number(refundAmount);
    if (isNaN(refund) || refund <= 0 || refund >= total) {
      toast.error('Enter a valid refund amount less than total');
      return;
    }
    const release = total - refund;
    setActionLoading(dispute.id);
    try {
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
      toast.success(`Partial: $${refund} refunded, $${release} released`);
      setPartialModal({ open: false, dispute: null });
      setRefundAmount('');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
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
            const total = Number(d.order?.total_amount || 0);
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
// PAGE 5: USERS
// ════════════════════════════════════════════════════════
function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'exporters' | 'buyers' | 'suspended'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('*')
      .not('role', 'eq', 'admin')
      .order('created_at', { ascending: false });

    if (filter === 'exporters') query = query.eq('role', 'exporter');
    else if (filter === 'buyers') query = query.eq('role', 'buyer');
    else if (filter === 'suspended') query = query.eq('account_status', 'suspended');

    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const filteredUsers = search
    ? users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const toggleSuspend = async (user: any) => {
    const isSuspended = user.account_status === 'suspended';
    setActionLoading(user.id);
    try {
      await supabase.from('users').update({
        account_status: isSuspended ? 'active' : 'suspended',
      }).eq('id', user.id);
      toast.success(isSuspended ? 'Account reinstated' : 'Account suspended');
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
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE 6: NOTIFICATIONS
// ════════════════════════════════════════════════════════
function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const sub = supabase.channel('admin-notifs-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

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