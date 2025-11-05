import { useEffect, useState } from "react";
import axios from "axios";
import { env } from "../../api/Env";
import { tokenStorage } from "../../api/Token";
import { useNavigate } from "react-router-dom";

type MeResponse = { roles?: string[] };

export default function DashboardPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const token = tokenStorage.get();
        if (!token) {
          nav("/login", { replace: true });
          return;
        }

        const { data } = await axios.get<MeResponse>(
          `${env.API_BASE_URL}/api/users/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const ok = data.roles?.some(
          (role) => role === "Admin" || role === "Provider"
        );
        if (!ok) nav("/", { replace: true });
        else setAllowed(true);
      } catch {
        nav("/login", { replace: true });
      }
    };
    void run();
  }, [nav]);

  if (allowed === null) return null;
  return (
    <div>
      Admin / Provider dashboard
      <script src="https://www.noupe.com/embed/0199e9614c507f129e417decb705b0c02814.js"></script>
    </div>
  );
}
