"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
};

type AvailabilityBlock = {
  day: number; // 0=Sun..6=Sat
  startMin: number;
  endMin: number;
};

type Club = {
  _id: string;
  name: string;
  description?: string;
};

type MyClubItem = {
  role: "admin" | "member";
  availability: AvailabilityBlock[];
  club: Club;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minToTime(min: number) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function blockLabel(b: AvailabilityBlock) {
  const day = dayNames[b.day] ?? `Day${b.day}`;
  return `${day} ${minToTime(b.startMin)}–${minToTime(b.endMin)}`;
}

export default function CalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clubs, setClubs] = useState<MyClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const totalBlocks = useMemo(
    () => clubs.reduce((sum, c) => sum + (c.availability?.length ?? 0), 0),
    [clubs]
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // 1) Who am I?
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) {
          setUser(null);
          setClubs([]);
          setErr("You’re not logged in. Log in to see your calendar.");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        // 2) My clubs (and availability per club)
        const clubsRes = await fetch("/api/my/clubs", { credentials: "include" });
        if (!clubsRes.ok) {
          const txt = await clubsRes.text();
          throw new Error(txt || "Failed to load clubs");
        }
        const clubsData: MyClubItem[] = await clubsRes.json();
        setClubs(clubsData);
      } catch (e: any) {
        setErr(e?.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Calendar</h1>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Availability and club scheduling hub (events coming next).
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard" style={{ textDecoration: "underline" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12
        }}
      >
        {loading ? (
          <p style={{ margin: 0 }}>Loading…</p>
        ) : err ? (
          <div>
            <p style={{ margin: 0 }}>{err}</p>
            <p style={{ marginTop: 10, opacity: 0.75 }}>
              Tip: log in first, then refresh this page.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ opacity: 0.75 }}>{user?.email}</div>
              <div style={{ opacity: 0.75 }}>{user?.school}</div>
            </div>

            <div style={{ marginLeft: "auto" }}>
              <div style={{ fontWeight: 600 }}>Summary</div>
              <div style={{ opacity: 0.75 }}>{clubs.length} club(s)</div>
              <div style={{ opacity: 0.75 }}>{totalBlocks} availability block(s)</div>
            </div>
          </div>
        )}
      </div>

      {!loading && !err && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Your Clubs & Availability</h2>

          {clubs.length === 0 ? (
            <p style={{ opacity: 0.8 }}>
              You’re not in any clubs yet. Join one from “Explore Clubs”.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {clubs.map((c) => (
                <div
                  key={c.club._id}
                  style={{
                    padding: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 12
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.club.name}</div>
                      <div style={{ opacity: 0.75 }}>{c.club.description || "No description"}</div>
                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7 }}>
                        Role: <b>{c.role}</b>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>Availability</div>
                      <div style={{ opacity: 0.75 }}>{c.availability.length} block(s)</div>
                      <div style={{ marginTop: 8 }}>
                        <Link
                          href={`/clubs/${c.club._id}`}
                          style={{ textDecoration: "underline" }}
                        >
                          View club
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {c.availability.length === 0 ? (
                      <span style={{ opacity: 0.7 }}>No availability set yet.</span>
                    ) : (
                      c.availability.map((b, idx) => (
                        <span
                          key={`${c.club._id}-${idx}`}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(0,0,0,0.14)",
                            fontSize: 13
                          }}
                        >
                          {blockLabel(b)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 22, padding: 14, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
        <div style={{ fontWeight: 700 }}>Next up</div>
        <ul style={{ marginTop: 8 }}>
          <li>Polls: admin creates, members respond, closesAt enforced</li>
          <li>Recommendations: compute best times from YES + availability</li>
          <li>Events: create + RSVP + “Add to Google Calendar” link</li>
        </ul>
      </div>
    </div>
  );
}
