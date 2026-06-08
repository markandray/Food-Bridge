import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Utensils, Menu, X, LogOut, LayoutDashboard,
  PlusCircle, ClipboardList, History, Search, Sun, Moon
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import useNotifications from '../../hooks/useNotifications';
import { ROLES, ROUTES } from '../../utils/constants';
import { logoutUser } from '../../services/auth.service';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut]         = useState(false);

  const { currentUser, userProfile, role } = useAuth();
  const { theme, toggleTheme }             = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    notifications, unreadCount, markRead, markAllRead,
    loading: notificationsLoading,
  } = useNotifications(currentUser?.uid ?? null);

  const isActive = (path) => location.pathname === path;

  const restaurantLinks = [
    { to: ROUTES.RESTAURANT_DASHBOARD,        label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.RESTAURANT_POST_FOOD,        label: 'Post Food', icon: PlusCircle      },
    { to: ROUTES.RESTAURANT_MANAGE_LISTINGS,  label: 'Manage',    icon: ClipboardList   },
    { to: ROUTES.RESTAURANT_DONATION_HISTORY, label: 'History',   icon: History         },
  ];

  const ngoLinks = [
    { to: ROUTES.NGO_DASHBOARD,       label: 'Dashboard',  icon: LayoutDashboard },
    { to: ROUTES.NGO_BROWSE_LISTINGS, label: 'Browse',     icon: Search          },
    { to: ROUTES.NGO_CLAIMED_PICKUPS, label: 'My Pickups', icon: ClipboardList   },
    { to: ROUTES.NGO_PICKUP_HISTORY,  label: 'History',    icon: History         },
  ];

  const navLinks = role === ROLES.RESTAURANT ? restaurantLinks
    : role === ROLES.NGO ? ngoLinks
    : [];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Reusable toggle button — rendered in both desktop and mobile
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  );

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xl"
          >
            <Utensils className="h-6 w-6" />
            <span>FoodBridge</span>
          </Link>

          {/* Desktop nav links */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(to)
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <span className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full',
                  role === ROLES.RESTAURANT
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                )}>
                  {role === ROLES.RESTAURANT ? '🍽 Restaurant' : '🤝 NGO'}
                </span>

                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {userProfile?.name || currentUser.email}
                </span>

                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  loading={notificationsLoading}
                />

                {/* Theme toggle — sits between bell and logout */}
                <ThemeToggle />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  loading={loggingOut}
                  icon={LogOut}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                {/* Theme toggle visible on logged-out pages too */}
                <ThemeToggle />
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to={ROUTES.SIGNUP}>
                  <Button variant="primary" size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pb-4 pt-2">
          {currentUser ? (
            <>
              <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {userProfile?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                  </div>
                  <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                    loading={notificationsLoading}
                  />
                </div>
              </div>

              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-1',
                    isActive(to)
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 w-full text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" fullWidth>Log in</Button>
              </Link>
              <Link to={ROUTES.SIGNUP} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;