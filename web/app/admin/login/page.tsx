"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Notice } from "@/components/design/commerce-ui";

export default function AdminLogin() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: String(fields.get("email") ?? ""), password: String(fields.get("password") ?? ""),
      });
      if (result.error) {
        setError("Invalid login credentials.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="admin-login">
    <section className="panel operations-card admin-login-card">
      <h1>Admin sign-in</h1>
      <p className="muted">Access inventory, orders and delivery settings.</p>
      <form onSubmit={handleLogin}>
        <label>Email<input name="email" className="store-input" type="email" autoComplete="username" required /></label>
        <div className="form-field">
          <label htmlFor="admin-password">Password</label>
          <span className="password-input">
            <input id="admin-password" name="password" className="store-input" type={visible ? "text" : "password"} autoComplete="current-password" required />
            <button type="button" className="icon-button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)}>
              {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
            </button>
          </span>
        </div>
        {error && <Notice tone="critical">{error}</Notice>}
        <button type="submit" className="shop-button primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </section>
  </main>;
}
