import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Utensils, Mail, Lock, Phone, MapPin, User, AlertCircle, Check } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { signupUser, getFriendlyAuthError } from '../services/auth.service';
import { validateSignupForm, isFormValid } from '../utils/validators';
import { ROLES, ROUTES, CITIES } from '../utils/constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import RoleCard from '../components/auth/RoleCard';
import GoogleButton from '../components/auth/GoogleButton';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    city: '',       // used for restaurants
    cities: [],     // NEW — used for NGOs (Feature J)
    role: '',
  });
  const [errors, setErrors]           = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading]         = useState(false);

  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const nameRef  = useRef(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'restaurant' || roleParam === 'ngo') {
      setFormData((prev) => ({ ...prev, role: roleParam === 'restaurant' ? ROLES.RESTAURANT : ROLES.NGO }));
    }
  }, [searchParams]);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    if (currentUser && role) {
      navigate(role === ROLES.RESTAURANT ? ROUTES.RESTAURANT_DASHBOARD : ROUTES.NGO_DASHBOARD, { replace: true });
    }
  }, [currentUser, role, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (submitError)  setSubmitError('');
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
  };

  // Feature J: toggle a city in/out of the cities array
  // Using a Set for O(1) lookup — converted back to array for state
  const handleCityToggle = (city) => {
    setFormData((prev) => {
      const citySet = new Set(prev.cities);
      if (citySet.has(city)) citySet.delete(city);
      else                   citySet.add(city);
      return { ...prev, cities: Array.from(citySet) };
    });
    if (errors.cities) setErrors((prev) => ({ ...prev, cities: '' }));
    if (submitError)   setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateSignupForm(formData);
    if (!isFormValid(validationErrors)) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    setSubmitError('');
    try {
      await signupUser(formData);
      navigate(formData.role === ROLES.RESTAURANT ? ROUTES.RESTAURANT_DASHBOARD : ROUTES.NGO_DASHBOARD, { replace: true });
    } catch (error) {
      setSubmitError(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const citySelectClasses = `
    w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer
    bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
    ${errors.city
      ? 'border-red-400 focus:ring-red-500'
      : 'border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
    }
  `;

  const isNgo = formData.role === ROLES.NGO;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <Utensils className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Join as a {formData.role === ROLES.NGO ? 'NGO' : 'Restaurant'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Join FoodBridge — free for restaurants and NGOs
            </p>
          </div>

          <GoogleButton label="Sign up with Google" />

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-slate-200 dark:border-slate-600" />
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              or sign up with email
            </span>
            <hr className="flex-1 border-slate-200 dark:border-slate-600" />
          </div>

          {submitError && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                I am a <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard role={ROLES.RESTAURANT} selected={formData.role === ROLES.RESTAURANT} onSelect={handleRoleSelect} />
                <RoleCard role={ROLES.NGO}        selected={formData.role === ROLES.NGO}        onSelect={handleRoleSelect} />
              </div>
              {errors.role && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                  <span>⚠</span> {errors.role}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Your Details
              </p>
              <div className="space-y-4">
                <Input
                  ref={nameRef}
                  label={formData.role === ROLES.RESTAURANT ? 'Restaurant Name' : 'Organisation Name'}
                  name="name" value={formData.name} onChange={handleChange}
                  placeholder={formData.role === ROLES.RESTAURANT ? 'e.g. Spice Garden Restaurant' : 'e.g. Helping Hands NGO'}
                  error={errors.name} icon={User} required
                />
                <Input
                  label="Email address" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="contact@yourorg.com" error={errors.email}
                  icon={Mail} required autoComplete="email"
                />
                <Input
                  label="Password" name="password" type="password"
                  value={formData.password} onChange={handleChange}
                  placeholder="Min. 6 characters" error={errors.password}
                  icon={Lock} required autoComplete="new-password" hint="At least 6 characters"
                />
                <Input
                  label="Phone number" name="phone" type="tel"
                  value={formData.phone} onChange={handleChange}
                  placeholder="9876543210" error={errors.phone} icon={Phone} required
                />

                {/* City selection — single select for restaurants, checkboxes for NGOs */}
                {isNgo ? (
                  // Feature J: NGO multi-city checkbox grid
                  // Each city is a toggle button styled as a checkbox row.
                  // The selected state is stored in formData.cities (string[]).
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cities you operate in <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                      Select all cities where your NGO collects food
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {CITIES.map((city) => {
                        const isSelected = formData.cities.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => handleCityToggle(city)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                          >
                            {/* Checkbox indicator */}
                            <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-slate-300 dark:border-slate-500'
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                            </span>
                            {city}
                          </button>
                        );
                      })}
                    </div>
                    {errors.cities && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <span>⚠</span> {errors.cities}
                      </p>
                    )}
                    {formData.cities.length > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {formData.cities.length} {formData.cities.length === 1 ? 'city' : 'cities'} selected
                      </p>
                    )}
                  </div>
                ) : (
                  // Restaurant: existing single city select — unchanged
                  <div className="flex flex-col gap-1">
                    <label htmlFor="city" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <select id="city" name="city" value={formData.city} onChange={handleChange} className={citySelectClasses}>
                        <option value="">Select your city</option>
                        {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                    {errors.city && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <span>⚠</span> {errors.city}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;