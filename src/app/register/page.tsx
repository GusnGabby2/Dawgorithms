"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

type ApiError = { error?: string; message?: string };

const SCHOOLS = [
  "University of Georgia",
  "Georgia Institute of Technology",
  "Emory University",
  "Other"
] as const;

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const passwordOk = useMemo(() => password.length >= 8, [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setMsg("Please fill out all fields.");
      return;
    }

    if (!school) {
      setMsg("Please select your school.");
      return;
    }

    if (!passwordOk) {
      setMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/auth/register"), {        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          school,
          password,
        }),
      });

      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Registration failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setMsg(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Register</h1>

      <form onSubmit={onSubmit} style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            style={inputStyle}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="min 8 characters"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Confirm</span>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="repeat password"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>School / University</span>
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="" disabled>
              Select your school...
            </option>
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        {msg && <div style={{ fontSize: 14 }}>{msg}</div>}

        <div style={{ fontSize: 14, opacity: 0.85 }}>
          Already have an account?{" "}
          <a href="/" style={{ textDecoration: "underline" }}>
            Log in
          </a>
        </div>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 10,
};

const buttonStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 700,
  cursor: "pointer",
};
