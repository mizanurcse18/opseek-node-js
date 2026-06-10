import { useState, useEffect, useCallback } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { visitPlanService } from '../api/visit-plans.api';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  Users,
  MapPin,
  Phone,
  Clock,
  Search,
  UserCircle2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';

interface AgentSchedule {
  agent_user_id: number | null;
  agent_name: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  detail_id: number | null;
  visit_status: number | null;
  visit_note: string | null;
  visited_at: string | null;
}

interface DsrEntry {
  dsr_user_id: number;
  dsr_name: string;
  dsr_phone: string | null;
  agents: AgentSchedule[];
}

interface DealerRoadmap {
  dealer_id: number;
  dealer_name: string | null;
  date: string;
  day_of_week_name: string;
  dsrs: DsrEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Visited: '#16A34A',
  Missed: '#EF4444',
  Rejected: '#E11D48',
  Cancelled: '#6B7280',
};

const NAVY = '#1F214C';
const ROYAL_BLUE = '#1E429F';
const SLATE_BG = '#F5F7FB';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function toApiDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DateNavBar({ date, onPrev, onNext, onToday }: {
  date: Date; onPrev: () => void; onNext: () => void; onToday: () => void;
}) {
  const todayFlag = isToday(date);
  const nextIsFuture = todayFlag || date > new Date();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#fff', borderRadius: 16, padding: '6px 8px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <button onClick={onPrev} style={navBtnStyle} title="Previous day">
        <ChevronLeft size={20} />
      </button>
      <div style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={onToday}>
        <div style={{ fontWeight: 900, fontSize: 14, color: NAVY }}>{formatDate(date)}</div>
        {todayFlag && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: ROYAL_BLUE,
            background: `${ROYAL_BLUE}18`, borderRadius: 20,
            padding: '1px 8px', marginTop: 2, display: 'inline-block',
          }}>Today</span>
        )}
      </div>
      <button 
        onClick={onNext} 
        disabled={nextIsFuture}
        style={{
          ...navBtnStyle,
          color: nextIsFuture ? '#D1D5DB' : NAVY,
          cursor: nextIsFuture ? 'not-allowed' : 'pointer'
        }} 
        title="Next day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: NAVY, padding: 6, borderRadius: 10,
  transition: 'background 0.15s',
};

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  return (
    <div style={{
      flex: 1, background: '#fff', borderRadius: 14,
      border: '1px solid #E5E7EB', padding: '12px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{ color, display: 'flex' }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 20, color }}>{value}</div>
      <div style={{ fontWeight: 700, fontSize: 11, color: '#6B7280', textAlign: 'center' }}>{label}</div>
    </div>
  );
}

function AgentCard({ agent, index }: { agent: AgentSchedule; index: number }) {
  const vStatus = agent.visit_status;
  let status = 'Pending';
  if (vStatus === 4 || vStatus === 5 || vStatus === 1) {
    status = 'Visited';
  } else if (vStatus === 6) {
    status = 'Rejected';
  } else if (vStatus === 2) {
    status = 'Missed';
  } else if (vStatus === 3) {
    status = 'Cancelled';
  }
  const color = STATUS_COLORS[status] || '#6B7280';

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
      padding: '12px 14px', marginBottom: 8,
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      {/* Route badge */}
      <div style={{
        minWidth: 38, height: 38, borderRadius: 12,
        background: `${ROYAL_BLUE}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 12, color: ROYAL_BLUE,
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: '#111827' }}>
            {agent.agent_name || `Agent #${agent.agent_user_id}`}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 800, color,
            background: `${color}15`, borderRadius: 20, padding: '2px 8px',
            whiteSpace: 'nowrap', marginLeft: 8,
          }}>
            <Circle size={7} style={{ marginRight: 3, verticalAlign: 'middle' }} fill={color} />
            {status}
          </span>
        </div>
        {agent.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: '#6B7280', fontSize: 12, fontWeight: 700 }}>
            <Phone size={12} />{agent.phone}
          </div>
        )}
        {agent.location_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, color: '#6B7280', fontSize: 12, fontWeight: 700 }}>
            <MapPin size={12} />{agent.location_name}
          </div>
        )}
        {(agent.latitude && agent.longitude) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, color: ROYAL_BLUE, fontSize: 11, fontWeight: 700 }}>
            <MapPin size={11} style={{ color: ROYAL_BLUE }} />
            {agent.latitude.toFixed(4)}, {agent.longitude.toFixed(4)}
          </div>
        ) : null}
        {agent.visit_note && (
          <div style={{ 
            marginTop: 6, 
            padding: '6px 10px', 
            background: '#F9FAFB', 
            borderRadius: 8, 
            borderLeft: '3px solid #16A34A',
            fontSize: 12, 
            fontWeight: 600, 
            color: '#374151' 
          }}>
            <strong style={{ color: '#111827' }}>Visit Note:</strong> {agent.visit_note}
          </div>
        )}
      </div>
    </div>
  );
}

function DsrBlock({ dsr, searchQuery }: { dsr: DsrEntry; searchQuery: string }) {
  const [expanded, setExpanded] = useState(true);

  const filteredAgents = dsr.agents.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.agent_name || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q) ||
      (a.location_name || '').toLowerCase().includes(q)
    );
  });

  if (searchQuery && filteredAgents.length === 0) return null;

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid #E5E7EB',
      boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden', marginBottom: 16,
    }}>
      {/* DSR Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '14px 16px',
          background: `linear-gradient(135deg, ${NAVY} 0%, ${ROYAL_BLUE} 100%)`,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserCircle2 size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>
            {dsr.dsr_name}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
            {dsr.dsr_phone || ''} · {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} today
          </div>
        </div>
        {/* Agent count badge */}
        <div style={{
          background: 'rgba(255,255,255,0.18)', borderRadius: 20,
          padding: '3px 10px', fontWeight: 900, fontSize: 13, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Users size={13} />
          {filteredAgents.length}
        </div>
        <ChevronLeft size={16} color="rgba(255,255,255,0.7)"
          style={{ transform: expanded ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Agent list */}
      {expanded && (
        <div style={{ padding: '12px 14px' }}>
          {filteredAgents.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 700, textAlign: 'center', padding: '16px 0' }}>
              No agents assigned for this DSR today.
            </div>
          ) : (
            filteredAgents.map((agent, i) => (
              <AgentCard key={agent.agent_user_id ?? i} agent={agent} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface DealerRoadmapPageProps {
  isSuperUser?: boolean;
}

export default function DealerRoadmapPage({ isSuperUser = false }: DealerRoadmapPageProps) {
  const pageTitle = useMenuTitle();
  const [date, setDate] = useState(new Date());
  const [roadmap, setRoadmap] = useState<DealerRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // For superuser: dealer selection
  const [dealers, setDealers] = useState<{ value: number; label: string }[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);

  // Load dealers for superuser mode
  useEffect(() => {
    if (isSuperUser) {
      visitPlanService.getDealers().then(list => {
        setDealers(list);
        if (list.length > 0) setSelectedDealerId(list[0].value);
      }).catch(() => {});
    }
  }, [isSuperUser]);

  const fetchRoadmap = useCallback(async () => {
    const dealerId = isSuperUser ? selectedDealerId : null;
    if (isSuperUser && !dealerId) return;

    setLoading(true);
    setError(null);
    try {
      const dateStr = toApiDate(date);
      // Non-superuser: the backend resolves dealer from logged-in user's context
      // For superuser: pass explicit dealerId
      const res = isSuperUser
        ? await visitPlanService.getDealerRoadmap(dealerId!, dateStr)
        : await visitPlanService.getDealerRoadmap(0, dateStr); // 0 = current user's dealer resolved server-side

      const data = res?.data ?? res;
      if (data && typeof data === 'object' && 'dsrs' in data) {
        setRoadmap(data as DealerRoadmap);
      } else {
        setRoadmap(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load roadmap.');
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  }, [date, isSuperUser, selectedDealerId]);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

  const goToPrev = () => setDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const goToNext = () => setDate(d => {
    const n = new Date(d);
    n.setDate(n.getDate() + 1);
    const today = new Date();
    const isNextFuture = new Date(n.getFullYear(), n.getMonth(), n.getDate()) > new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return isNextFuture ? d : n;
  });
  const goToToday = () => setDate(new Date());

  // Summary stats
  const totalDsrs = roadmap?.dsrs.length ?? 0;
  const totalAgents = roadmap?.dsrs.reduce((s, d) => s + d.agents.length, 0) ?? 0;
  const activeDsrs = roadmap?.dsrs.filter(d => d.agents.length > 0).length ?? 0;

  const filteredDsrs = (roadmap?.dsrs ?? []).filter(dsr => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if ((dsr.dsr_name || '').toLowerCase().includes(q)) return true;
    return dsr.agents.some(a =>
      (a.agent_name || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q) ||
      (a.location_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0 }}>
            {pageTitle || 'Dealer Roadmap'}
          </h2>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarDays size={13} />
            {roadmap ? `${roadmap.dealer_name || 'Dealer'} — ${roadmap.day_of_week_name}` : 'DSR visit schedule by date'}
          </p>
        </div>
        <button
          onClick={fetchRoadmap}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: ROYAL_BLUE, color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px 14px',
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Superuser dealer selector ── */}
      {isSuperUser && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: '#6B7280', display: 'block', marginBottom: 4 }}>
            Select Dealer
          </label>
          <select
            value={selectedDealerId ?? ''}
            onChange={e => setSelectedDealerId(Number(e.target.value))}
            style={{
              width: '100%', maxWidth: 360, padding: '8px 12px',
              border: '1px solid #E5E7EB', borderRadius: 10,
              fontSize: 14, fontWeight: 700, color: NAVY,
              background: '#fff', outline: 'none', cursor: 'pointer',
            }}
          >
            {dealers.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      )}

      {/* ── Date nav ── */}
      <div style={{ marginBottom: 12 }}>
        <DateNavBar date={date} onPrev={goToPrev} onNext={goToNext} onToday={goToToday} />
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <SummaryCard icon={<Users size={18} />} label="Total DSRs" value={totalDsrs} color={ROYAL_BLUE} />
        <SummaryCard icon={<CheckCircle2 size={18} />} label="Active DSRs" value={activeDsrs} color="#16A34A" />
        <SummaryCard icon={<UserCircle2 size={18} />} label="Total Agents" value={totalAgents} color="#F59E0B" />
        <SummaryCard icon={<Clock size={18} />} label="Pending" value={totalAgents} color="#6B7280" />
      </div>

      {/* ── Search ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', borderRadius: 14, padding: '8px 14px',
        border: '1px solid #E5E7EB', marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <Search size={16} color="#9CA3AF" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search DSR, agent, phone or location…"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 13, fontWeight: 600, color: '#111827',
            background: 'transparent',
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: ROYAL_BLUE, marginBottom: 10 }} />
          <div style={{ fontWeight: 700 }}>Loading roadmap…</div>
        </div>
      )}

      {!loading && error && (
        <div style={{
          background: '#FEF2F2', borderRadius: 14, padding: '20px 18px',
          border: '1px solid #FECACA', display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontWeight: 700, color: '#B91C1C' }}>{error}</span>
        </div>
      )}

      {!loading && !error && filteredDsrs.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#fff', borderRadius: 18, border: '1px solid #E5E7EB',
        }}>
          <CalendarDays size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 900, fontSize: 18, color: '#374151', marginBottom: 6 }}>
            No roadmap data
          </div>
          <div style={{ fontWeight: 600, color: '#9CA3AF', fontSize: 14 }}>
            No visits scheduled for {formatDate(date)}.
          </div>
        </div>
      )}

      {!loading && !error && filteredDsrs.length > 0 && (
        <div>
          {filteredDsrs.map(dsr => (
            <DsrBlock key={dsr.dsr_user_id} dsr={dsr} searchQuery={searchQuery} />
          ))}
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
