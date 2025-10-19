import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { tokenStorage } from "../api/token";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(
    Boolean(tokenStorage.get())
  );
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const logout = () => {
    tokenStorage.clear();
    setIsAuthed(false);
    nav("/login", { replace: true });
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setIsAuthed(Boolean(tokenStorage.get()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

          <div className="hidden md:flex items-center gap-2">
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

          <button
            className="md:hidden inline-flex items-center rounded-md border px-3 py-2 text-sm"
            onClick={() => setOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            Meny
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-1">
            <NavLink
              to="/behandlinger"
              className={({ isActive }) =>
                `block ${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Behandlinger
            </NavLink>
            <NavLink
              to="/book"
              className={({ isActive }) =>
                `block ${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Bestill time
            </NavLink>

            {!isAuthed ? (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `block ${linkBase} ${isActive ? linkActive : "text-blue-600"}`
                }
              >
                Logg inn
              </NavLink>
            ) : (
              <button
                onClick={logout}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700"
              >
                Logg ut
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
