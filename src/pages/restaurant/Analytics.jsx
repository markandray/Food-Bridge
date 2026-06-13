// src/pages/restaurant/Analytics.jsx

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { BarChart2, Leaf, Users, Utensils, Clock } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import usePickups from '../../hooks/usePickups';
import useAnalytics from '../../hooks/useAnalytics';
import StatsCard from '../../components/dashboard/StatsCard';
import Sidebar from '../../components/layout/Sidebar';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { ROLES } from '../../utils/constants';

// ---------------------------------------------------------------------------
// Pie chart colour palette — 8 distinct colours that work in light + dark mode
// ---------------------------------------------------------------------------
const PIE_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
];

// ---------------------------------------------------------------------------
// Shared chart theme values — keeps all four charts visually consistent
// ---------------------------------------------------------------------------
const CHART_GRID   = '#e2e8f0'; // slate-200  (dark: handled via CSS var below)
const CHART_TEXT   = '#64748b'; // slate-500
const CHART_RADIUS = 4;

// ---------------------------------------------------------------------------
// ChartCard — consistent wrapper for every chart section
// ---------------------------------------------------------------------------
const ChartCard = ({ title, subtitle, children, isEmpty, emptyText }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
    <div className="mb-4">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {isEmpty ? (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">
        {emptyText || 'No data yet'}
      </div>
    ) : (
      children
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Custom Tooltip for Bar / Line charts
// Recharts passes `active`, `payload`, `label` automatically.
// ---------------------------------------------------------------------------
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Custom label renderer for Pie slices — shows percentage if slice ≥ 5%
// Recharts passes cx, cy, midAngle, innerRadius, outerRadius, percent, name.
// ---------------------------------------------------------------------------
const RADIAN = Math.PI / 180;
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null; // skip tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const Analytics = () => {
  const { userProfile }    = useAuth();
  const { completedPickups, loading, error } = usePickups(userProfile?.uid, ROLES.RESTAURANT);

  const {
    foodSavedPerWeek,
    mostDonatedFoodTypes,
    peakDonationTimes,
    ngoPartnerBreakdown,
    summary,
  } = useAnalytics(completedPickups);

  // Only show the hours window where any donations happened (±1 hr padding)
  // so the line chart isn't mostly flat zeros.
  const trimmedHours = useMemo(() => {
    const active = peakDonationTimes.filter((h) => h.count > 0);
    if (active.length === 0) return peakDonationTimes;
    const minIdx = Math.max(0,  peakDonationTimes.indexOf(active[0]) - 1);
    const maxIdx = Math.min(23, peakDonationTimes.indexOf(active[active.length - 1]) + 1);
    return peakDonationTimes.slice(minIdx, maxIdx + 1);
  }, [peakDonationTimes]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </main>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-red-500 font-medium">Failed to load analytics: {error}</p>
        </main>
      </div>
    );
  }

  // ── Empty (no completed pickups at all) ──────────────────────────────────
  if (completedPickups.length === 0) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <EmptyState
            icon={BarChart2}
            title="No analytics yet"
            description="Analytics appear once your first pickup is marked complete."
          />
        </main>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <BarChart2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 ">Food Waste Analytics</h1>
            <p className="text-slate-600 text-base mt-2">
              Insights from {summary.totalCompleted} completed donation{summary.totalCompleted !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Donations" value={summary.totalCompleted} icon={BarChart2} color="emerald" subtitle="Completed pickups" />
          <StatsCard title="kg Saved"        value={`${summary.totalKg} kg`} icon={Leaf}     color="blue"    subtitle="Kg unit only" />
          <StatsCard title="NGO Partners"    value={summary.uniqueNgos}     icon={Users}    color="purple"  subtitle="Unique NGOs served" />
          <StatsCard title="Peak Hour"       value={summary.peakHour}       icon={Clock}    color="amber"   subtitle="Most active time" />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Chart 1: Food saved per week (Bar) ── */}
          <ChartCard
            title="Food Saved Per Week"
            subtitle="kg donated per week · non-kg units counted separately"
            isEmpty={foodSavedPerWeek.length === 0}
            emptyText="No completed pickups with dates yet"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={foodSavedPerWeek} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: CHART_TEXT }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: CHART_TEXT }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="totalKg"    name="kg"          fill="#10b981" radius={[CHART_RADIUS, CHART_RADIUS, 0, 0]} />
                <Bar dataKey="otherCount" name="other units" fill="#94a3b8" radius={[CHART_RADIUS, CHART_RADIUS, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend — manual so we can style it consistently */}
            <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />kg donated</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />other units (count)</span>
            </div>
          </ChartCard>

          {/* ── Chart 2: Most donated food types (Pie) ── */}
          <ChartCard
            title="Most Donated Food Types"
            subtitle={`Top ${mostDonatedFoodTypes.length} items by pickup count`}
            isEmpty={mostDonatedFoodTypes.length === 0}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={mostDonatedFoodTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  dataKey="value"
                  labelLine={false}
                  label={<PieLabel />}
                >
                  {mostDonatedFoodTypes.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} pickup${value !== 1 ? 's' : ''}`, name]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend
                  formatter={(value) => <span style={{ fontSize: 11, color: CHART_TEXT }}>{value}</span>}
                  iconSize={10}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Chart 3: Peak donation times (Line) ── */}
          <ChartCard
            title="Peak Donation Times"
            subtitle="Completed pickups grouped by hour of day"
            isEmpty={peakDonationTimes.every((h) => h.count === 0)}
            emptyText="No time data available yet"
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trimmedHours} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: CHART_TEXT }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: CHART_TEXT }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="pickups"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Chart 4: NGO partner breakdown (Table) ── */}
          <ChartCard
            title="NGO Partner Breakdown"
            subtitle="Ranked by number of completed pickups"
            isEmpty={ngoPartnerBreakdown.length === 0}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">#</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NGO</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pickups</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">kg</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Other</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {ngoPartnerBreakdown.map((ngo, i) => (
                    <tr key={ngo.ngoName} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-2.5 pr-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{i + 1}</td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{ngo.ngoName}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {ngo.pickupCount}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400 text-xs">{ngo.totalKg > 0 ? `${ngo.totalKg} kg` : '—'}</td>
                      <td className="py-2.5 text-right text-slate-500 dark:text-slate-500 text-xs">{ngo.otherCount > 0 ? ngo.otherCount : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

        </div>
      </main>
    </div>
  );
};

export default Analytics;