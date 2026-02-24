import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import StrategicPlanner from "./components/StrategicPlanner";
import History from "./components/History";
import Navbar from "./components/Navbar";
import Upgrade from "./pages/Upgrade";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TacticalBlueprint from "./pages/TacticalBlueprint";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Navbar wrapper to exclude admin routes
function NavbarWrapper({ darkMode, toggleDarkMode }) {
  const location = useLocation();
  const { token, user } = useAuth();

  // Don't show navbar on admin routes
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (!token || !user || isAdminRoute) {
    return null;
  }

  return <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}

// Separate component for App content to access context
function AppContent() {
  const { user, loading } = useAuth();
  const { adminToken } = useAdminAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setDarkMode(!darkMode);
      setTimeout(() => setIsAnimating(false), 600);
    }, 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Search for "Arc Sweep Animation Overlay" if missing */}
      {isAnimating && (
        <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="arcGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={
                    darkMode ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)"
                  }
                  stopOpacity="0"
                />
                <stop
                  offset="50%"
                  stopColor={
                    darkMode ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)"
                  }
                  stopOpacity="0.8"
                />
                <stop
                  offset="100%"
                  stopColor={
                    darkMode ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)"
                  }
                  stopOpacity="1"
                />
              </linearGradient>
            </defs>
            <path
              d="M 0,0 Q 50,30 100,100"
              stroke="url(#arcGradient)"
              strokeWidth="150"
              fill="none"
              vectorEffect="non-scaling-stroke"
              className={`transition-all duration-600 ease-out ${isAnimating ? "opacity-100" : "opacity-0"}`}
              style={{
                strokeDasharray: "200",
                strokeDashoffset: isAnimating ? "0" : "200",
              }}
            />
          </svg>
        </div>
      )}

      <NavbarWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Toaster position="top-right" />

      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* Protected User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner"
          element={
            <ProtectedRoute>
              <StrategicPlanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upgrade"
          element={
            <ProtectedRoute>
              <Upgrade />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blueprint/:strategyId"
          element={
            <ProtectedRoute>
              <TacticalBlueprint />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-login"
          element={adminToken ? <Navigate to="/admin" /> : <AdminLogin />}
        />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* Fallbacks */}
        <Route path="/generate" element={<Navigate to="/planner" />} />
        <Route path="/strategy" element={<Navigate to="/planner" />} />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
