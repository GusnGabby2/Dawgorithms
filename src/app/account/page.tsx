"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
    firstName: string;
    lastName: string;
    email: string;
    school: string;
}

type ApiError = { error?: string; message?: string };

const SCHOOLS = [
  "University of Georgia",
  "Georgia Institute of Technology",
  "Emory University",
  "Other"
] as const;

export default function AccountPage() {
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [school, setSchool] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const newPasswordOk = useMemo(() => newPassword.length >= 8, [newPassword]);

  async function loadMe() {
    setMsg(null);
    setLoading(true);

    const res = await fetch("/api/me", { credentials: "include" });

    if (res.status === 401) {
      router.push("/login?next=/dashboard/account");
      return;
    }

    if (!res.ok) {
      setMsg("Failed to load account.");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as User;
    setMe(data);

    // prefill profile form
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setSchool(data.school);

    setLoading(false);
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!firstName.trim() || !lastName.trim() || !school) {
      setMsg("Please complete your profile fields.");
      return;
    }

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ firstName, lastName, school }),
    });

    if (!res.ok) {
      const data: ApiError = await res.json().catch(() => ({}));
      setMsg(data.error || data.message || "Failed to save profile.");
      return;
    }

    const updated = (await res.json()) as User;
    setMe(updated);
    setMsg("✅ Profile updated.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!currentPassword || !newPassword || !confirmNew) {
      setMsg("Fill out all password fields.");
      return;
    }
    if (!newPasswordOk) {
      setMsg("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNew) {
      setMsg("New passwords do not match.");
      return;
    }

    const res = await fetch("/api/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data: ApiError = await res.json().catch(() => ({}));
      setMsg(data.error || data.message || "Failed to change password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNew("");
    setMsg("✅ Password changed.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  }

  if (loading) return <div style={{ opacity: 0.75 }}>Loading account…</div>;
  if (!me) return <div>Not signed in.</div>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Account</h1>

      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Signed in as</div>
        <div><b>{me.email}</b></div>
        <div style={{ opacity: 0.8 }}>{me.firstName} {me.lastName} • {me.school}</div>

        <button onClick={logout} style={{ ...button, marginTop: 12 }}>
          Logout
        </button>
      </div>

      <form onSubmit={saveProfile} style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Edit profile</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={input} />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={input} />
        </div>

        <select value={school} onChange={(e) => setSchool(e.target.value)} style={{ ...input, marginTop: 12 }} required>
          <option value="" disabled>Select your school…</option>
          {SCHOOLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button type="submit" style={{ ...button, marginTop: 12 }}>
          Save profile
        </button>
      </form>

      <form onSubmit={changePassword} style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Change password</div>

        <input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          type="password"
          placeholder="Current password"
          style={input}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
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

        <button type="submit" style={{ ...button, marginTop: 12 }}>
          Change password
        </button>
      </form>

      {msg && <div style={{ fontSize: 14 }}>{msg}</div>}
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 14,
};

const input: React.CSSProperties = {
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 10,
};

const button: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 800,
  cursor: "pointer",
  background: "transparent",
};