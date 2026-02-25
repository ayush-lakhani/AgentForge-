import {
  Sparkles,
  Menu,
  User,
  LogOut,
  Home,
  Clock,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import logoHorizontal from "../assets/branding/logo-horizontal.svg";

export default function Navbar({ darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/planner", label: "Strategic Planner", icon: Sparkles },
    { path: "/history", label: "History", icon: Clock },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all h-14 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between w-full">
          {/* Logo - Desktop */}
          <Link
            to="/dashboard"
            className="hidden md:block hover:opacity-80 transition-opacity"
          >
            <img
              src={logoHorizontal}
              alt="Planvix Logo"
              className="h-6 w-auto object-contain"
              style={{
                filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.2))",
              }}
            />
          </Link>

          {/* Logo - Mobile */}
          <Link to="/dashboard" className="md:hidden">
            <img
              src={logoHorizontal}
              alt="Planvix"
              className="h-5 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                    isActive(link.path)
                      ? "bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md scale-105"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* User Info */}
            <div className="hidden sm:block text-right">
              <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
                {user?.email}
              </p>
              {user?.tier === "pro" ? (
                <div className="flex items-center justify-end gap-1 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  PRO PLAN
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-tighter">
                  Free Access
                </p>
              )}
            </div>

            {/* Dropdown Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-800"
            >
              <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute top-12 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-gray-200 dark:border-slate-800 p-1.5 w-48 shadow-2xl rounded-xl animate-fade-in z-50">
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
                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  {darkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  {darkMode ? "Light Mode" : "Dark Mode"}
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
