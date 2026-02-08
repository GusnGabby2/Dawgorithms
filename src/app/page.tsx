"use client";
      
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import dawgorithm from "@/assets/dawgorithmslogo.png";

type ApiError = { error?: string; message?: string };

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!email.trim() || !password) {
      setMsg("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Login failed");
      }

      router.push(next);
    } catch (err: any) {
      setMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <div className="loginBrand">
        <Image
          src={dawgorithm}
          alt="Dawgorithms"
          width={400}
          height={150}
          priority
        />
      </div>

      <h1 className="loginTitle">Login</h1>

      <form onSubmit={onSubmit} className="loginForm">
        <label style={{ display: "grid", gap: 6 }}>
          <span className="loginLabel">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span className="loginLabel">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle} className="loginButton">
          {loading ? "Logging in..." : "Login"}
        </button>

        {msg && <div className="loginMessage">{msg}</div>}

        <div className="loginNote">
          Don’t have an account?{" "}
          <a href="/register" style={{ textDecoration: "underline" }}>
            Register
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
