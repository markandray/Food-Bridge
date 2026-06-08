import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MapPin, Calendar, Award, Package, CheckCircle, Utensils } from 'lucide-react';
import Badge from '../components/common/Badge';
import ImpactCounter from '../components/dashboard/ImpactCounter';
import StarRating from '../components/common/StarRating';
import Spinner from '../components/common/Spinner';
import { getRatingsForUser } from '../services/ratings.service';
import { COLLECTIONS, ROLES, ROUTES } from '../utils/constants';
import { formatDate } from '../utils/dateHelpers';

const Profile = () => {
  const { id } = useParams();
  const [profile,  setProfile]  = useState(null);
  const [impact,   setImpact]   = useState(null);
  const [ratings,  setRatings]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [userSnap, impactSnap, ratingsData] = await Promise.all([
          getDoc(doc(db, COLLECTIONS.USERS, id)),
          getDoc(doc(db, COLLECTIONS.IMPACT, id)),
          getRatingsForUser(id),
        ]);
        if (!userSnap.exists()) { setNotFound(true); return; }
        setProfile(userSnap.data());
        setImpact(impactSnap.exists() ? impactSnap.data() : { totalListings: 0, totalDonationsKg: 0, totalPickups: 0, mealsServed: 0, completedCount: 0 });
        setRatings(ratingsData);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 animate-pulse">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Utensils className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Profile not found</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This user doesn't exist or may have been removed.</p>
        <Link to={ROUTES.HOME} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
          ← Back to home
        </Link>
      </div>
    );
  }

  const isRestaurant  = profile.role === ROLES.RESTAURANT;
  const roleColor     = isRestaurant ? 'orange'  : 'blue';
  const avatarBg      = isRestaurant ? 'bg-orange-100 dark:bg-orange-900/30'  : 'bg-blue-100 dark:bg-blue-900/30';
  const avatarText    = isRestaurant ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400';
  // accentBorder on the card — subtle role-tinted border
  const accentBorder  = isRestaurant ? 'border-orange-100 dark:border-orange-900/40' : 'border-blue-100 dark:border-blue-900/40';
  const initial       = profile.name?.charAt(0).toUpperCase() || '?';
  const memberSince   = profile.createdAt ? formatDate(profile.createdAt) : 'Unknown';

  const averageStars = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : null;
  const displayStars = averageStars !== null ? Math.round(averageStars) : 0;

  const statBlocks = isRestaurant
    ? [
        { label: 'Listings Posted', value: impact.totalListings,                       icon: Package,     color: 'emerald' },
        { label: 'Completed',       value: impact.completedCount,                      icon: CheckCircle, color: 'blue'    },
        { label: 'kg Donated',      value: Number(impact.totalDonationsKg).toFixed(1), icon: Award,       color: 'orange'  },
      ]
    : [
        { label: 'Pickups Claimed', value: impact.totalPickups,   icon: Package,     color: 'blue'    },
        { label: 'Completed',       value: impact.completedCount, icon: CheckCircle, color: 'emerald' },
        { label: 'Meals Served',    value: impact.mealsServed,    icon: Award,       color: 'blue'    },
      ];

  // Full class strings per color — no dynamic interpolation (Tailwind purge rule)
  const bgMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    blue:    'bg-blue-50 dark:bg-blue-900/20',
    orange:  'bg-orange-50 dark:bg-orange-900/20',
  };
  const iconMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue:    'text-blue-600 dark:text-blue-400',
    orange:  'text-orange-600 dark:text-orange-400',
  };
  const valMap = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    blue:    'text-blue-700 dark:text-blue-300',
    orange:  'text-orange-700 dark:text-orange-300',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border ${accentBorder} shadow-sm overflow-hidden`}>

        {/* Profile header */}
        <div className="p-8 pb-6">
          <div className="flex items-start gap-5">
            <div className={`w-16 h-16 rounded-2xl ${avatarBg} flex items-center justify-center flex-shrink-0`}>
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className={`text-2xl font-bold ${avatarText}`}>{initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{profile.name}</h1>
                <Badge color={roleColor}>{isRestaurant ? 'Restaurant' : 'NGO'}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{profile.city}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 mb-2">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Member since {memberSince}</span>
              </div>
              {averageStars !== null ? (
                <div className="flex items-center gap-2">
                  <StarRating value={displayStars} interactive={false} size={16} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {averageStars.toFixed(1)} ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">No ratings yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 mx-8" />

        {/* Impact stats */}
        <div className="p-8 pt-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Impact</h2>
          <div className="grid grid-cols-3 gap-4">
            {statBlocks.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`${bgMap[color]} rounded-xl p-4 flex flex-col items-center text-center gap-2`}>
                <div className={iconMap[color]}>
                  <Icon className="h-5 w-5" />
                </div>
                <ImpactCounter value={Number(value)} className={`text-2xl font-bold ${valMap[color]}`} />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to={ROUTES.HOME} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
};

export default Profile;