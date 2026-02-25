import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Public Client (No Auth)
export const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authenticated Client (JWT — User Auth)
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add user JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for 401 handling (user auth)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired or invalid. Redirecting to login...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Admin Client (JWT — Admin Auth)
export const adminClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add admin secret header (header-based auth)
adminClient.interceptors.request.use(
  (config) => {
    const adminSecret = localStorage.getItem("adminSecret");
    if (adminSecret) {
      config.headers["x-admin-secret"] = adminSecret;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for 401/403 handling (admin auth)
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn(
        "⚠️ Admin token expired or invalid. Redirecting to admin login...",
      );

      localStorage.removeItem("admin_token");

      if (!window.location.pathname.includes("/admin-login")) {
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(error);
  },
);
