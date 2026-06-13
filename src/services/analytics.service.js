// src/services/analytics.service.js
//
// Pure aggregation functions for the Food Waste Analytics Dashboard.
// No Firestore calls here — all functions receive completedPickups[] as input.
// This keeps Firestore logic inside pickups.service.js and makes these
// functions trivially testable.

import { PICKUP_STATUS } from '../utils/constants';

// ---------------------------------------------------------------------------
// Helper — safely convert a Firestore Timestamp or JS Date to a JS Date.
// completedAt is a Firestore Timestamp (has .toDate()), but claimedAt is
// used as a fallback in case completedAt was never written.
// ---------------------------------------------------------------------------
const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return null;
};

// ---------------------------------------------------------------------------
// 1. FOOD SAVED PER WEEK
//
// Groups completed pickups by ISO week label ("Week of MMM D").
// Only kg quantities are summed into totalKg; other units are counted
// separately so we never silently add packets to kilograms.
//
// Returns: [{ week, totalKg, otherCount }, ...] sorted oldest → newest
//          (Recharts BarChart expects chronological order left→right)
// ---------------------------------------------------------------------------
export const getFoodSavedPerWeek = (completedPickups) => {
  const weekMap = new Map();

  completedPickups.forEach((pickup) => {
    const date = toDate(pickup.completedAt) || toDate(pickup.claimedAt);
    if (!date) return;

    // ISO week start = Monday of that week
    const day = date.getDay(); // 0=Sun … 6=Sat
    const diff = (day === 0 ? -6 : 1) - day; // days to shift back to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const key = monday.toISOString();
    const label = monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    if (!weekMap.has(key)) {
      weekMap.set(key, { week: `w/o ${label}`, totalKg: 0, otherCount: 0, _ts: monday });
    }

    const entry = weekMap.get(key);
    if (pickup.unit?.toLowerCase() === 'kg') {
      entry.totalKg += Number(pickup.quantity || 0);
    } else {
      entry.otherCount += 1;
    }
  });

  return [...weekMap.values()]
    .sort((a, b) => a._ts - b._ts)
    .map(({ week, totalKg, otherCount }) => ({
      week,
      totalKg: parseFloat(totalKg.toFixed(1)),
      otherCount,
    }));
};

// ---------------------------------------------------------------------------
// 2. MOST DONATED FOOD TYPES
//
// Groups by foodName (case-insensitive trim), counts occurrences.
// Returns top 8 by count so the pie chart stays readable.
//
// Returns: [{ name, value }, ...] sorted descending by value
// ---------------------------------------------------------------------------
export const getMostDonatedFoodTypes = (completedPickups) => {
  const countMap = new Map();

  completedPickups.forEach((pickup) => {
    const name = pickup.foodName?.trim().toLowerCase();
    if (!name) return;
    // Display name: use the original casing from the first occurrence
    if (!countMap.has(name)) {
      countMap.set(name, { name: pickup.foodName.trim(), value: 0 });
    }
    countMap.get(name).value += 1;
  });

  return [...countMap.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

// ---------------------------------------------------------------------------
// 3. PEAK DONATION TIMES
//
// Groups by hour-of-day (0–23) using completedAt (or claimedAt fallback).
// Returns all 24 hours so the chart always shows the full day arc —
// hours with no pickups get count: 0.
//
// Returns: [{ hour: '08:00', count }, ...] for hours 0–23
// ---------------------------------------------------------------------------
export const getPeakDonationTimes = (completedPickups) => {
  const hourCounts = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: 0,
  }));

  completedPickups.forEach((pickup) => {
    const date = toDate(pickup.completedAt) || toDate(pickup.claimedAt);
    if (!date) return;
    hourCounts[date.getHours()].count += 1;
  });

  return hourCounts;
};

// ---------------------------------------------------------------------------
// 4. NGO PARTNER BREAKDOWN
//
// Groups by ngoId, sums pickup count and total kg donated to each NGO.
// Non-kg units are tallied separately (otherCount) — same safe pattern
// as getFoodSavedPerWeek.
//
// Returns: [{ ngoName, pickupCount, totalKg, otherCount }, ...]
//          sorted descending by pickupCount
// ---------------------------------------------------------------------------
export const getNgoPartnerBreakdown = (completedPickups) => {
  const ngoMap = new Map();

  completedPickups.forEach((pickup) => {
    const id = pickup.ngoId;
    if (!id) return;

    if (!ngoMap.has(id)) {
      ngoMap.set(id, {
        ngoName:     pickup.ngoName || 'Unknown NGO',
        pickupCount: 0,
        totalKg:     0,
        otherCount:  0,
      });
    }

    const entry = ngoMap.get(id);
    entry.pickupCount += 1;

    if (pickup.unit?.toLowerCase() === 'kg') {
      entry.totalKg += Number(pickup.quantity || 0);
    } else {
      entry.otherCount += 1;
    }
  });

  return [...ngoMap.values()]
    .sort((a, b) => b.pickupCount - a.pickupCount)
    .map((e) => ({ ...e, totalKg: parseFloat(e.totalKg.toFixed(1)) }));
};