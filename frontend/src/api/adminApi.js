import { adminClient, publicClient } from "./client";

/**
 * Admin API — Uses JWT authentication (Bearer token)
 */

export const adminApi = {
  /**
   * Login with admin secret → receive JWT
   */
  login: async (secret) => {
    const response = await publicClient.post("/api/admin/login", { secret });
    return response.data;
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    const response = await adminClient.get("/api/admin/dashboard");
    return response.data;
  },

  /**
   * Get users list with optional search
   */
  getUsers: async (search = "", limit = 20) => {
    const response = await adminClient.get("/api/admin/users", {
      params: { search, limit },
    });
    return response.data;
  },

  /**
   * Get revenue breakdown by industry
   */
  getRevenueBreakdown: async () => {
    const response = await adminClient.get("/api/admin/revenue-breakdown");
    return response.data;
  },

  /**
   * Get recent activity logs
   */
  getActivity: async () => {
    const response = await adminClient.get("/api/admin/activity");
    return response.data;
  },

  /**
   * Get system alerts
   */
  getAlerts: async () => {
    const response = await adminClient.get("/api/admin/alerts");
    return response.data;
  },
};
