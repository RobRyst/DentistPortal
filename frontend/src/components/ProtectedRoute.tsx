import { Navigate } from "react-router-dom";
import { tokenStorage } from "../api/Token";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const authed = !!tokenStorage.get();
  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
