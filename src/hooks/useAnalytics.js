// src/hooks/useAnalytics.js
//
// Derives all four analytics datasets from completedPickups[].
// Uses useMemo so aggregations only re-run when completedPickups changes —
// not on every render of the Analytics page.

import { useMemo } from 'react';
import {
  getFoodSavedPerWeek,
  getMostDonatedFoodTypes,
  getPeakDonationTimes,
  getNgoPartnerBreakdown,
} from '../services/analytics.service';

const useAnalytics = (completedPickups = []) => {
  // Each useMemo is independent so a future change to one aggregation
  // doesn't invalidate the others.

  const foodSavedPerWeek = useMemo(
    () => getFoodSavedPerWeek(completedPickups),
    [completedPickups]
  );

  const mostDonatedFoodTypes = useMemo(
    () => getMostDonatedFoodTypes(completedPickups),
    [completedPickups]
  );

  const peakDonationTimes = useMemo(
    () => getPeakDonationTimes(completedPickups),
    [completedPickups]
  );

  const ngoPartnerBreakdown = useMemo(
    () => getNgoPartnerBreakdown(completedPickups),
    [completedPickups]
  );

  // Summary numbers shown at the top of the Analytics page
  const summary = useMemo(() => {
    const totalKg = completedPickups.reduce(
      (sum, p) => (p.unit?.toLowerCase() === 'kg' ? sum + Number(p.quantity || 0) : sum),
      0
    );
    const uniqueNgos   = new Set(completedPickups.map((p) => p.ngoId)).size;
    const uniqueFoods  = new Set(
      completedPickups.map((p) => p.foodName?.trim().toLowerCase()).filter(Boolean)
    ).size;
    const peakHour = peakDonationTimes.reduce(
      (max, h) => (h.count > max.count ? h : max),
      { hour: '—', count: 0 }
    ).hour;

    return {
      totalCompleted: completedPickups.length,
      totalKg:        parseFloat(totalKg.toFixed(1)),
      uniqueNgos,
      uniqueFoods,
      peakHour,
    };
  }, [completedPickups, peakDonationTimes]);

  return {
    foodSavedPerWeek,
    mostDonatedFoodTypes,
    peakDonationTimes,
    ngoPartnerBreakdown,
    summary,
  };
};

export default useAnalytics;