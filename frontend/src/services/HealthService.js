/**
 * HealthService — fetches /api/admin/health
 */
import { adminAxios } from "../context/AdminAuthContext";

class HealthServiceClass {
  async getHealth() {
    const res = await adminAxios.get("/api/admin/health");
    return res.data;
  }
}

export const HealthService = new HealthServiceClass();
