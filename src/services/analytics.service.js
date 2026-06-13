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

// ---------------------------------------------------------------------------
// 5. VEG VS NON-VEG DISTRIBUTION
//
// Counts pickups tagged 'veg' and 'non-veg' independently.
// A pickup with both tags is counted in both — intentional.
// Old pickups without tags safely contribute 0 to both counts.
//
// Returns: [{ name, value }, ...] for use in a PieChart
// ---------------------------------------------------------------------------
export const getVegNonVegDistribution = (completedPickups) => {
  let veg = 0;
  let nonVeg = 0;
  let neither = 0;

  completedPickups.forEach((pickup) => {
    const tags = Array.isArray(pickup.tags) ? pickup.tags : [];
    const hasVeg    = tags.includes('veg');
    const hasNonVeg = tags.includes('non-veg');
    if (hasVeg)    veg    += 1;
    if (hasNonVeg) nonVeg += 1;
    if (!hasVeg && !hasNonVeg) neither += 1;
  });

  // Only include 'Neither' slice if it exists — keeps pie clean when
  // all donations are tagged.
  const result = [
    { name: 'Veg',     value: veg    },
    { name: 'Non-Veg', value: nonVeg },
  ];
  if (neither > 0) result.push({ name: 'Untagged', value: neither });
  return result.filter((d) => d.value > 0);
};

// ---------------------------------------------------------------------------
// 6. TOP DONATED TAGS
//
// Flattens all tags across all pickups and counts occurrences.
// A pickup with 3 tags contributes 1 count to each of those 3 tags.
// Returns all tags sorted descending — caller can slice for display.
//
// Returns: [{ tag, count }, ...] sorted descending by count
// ---------------------------------------------------------------------------
export const getTopDonatedTags = (completedPickups) => {
  const tagCounts = new Map();

  completedPickups.forEach((pickup) => {
    const tags = Array.isArray(pickup.tags) ? pickup.tags : [];
    tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

// ---------------------------------------------------------------------------
// 7. TAG-WISE QUANTITY DONATED
//
// For each tag, sums total kg donated across all pickups carrying that tag.
// Non-kg units are skipped — same safe pattern as getFoodSavedPerWeek.
// A pickup with multiple tags contributes its kg to each tag.
//
// Returns: [{ tag, totalKg }, ...] sorted descending by totalKg
// ---------------------------------------------------------------------------
export const getTagWiseQuantity = (completedPickups) => {
  const tagKg = new Map();

  completedPickups.forEach((pickup) => {
    const tags = Array.isArray(pickup.tags) ? pickup.tags : [];
    if (pickup.unit?.toLowerCase() !== 'kg') return;
    const kg = Number(pickup.quantity || 0);
    tags.forEach((tag) => {
      tagKg.set(tag, (tagKg.get(tag) || 0) + kg);
    });
  });

  return [...tagKg.entries()]
    .map(([tag, totalKg]) => ({ tag, totalKg: parseFloat(totalKg.toFixed(1)) }))
    .sort((a, b) => b.totalKg - a.totalKg);
};

// ---------------------------------------------------------------------------
// 8. NGO TAG PREFERENCES
//
// For each NGO, counts how many pickups they completed per tag.
// Returns top 5 NGOs (by total pickups), each with their top 3 tags.
// This keeps the UI compact — a full matrix would be unreadable.
//
// Returns: [{ ngoName, tags: [{ tag, count }, ...] }, ...]
// ---------------------------------------------------------------------------
export const getNgoTagPreferences = (completedPickups) => {
  // ngoId → { ngoName, tagCounts: Map<tag, count> }
  const ngoMap = new Map();

  completedPickups.forEach((pickup) => {
    const id   = pickup.ngoId;
    const tags = Array.isArray(pickup.tags) ? pickup.tags : [];
    if (!id) return;

    if (!ngoMap.has(id)) {
      ngoMap.set(id, { ngoName: pickup.ngoName || 'Unknown NGO', tagCounts: new Map(), total: 0 });
    }

    const entry = ngoMap.get(id);
    entry.total += 1;
    tags.forEach((tag) => {
      entry.tagCounts.set(tag, (entry.tagCounts.get(tag) || 0) + 1);
    });
  });

  return [...ngoMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(({ ngoName, tagCounts }) => ({
      ngoName,
      // Top 3 tags for this NGO, sorted descending
      tags: [...tagCounts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    }))
    .filter((ngo) => ngo.tags.length > 0); // exclude NGOs with no tagged pickups
};

// ---------------------------------------------------------------------------
// 9. TAG INSIGHTS SUMMARY
//
// Derives three scalar insights from already-computed tag data.
// Accepts pre-computed arrays so this function never re-iterates pickups.
//
// fastestGrowing: compares tag counts in the most-recent half of pickups
// vs the older half. The tag with the highest count increase wins.
// Labelled "recently trending" in the UI to be honest about the method.
//
// Returns: { mostDonated, fastestGrowing, mostClaimed }
//          Each is a string tag name, or '—' if no tagged data exists.
// ---------------------------------------------------------------------------
export const getTagInsights = (completedPickups, topDonatedTags) => {
  const mostDonated = topDonatedTags[0]?.tag || '—';
  // mostClaimed is the same metric from the restaurant's perspective
  // (completed pickups = claimed + confirmed), so top tag = most claimed too.
  const mostClaimed = mostDonated;

  // Fastest growing: split pickups chronologically, compare tag frequency
  // in recent half vs older half. Requires at least 4 pickups to be meaningful.
  let fastestGrowing = '—';
  if (completedPickups.length >= 4) {
    // Sort oldest → newest by completedAt
    const sorted = [...completedPickups].sort((a, b) => {
      const aTs = a.completedAt?.toDate?.() || new Date(0);
      const bTs = b.completedAt?.toDate?.() || new Date(0);
      return aTs - bTs;
    });

    const mid      = Math.floor(sorted.length / 2);
    const older    = sorted.slice(0, mid);
    const recent   = sorted.slice(mid);

    const countTags = (pickups) => {
      const map = new Map();
      pickups.forEach((p) => {
        (Array.isArray(p.tags) ? p.tags : []).forEach((t) => {
          map.set(t, (map.get(t) || 0) + 1);
        });
      });
      return map;
    };

    const olderCounts  = countTags(older);
    const recentCounts = countTags(recent);

    let maxGrowth = 0;
    recentCounts.forEach((recentCount, tag) => {
      const growth = recentCount - (olderCounts.get(tag) || 0);
      if (growth > maxGrowth) { maxGrowth = growth; fastestGrowing = tag; }
    });
  }

  return { mostDonated, fastestGrowing, mostClaimed };
};