import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userRegister } from "../../api/authAPI";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await userRegister({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
      });
      nav("/login", { replace: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const msg =
        e?.response?.data && Array.isArray(e.response.data)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            e.response.data.map((x: any) => x.description || x.code).join("\n")
          : e?.response?.data ?? "Registration failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto" }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <label>First Name</label>
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />

        <label>Last Name</label>
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />

        <label>Phone</label>
        <input
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />

        <label>Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p>
        Already got an account? <Link to="/login">Logg inn</Link>
      </p>
    </main>
  );
}
