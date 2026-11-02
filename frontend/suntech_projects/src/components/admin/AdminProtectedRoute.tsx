/**
 * Route guard for every /admin surface.
 *
 * Signed-out operators are redirected to /admin/login with the intended
 * destination carried in location state so login can send them back.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAdminAuth } from "../../auth/useAdminAuth";

export function AdminProtectedRoute() {
  const auth = useAdminAuth();
  const location = useLocation();

  if (auth.status === "signed-out") {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
}
