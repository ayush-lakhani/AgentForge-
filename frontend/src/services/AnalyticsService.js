/**
 * AnalyticsService — fetches /api/admin/analytics
 */
import { adminAxios } from "../context/AdminAuthContext";

class AnalyticsServiceClass {
  async getAnalytics() {
    const res = await adminAxios.get("/api/admin/analytics");
    return res.data;
  }

  async getUsers(params = {}) {
    const res = await adminAxios.get("/api/admin/users", { params });
    return res.data;
  }

  async getAdminLogs(limit = 100) {
    const res = await adminAxios.get("/api/admin/logs", { params: { limit } });
    return res.data;
  }

  getExportUrl() {
    const token = localStorage.getItem("admin_token");
    return `/api/admin/users/export?token=${token}`;
  }

  async exportCSV() {
    const res = await adminAxios.get("/api/admin/users/export", {
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
}

export const AnalyticsService = new AnalyticsServiceClass();
