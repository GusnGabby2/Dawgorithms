"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

type User = {
  firstName: string;
  lastName: string;
  email: string;
  school: string;
};

type ApiError = { error?: string; message?: string };

export default function AccountPage() {
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const newPasswordOk = useMemo(() => newPassword.length >= 8, [newPassword]);

  async function loadMe() {
    setMsg(null);
    setMsgType(null);
    setLoading(true);

    const res = await fetch(apiUrl("/auth/me"), { credentials: "include" });

    if (res.status === 401) {
      router.push("/?next=/account");
      return;
    }

    if (!res.ok) {
      setMsg("Failed to load account.");
      setMsgType("error");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as { user?: User };
    setMe(data.user ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setMsgType(null);

    if (!currentPassword || !newPassword || !confirmNew) {
      setMsg("Fill out all password fields.");
      setMsgType("error");
      return;
    }
    if (!newPasswordOk) {
      setMsg("New password must be at least 8 characters.");
      setMsgType("error");
      return;
    }
    if (newPassword !== confirmNew) {
      setMsg("New passwords do not match.");
      setMsgType("error");
      return;
    }

    const res = await fetch(apiUrl("/account/password"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data: ApiError = await res.json().catch(() => ({}));
      setMsg(data.error || data.message || "Failed to change password.");
      setMsgType("error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNew("");
    setMsg("Password updated successfully.");
    setMsgType("success");
  }

  async function logout() {
    await fetch(apiUrl("/auth/logout"), { method: "POST", credentials: "include" });
    router.push("/");
  }

  if (loading) return <div style={{ opacity: 0.75 }}>Loading account…</div>;
  if (!me) return <div>Not signed in.</div>;

  return (
    <main style={page}>
      <header style={header}>
        <div>
          <div style={kicker}>Account</div>
          <h1 style={title}>{me.firstName} {me.lastName}</h1>
          <div style={subtle}>{me.email} • {me.school}</div>
        </div>
        <button onClick={logout} style={buttonPrimary}>Log out</button>
      </header>

      <section style={grid}>
        <div style={card}>
          <div style={cardTitle}>Security</div>
          <div style={cardSub}>Change your password. Minimum 8 characters.</div>

          <form onSubmit={changePassword} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Current password"
              style={input}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="New password"
                style={input}
              />
              <input
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                type="password"
                placeholder="Confirm new password"
                style={input}
              />
            </div>
            <button type="submit" style={buttonSecondary}>Update password</button>
          </form>
        </div>

        <div style={card}>
          <div style={cardTitle}>Profile</div>
          <div style={cardSub}>
          </div>
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <div style={profileRow}>
              <span style={profileLabel}>Name</span>
              <span style={profileValue}>{me.firstName} {me.lastName}</span>
            </div>
            <div style={profileRow}>
              <span style={profileLabel}>Email</span>
              <span style={profileValue}>{me.email}</span>
            </div>
            <div style={profileRow}>
              <span style={profileLabel}>School</span>
              <span style={profileValue}>{me.school}</span>
            </div>
          </div>
        </div>
      </section>

      {msg && <div style={msgType === "success" ? messageSuccess : messageError}>{msg}</div>}
    </main>
  );
}

const page: React.CSSProperties = {
  padding: 24,
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: 18,
  borderRadius: 16,
  background: "linear-gradient(120deg, #f8fafc, #eef2ff)",
  border: "1px solid #e5e7eb",
};

const kicker: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontWeight: 700,
  color: "#475569",
};

const title: React.CSSProperties = {
  margin: "6px 0 4px",
  fontSize: 28,
  fontWeight: 900,
};

const subtle: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 14,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: 18,
};

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#fff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

const cardTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
};

const cardSub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  color: "#64748b",
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 14,
  color: "#0f172a",
};

const buttonPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #1f2937",
  fontWeight: 800,
  cursor: "pointer",
  background: "#0f172a",
  color: "#fff",
};

const buttonSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #1f2937",
  fontWeight: 800,
  cursor: "pointer",
  background: "transparent",
};

const profileRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const profileLabel: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#64748b",
  fontWeight: 700,
};

const profileValue: React.CSSProperties = {
  fontWeight: 700,
};

const messageBase: React.CSSProperties = {
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid",
  width: "fit-content",
};

const messageSuccess: React.CSSProperties = {
  ...messageBase,
  color: "#166534",
  background: "#f0fdf4",
  borderColor: "#bbf7d0",
};

const messageError: React.CSSProperties = {
  ...messageBase,
  color: "#991b1b",
  background: "#fef2f2",
  borderColor: "#fecaca",
};
