import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "../api/token";
import type { JSX } from "react";

type JwtPayload = {
  role?: string | string[];
  roles?: string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string
    | string[];
  [key: string]: unknown;
};

type Props = {
  children: JSX.Element;
};

export default function AdminRoute({ children }: Props) {
  const token = tokenStorage.get();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);

    const rawRoles =
      decoded.roles ??
      decoded.role ??
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    let roles: string[] = [];
    if (Array.isArray(rawRoles)) roles = rawRoles.map(String);
    else if (typeof rawRoles === "string") roles = [rawRoles];

    const isAdmin = roles.includes("Admin") || roles.includes("Provider");

    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}
