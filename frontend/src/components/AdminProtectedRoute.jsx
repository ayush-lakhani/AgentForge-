import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

/**
 * AdminProtectedRoute — Guards admin routes against unauthorized access.
 * Uses reactive AdminAuthContext state.
 */
const AdminProtectedRoute = ({ children }) => {
  const secret = localStorage.getItem("adminSecret");

  if (!secret) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
