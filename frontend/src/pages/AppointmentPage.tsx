import { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook

const NOUPE_EMBED_SRC =
  "https://www.noupe.com/embed/0199e9614c507f129e417decb705b0c02814.js";

function useNoupeEmbed() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (document.getElementById("noupe-embed")) return;

    const script = document.createElement("script");
    script.id = "noupe-embed";
    script.src = NOUPE_EMBED_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("error", (event) => {
      console.error("Kunne ikke laste Noupe embed", event);
    });
    document.body.appendChild(script);
  }, []);
}

export default function AppointmentPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  useNoupeEmbed();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Mine timer</h1>
      <p className="text-sm opacity-80 mb-4">
        Kommer snart – bruk chatten under for å bestille, flytte eller
        avbestille time.
      </p>

      <div className="rounded-2xl border p-4 shadow-sm">
        <noscript>Aktiver JavaScript for å bruke chatten.</noscript>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
      >
        Logg ut
      </button>
    </main>
  );
}
