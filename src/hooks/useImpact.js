import { useState, useEffect } from 'react';
import { getImpactStats } from '../services/impact.service';
import { KG_TO_MEALS_RATIO } from '../utils/constants';

const useImpact = (userId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getImpactStats(userId);
        const enrichedStats = {
          ...data,        
          mealsServed: Math.max(
            data.mealsServed || 0,
            Math.floor((data.totalDonationsKg || 0) * KG_TO_MEALS_RATIO)
          ),
          
          completionRate:
            data.totalListings > 0
              ? Math.round((data.completedCount / data.totalListings) * 100)
              : 0,
        };

        setStats(enrichedStats);
      } catch (err) {
        setError(err.message || 'Failed to load impact stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]); 
  const refresh = () => {
    if (userId) {
      setLoading(true);
      getImpactStats(userId)
        .then((data) => {
          setStats({
            ...data,
            mealsServed: Math.max(
              data.mealsServed || 0,
              Math.floor((data.totalDonationsKg || 0) * KG_TO_MEALS_RATIO)
            ),
            completionRate:
              data.totalListings > 0
                ? Math.round((data.completedCount / data.totalListings) * 100)
                : 0,
          });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  return { stats, loading, error, refresh };
};

export default useImpact;