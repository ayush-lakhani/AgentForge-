import axios from "axios";

export const adminAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

adminAPI.interceptors.request.use((config) => {
  const secret = localStorage.getItem("adminSecret");
  if (secret) {
    config.headers["x-admin-secret"] = secret;
  }
  return config;
});
