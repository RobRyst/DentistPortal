import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { tokenStorage } from "../../api/token";
import { loginStart, verify2FA } from "../../api/authAPI";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  role?: string | string[];
  roles?: string[];
  [key: string]: any;
};

export default function LoginPage() {
  const [step, setStep] = useState<"creds" | "code">("creds");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [code, setCode] = useState("");

  const navigate = useNavigate();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const submitCreds = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await loginStart(form);
      setUserId(res.data.userId);
      setMaskedEmail(res.data.maskedEmail);
      setStep("code");
      Swal.fire({
        icon: "info",
        title: "Check your email",
        text: `We sent a 6-digit code to ${res.data.maskedEmail}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Incorrect email or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await verify2FA({ userId, code });
      const token = res.data.token;
      tokenStorage.set(token);

      let isAdmin = false;
      try {
        const decoded = jwtDecode<JwtPayload>(token);

        let roles: string[] = [];

        if (Array.isArray(decoded.roles)) {
          roles = decoded.roles;
        } else if (Array.isArray(decoded.role)) {
          roles = decoded.role;
        } else if (typeof decoded.role === "string") {
          roles = [decoded.role];
        }

        isAdmin = roles.includes("Admin") || roles.includes("Provider");
      } catch {
        isAdmin = false;
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Logged in",
        showConfirmButton: false,
        timer: 1200,
      });

      setTimeout(() => {
        if (isAdmin) navigate("/admin/slots", { replace: true });
        else navigate("/", { replace: true });
      }, 800);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Invalid code",
        text: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border p-6 sm:p-8 shadow-xl">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">Sign in</h1>
          </header>

          {step === "creds" ? (
            <form onSubmit={submitCreds} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="block w-full rounded-xl border px-4 py-2.5"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border px-4 py-2.5"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold"
                disabled={loading}
              >
                {loading ? "Checking..." : "Continue"}
              </button>

              <p className="text-center text-sm pt-2">
                Not signed up?{" "}
                <Link
                  to="/register"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <p className="text-sm text-center">
                Enter the 6-digit code sent to{" "}
                <span className="font-medium">{maskedEmail}</span>.
              </p>
              <div>
                <label htmlFor="code" className="mb-1 block text-sm">
                  Code
                </label>
                <input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="block w-full rounded-xl border px-4 py-2.5 tracking-widest text-center"
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
