import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { tokenStorage } from "../api/token";

export default function NavBar() {
  const [isAuthed, setIsAuthed] = useState<boolean>(
    Boolean(tokenStorage.get())
  );
  const nav = useNavigate();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "token") setIsAuthed(Boolean(tokenStorage.get()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    tokenStorage.clear();
    setIsAuthed(false);
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
            RystDentist
          </Link>

          <div className="flex items-center gap-2">
            <NavLink
              to="/behandlinger"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Behandlinger
            </NavLink>
            <NavLink
              to="/book"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Bestill time
            </NavLink>

            {!isAuthed ? (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "text-blue-600"}`
                }
              >
                Logg inn
              </NavLink>
            ) : (
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700"
              >
                Logg ut
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
