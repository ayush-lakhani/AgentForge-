/**
 * AnalyticsService — fetches /api/admin/analytics
 */
import { adminAPI } from "../api/adminAPI";

class AnalyticsServiceClass {
  async getAnalytics() {
    const res = await adminAPI.get("/api/admin/analytics");
    return res.data;
  }

  async getUsers(params = {}) {
    const res = await adminAPI.get("/api/admin/users", { params });
    return res.data;
  }

  async getAdminLogs(limit = 100) {
    const res = await adminAPI.get("/api/admin/logs", { params: { limit } });
    return res.data;
  }

  getExportUrl() {
    const secret = localStorage.getItem("adminSecret");
    return `/api/admin/users/export?secret=${secret}`;
  }

  async exportCSV() {
    const res = await adminAPI.get("/api/admin/users/export", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planvix_users_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // User-specific analytics (Intelligence)
  async getUserAnalytics() {
    const res = await fetch("/api/analytics/profile", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch intelligence data");
    return await res.json();
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
