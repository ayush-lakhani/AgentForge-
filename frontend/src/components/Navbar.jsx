import { Sparkles, Menu, User, LogOut, Home, Clock, Moon, Sun } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../App';
import { AgentDotsLogo, AgentDotsCompact } from './BrandLogo';



export default function Navbar({ darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/planner', label: 'Strategic Planner', icon: Sparkles },
    { path: '/history', label: 'History', icon: Clock },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* Logo - Desktop */}
          <Link to="/dashboard" className="hidden md:block">
            <AgentDotsLogo size="md" showSlogan={true} />
          </Link>

          {/* Logo - Mobile */}
          <Link to="/dashboard" className="md:hidden">
            <AgentDotsCompact />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
                    isActive(link.path)
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.email}
              </p>
              {user?.tier === 'pro' ? (
                <div className="flex items-center justify-end gap-1 text-xs font-bold text-green-600 dark:text-green-400">
                  <img src="/logo.svg" alt="Pro" className="w-4 h-4" style={{filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))'}} />
                  PRO
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Free Tier
                </p>
              )}
            </div>

            {/* Dropdown Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute top-14 right-4 glass-card p-2 w-48 shadow-xl animate-fade-in">
                {/* Mobile Nav Links */}
                <div className="md:hidden space-y-1 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isActive(link.path)
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* User Menu Items */}
                <button
                  onClick={() => {
                    toggleDarkMode();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close menu when clicking outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}
