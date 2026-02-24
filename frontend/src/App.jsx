import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
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
import { AdminAuthProvider } from "./context/AdminAuthContext";

import { useAuth as useAuthHook } from "./hooks/useAuth";

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Navbar wrapper to exclude admin routes
function NavbarWrapper({ darkMode, toggleDarkMode }) {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show navbar on admin routes
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (!user || isAdminRoute) {
    return null;
  }

  return <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}

function App() {
  const auth = useAuthHook();
  const { user } = auth;
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

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-950 dark:to-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={auth}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
            {/* Arc Sweep Animation Overlay */}
            {isAnimating && (
              <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
                {/* Animated Arc Path Sweep */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    {/* Gradient for the arc */}
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

                    {/* Clip path for animation */}
                    <clipPath id="arcClip">
                      <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        className={`transition-transform duration-600 ease-out ${
                          isAnimating ? "translate-x-0" : "-translate-x-full"
                        }`}
                      />
                    </clipPath>
                  </defs>

                  {/* The Arc Path - Curved from top-left to bottom-right */}
                  <path
                    d="M 0,0 Q 50,30 100,100"
                    stroke="url(#arcGradient)"
                    strokeWidth="150"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    className={`transition-all duration-600 ease-out ${
                      isAnimating ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      strokeDasharray: "200",
                      strokeDashoffset: isAnimating ? "0" : "200",
                      transition:
                        "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />

                  {/* Fill effect that follows the arc */}
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill={darkMode ? "rgb(17, 24, 39)" : "rgb(255, 255, 255)"}
                    className="transition-opacity duration-600"
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
                      opacity: isAnimating ? 0.9 : 0,
                      transform: isAnimating
                        ? "translate(0, 0)"
                        : "translate(-100%, -100%)",
                      transition:
                        "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-out",
                    }}
                  />
                </svg>
              </div>
            )}

            {/* Navbar - Shows on user pages only (not admin routes) */}
            <NavbarWrapper
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: darkMode ? "#1f2937" : "#fff",
                  color: darkMode ? "#fff" : "#1f2937",
                },
                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "#fff",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />

            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" /> : <Login />}
              />
              <Route
                path="/signup"
                element={user ? <Navigate to="/dashboard" /> : <Signup />}
              />
              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/planner"
                element={user ? <StrategicPlanner /> : <Navigate to="/login" />}
              />
              <Route path="/generate" element={<Navigate to="/planner" />} />
              <Route path="/strategy" element={<Navigate to="/planner" />} />
              <Route
                path="/history"
                element={user ? <History /> : <Navigate to="/login" />}
              />
              <Route
                path="/upgrade"
                element={user ? <Upgrade /> : <Navigate to="/login" />}
              />
              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/login" />}
              />
              <Route
                path="/blueprint/:strategyId"
                element={
                  user ? <TacticalBlueprint /> : <Navigate to="/login" />
                }
              />
              {/* Admin Panel Routes — wrapped in AdminAuthProvider for JWT context */}
              <Route
                path="/admin-login"
                element={
                  <AdminAuthProvider>
                    {localStorage.getItem("admin_token") ? (
                      <Navigate to="/admin" />
                    ) : (
                      <AdminLogin />
                    )}
                  </AdminAuthProvider>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminAuthProvider>
                    {localStorage.getItem("admin_token") ? (
                      <AdminDashboard />
                    ) : (
                      <Navigate to="/admin-login" />
                    )}
                  </AdminAuthProvider>
                }
              />
              <Route
                path="/"
                element={<Navigate to={user ? "/dashboard" : "/login"} />}
              />
            </Routes>
          </div>
        </Router>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
