import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

/**
 * AdminProtectedRoute — Guards admin routes against unauthorized access.
 * Uses reactive AdminAuthContext state.
 */
const AdminProtectedRoute = ({ children }) => {
  const { adminToken } = useAdminAuth();
  const location = useLocation();

  if (!adminToken) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
