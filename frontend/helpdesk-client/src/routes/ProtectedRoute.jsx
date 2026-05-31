import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    allowedRoles?.length &&
    !allowedRoles.some((role) => user.roles?.includes(role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
