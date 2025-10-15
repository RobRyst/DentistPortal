import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { tokenStorage } from "../../api/token";
import { userLogin } from "../../api/authAPI";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await userLogin(form);
      tokenStorage.set(res.data.token);

      Swal.fire({
        position: "center",
        icon: "success",
        title: "You successfully logged in",
        showConfirmButton: false,
        timer: 1200,
      });

      setTimeout(() => navigate("/", { replace: true }), 800);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Incorrect Email or Password",
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="block w-full rounded-xl border px-4 py-2.5 outline-none"
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
                className="block w-full rounded-xl border px-4 py-2.5 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
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
        </div>
      </div>
    </main>
  );
}
