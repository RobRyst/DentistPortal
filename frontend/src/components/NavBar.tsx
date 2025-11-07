import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { tokenStorage } from "../api/Token";
import NotificationBell from "./NotificationBell";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  role?: string | string[];
  roles?: string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string
    | string[];
  [key: string]: unknown;
};

export default function NavBar() {
  const [isAuthed, setIsAuthed] = useState<boolean>(
    Boolean(tokenStorage.get())
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const nav = useNavigate();

  useEffect(() => {
    const checkRole = () => {
      const token = tokenStorage.get();
      if (!token) {
        setIsAuthed(false);
        setIsAdmin(false);
        return;
      }

      setIsAuthed(true);

      try {
        const decoded = jwtDecode<JwtPayload>(token);

        const rawRoles =
          decoded.roles ??
          decoded.role ??
          decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ];

        let roles: string[] = [];

        if (Array.isArray(rawRoles)) {
          roles = rawRoles.map(String);
        } else if (typeof rawRoles === "string") {
          roles = [rawRoles];
        }

        setIsAdmin(roles.includes("Admin") || roles.includes("Provider"));
      } catch {
        setIsAdmin(false);
      }
    };

    checkRole();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "token") checkRole();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    tokenStorage.clear();
    setIsAuthed(false);
    setIsAdmin(false);
    nav("/login", { replace: true });
  };

  const linkBase = "px-3 py-2 rounded-md text-sm font-medium hover:bg-zinc-100";
  const linkActive = "bg-zinc-100";
  const linkInactive = "text-zinc-700";

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="font-semibold text-lg">
            RystDental
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <NavLink
              to="/treatments"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Treatments
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin/slots"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                Admin
              </NavLink>
            )}

            <NavLink
              to="/kontakt"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Contact
            </NavLink>

            {!isAuthed ? (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "text-blue-600"}`
                }
              >
                Log in
              </NavLink>
            ) : (
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
