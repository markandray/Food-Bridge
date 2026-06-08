import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils, Users, ArrowRight, CheckCircle, Leaf, Clock,
  MapPin, Shield, TrendingUp, ChevronRight, Star, Heart
} from 'lucide-react';
import Button from '../components/common/Button';
import { ROUTES } from '../utils/constants';
import useAuth from '../hooks/useAuth';

const STATS = [
  { value: '50,000+', label: 'kg Food Saved',   icon: Leaf,    color: 'text-emerald-600' },
  { value: '1,200+',  label: 'Restaurants',      icon: Utensils,color: 'text-orange-500'  },
  { value: '340+',    label: 'NGO Partners',      icon: Users,   color: 'text-blue-500'    },
  { value: '1.25L+',  label: 'Meals Served',      icon: Heart,   color: 'text-red-500'     },
];

const HOW_IT_WORKS_RESTAURANT = [
  { step: '01', title: 'Sign up as a Restaurant',  description: 'Create your account and set up your restaurant profile in under 2 minutes.'                     },
  { step: '02', title: 'Post surplus food',         description: 'List food with quantity, pickup window, and expiry time. Add a photo to attract NGOs faster.'    },
  { step: '03', title: 'NGO claims & collects',     description: 'An NGO in your city claims the listing and arrives during the pickup window.'                    },
  { step: '04', title: 'Mark as completed',         description: 'Confirm the pickup in the app. Your impact stats update automatically.'                          },
];

const HOW_IT_WORKS_NGO = [
  { step: '01', title: 'Sign up as an NGO',         description: 'Register your organization and choose your city to see relevant listings.'                       },
  { step: '02', title: 'Browse available food',     description: 'See real-time listings from restaurants in your city with quantity and pickup times.'             },
  { step: '03', title: 'Claim a listing',           description: 'One click to claim. The restaurant is notified immediately.'                                     },
  { step: '04', title: 'Collect & distribute',      description: 'Arrive during the pickup window, collect the food, and serve your community.'                    },
];

const FEATURES = [
  { icon: Clock,     title: 'Real-time listings',  description: 'Food listings appear the moment a restaurant posts them. No delays, no refresh needed.'           },
  { icon: MapPin,    title: 'City-based matching',  description: 'NGOs only see listings from restaurants in their city — no wasted trips.'                        },
  { icon: Shield,    title: 'Verified accounts',    description: 'Every restaurant and NGO goes through our signup verification flow.'                             },
  { icon: TrendingUp,title: 'Impact tracking',      description: 'Both sides see their cumulative impact — kg donated, meals served, pickups completed.'           },
];

// Sub-components — each needs dark classes since they render on light sections
const StatCard = ({ value, label, icon: Icon, color }) => (
  <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
    <Icon className={`h-8 w-8 mb-3 ${color}`} />
    <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{label}</p>
  </div>
);

const StepCard = ({ step, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center justify-center">
      {step}
    </div>
    <div>
      <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h4>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{title}</h4>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const Landing = () => {
  const [activeRole, setActiveRole] = useState('restaurant');
  const { currentUser, role } = useAuth();
  const ctaPath = currentUser
    ? role === 'restaurant' ? ROUTES.RESTAURANT_DASHBOARD : ROUTES.NGO_DASHBOARD
    : ROUTES.SIGNUP;
  const steps = activeRole === 'restaurant' ? HOW_IT_WORKS_RESTAURANT : HOW_IT_WORKS_NGO;

  return (
    <div className="bg-slate-50 dark:bg-slate-900">

      {/* HERO — already dark green, no changes needed */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-700 rounded-full px-4 py-1.5 text-sm text-emerald-200 mb-6">
              <Leaf className="h-3.5 w-3.5" />
              <span>Fighting food waste across India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Surplus food finds <span className="text-orange-400">hungry hands.</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-10 leading-relaxed max-w-2xl">
              FoodBridge connects restaurants with surplus food to NGOs who distribute it to people in need — in real time, in your city. Every meal saved is a win for the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={ctaPath}>
                <Button variant="orange" size="lg" icon={ArrowRight} iconPosition="right">
                  {currentUser ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  How it works
                </Button>
              </a>
            </div>
            <div className="mt-10 flex items-center gap-2 text-emerald-300 text-sm">
              <div className="flex -space-x-2">
                {['🍽', '🥗', '🍱', '🤝'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-emerald-900 flex items-center justify-center text-sm">{emoji}</div>
                ))}
              </div>
              <span>Join 1,500+ restaurants and NGOs already on FoodBridge</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">How FoodBridge works</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            A simple four-step process that takes food from kitchen surplus to community plate in hours, not days.
          </p>
        </div>

        {/* Role toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {[
              { key: 'restaurant', label: '🍽 For Restaurants' },
              { key: 'ngo',        label: '🤝 For NGOs'        },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveRole(key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeRole === key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {steps.map((step, index) => <StepCard key={index} {...step} />)}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white dark:bg-slate-800/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">Built for the real world</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Features designed for how restaurants and NGOs actually operate — fast, mobile-first, and offline-tolerant.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>
      </section>

      {/* PROBLEM STATEMENT — already dark slate, needs minor text polish */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 lg:p-16 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              THE PROBLEM WE'RE SOLVING
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 leading-tight">
              40% of food in India is <span className="text-orange-400">wasted</span> before it ever reaches a plate.
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              India wastes approximately 68.8 million tonnes of food every year — while 189 million people go hungry. Most of this waste happens at the last mile: restaurants with unsold cooked food, no easy way to donate it, and NGOs with no visibility into what's available nearby.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {[
                { value: '68.8M', label: 'tonnes food wasted per year in India' },
                { value: '189M',  label: 'people facing hunger in India'         },
                { value: '40%',   label: 'of restaurant food goes to waste daily'},
              ].map((item) => (
                <div key={item.label} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-2xl font-extrabold text-orange-400 mb-1">{item.value}</p>
                  <p className="text-slate-400 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
            <Link to={ROUTES.SIGNUP}>
              <Button variant="orange" size="lg" icon={ChevronRight} iconPosition="right">Be part of the solution</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — emerald-600 bg works in both modes, no changes needed */}
      <section className="bg-emerald-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to bridge the gap?</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">Join FoodBridge today. It's free for both restaurants and NGOs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`${ROUTES.SIGNUP}?role=restaurant`}>
              <Button size="lg" className="bg-emerald-700 text-white border border-emerald-500 hover:bg-emerald-800" icon={ArrowRight} iconPosition="right">
                Sign up as Restaurant
              </Button>
            </Link>
            <Link to={`${ROUTES.SIGNUP}?role=ngo`}>
              <Button size="lg" className="bg-emerald-700 text-white border border-emerald-500 hover:bg-emerald-800" icon={ArrowRight} iconPosition="right">
                Sign up as NGO
              </Button>
            </Link>
          </div>
          <p className="text-emerald-200 text-sm mt-6">No credit card required · Takes 2 minutes · Available in 10 Indian cities</p>
        </div>
      </section>
    </div>
  );
};

export default Landing;