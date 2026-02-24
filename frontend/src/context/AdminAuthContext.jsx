/**
 * AdminAuthContext — Centralized admin authentication state
 * Stores JWT token, provides login/logout, Axios interceptor attaches Bearer header
 */
import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const AdminAuthContext = createContext(null);

// Axios instance for admin endpoints
export const adminAxios = axios.create({
  baseURL: "",
  timeout: 30000,
});

// Attach token to every request
adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AdminAuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() =>
    localStorage.getItem("admin_token"),
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const adminLogin = useCallback(async (secret) => {
    const res = await axios.post("/api/admin/login", { secret });
    const token = res.data.access_token;
    localStorage.setItem("admin_token", token);
    setAdminToken(token);
    return token;
  }, []);

  const adminLogout = useCallback(() => {
    setIsLoggingOut(true);
    localStorage.removeItem("admin_token");
    setAdminToken(null);
    setTimeout(() => {
      window.location.href = "/admin-login";
    }, 300);
  }, []);

  // Auto-logout on 401
  adminAxios.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401 && adminToken) {
        adminLogout();
      }
      return Promise.reject(error);
    },
  );

  return (
    <AdminAuthContext.Provider
      value={{ adminToken, adminLogin, adminLogout, isLoggingOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
};
