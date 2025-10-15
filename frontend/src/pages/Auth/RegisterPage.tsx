import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userRegister } from "../../api/authAPI";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await userRegister({ email, password });
      nav("/login", { replace: true });
    } catch {
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto" }}>
      <h1>Registrer</h1>
      <form onSubmit={onSubmit}>
        <label>E-post</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label>Passord</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Oppretter..." : "Opprett konto"}
        </button>
      </form>
      <p>
        Har konto? <Link to="/login">Logg inn</Link>
      </p>
    </main>
  );
}
