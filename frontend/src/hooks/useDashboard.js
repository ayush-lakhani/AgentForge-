import { useState, useCallback } from "react";
import { adminApi } from "../api";

/**
 * Custom hook for admin dashboard operations
 */
export const useDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch dashboard statistics
   */
  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboardStats();
      setDashboardStats(data);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to fetch dashboard stats";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch users list
   */
  const fetchUsers = useCallback(async (search = "", limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers(search, limit);
      setUsers(data.users || []);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to fetch users";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch revenue breakdown
   */
  const fetchRevenueBreakdown = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getRevenueBreakdown();
      setRevenueBreakdown(data.industries || []);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to fetch revenue breakdown";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch recent activity
   */
  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getActivity();
      setActivity(data.activities || []);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to fetch activity";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch system alerts
   */
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAlerts();
      setAlerts(data.alerts || []);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to fetch alerts";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboardStats,
    users,
    revenueBreakdown,
    activity,
    alerts,
    loading,
    error,
    fetchDashboardStats,
    fetchUsers,
    fetchRevenueBreakdown,
    fetchActivity,
    fetchAlerts,
  };
};
