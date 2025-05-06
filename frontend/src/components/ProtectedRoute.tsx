import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, hasRole, getCurrentUser } from "@/utils/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) => {
  const location = useLocation();
  const isLoggedIn = isAuthenticated();
  const user = getCurrentUser();

  if (!isLoggedIn) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    // Redirect to dashboard if authenticated but doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
