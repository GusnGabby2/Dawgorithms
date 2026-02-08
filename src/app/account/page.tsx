"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import Navbar from "@/components/Navbar";

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

  if (loading) return <div className="accountLoading">Loading account…</div>;
  if (!me) return <div className="accountEmpty">Not signed in.</div>;

  return (
    <main className="accountPage">
      <Navbar />
      <header className="accountHeader">
        <div className="accountHeaderCopy">
          <div className="accountKicker">Account</div>
          <h1 className="accountTitle">{me.firstName} {me.lastName}</h1>
          <div className="accountSubtle">{me.email} • {me.school}</div>
        </div>
        <button onClick={logout} className="accountButtonPrimary">Log out</button>
      </header>

      <section className="accountGrid">
        <div className="accountCard">
          <div className="accountCardTitle">Security</div>
          <div className="accountCardSub">Change your password. Minimum 8 characters.</div>

          <form onSubmit={changePassword} className="accountForm">
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Current password"
              className="accountInput"
            />
            <div className="accountInputRow">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="New password"
                className="accountInput"
              />
              <input
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                type="password"
                placeholder="Confirm new password"
                className="accountInput"
              />
            </div>
            <button type="submit" className="accountButtonSecondary">Update password</button>
          </form>
        </div>

        <div className="accountCard">
          <div className="accountCardTitle">Profile</div>
          <div className="accountCardSub"></div>
          <div className="accountProfileList">
            <div className="accountProfileRow">
              <span className="accountProfileLabel">Name</span>
              <span className="accountProfileValue">{me.firstName} {me.lastName}</span>
            </div>
            <div className="accountProfileRow">
              <span className="accountProfileLabel">Email</span>
              <span className="accountProfileValue">{me.email}</span>
            </div>
            <div className="accountProfileRow">
              <span className="accountProfileLabel">School</span>
              <span className="accountProfileValue">{me.school}</span>
            </div>
          </div>
        </div>
      </section>

      {msg && (
        <div className={msgType === "success" ? "accountMessage accountMessageSuccess" : "accountMessage accountMessageError"}>
          {msg}
        </div>
      )}
    </main>
  );
}
