"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

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
  const [clubs, setClubs] = useState<MyClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // My clubs (and availability per club)
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
    <main className="explorePage">
      <Navbar />

      <section className="exploreHero">
        <div className="exploreHeroCopy">
          <div className="exploreKicker">Your Clubs</div>
          <h2 className="exploreTitle">Your Clubs & Availability</h2>
          <p className="exploreSubtitle">
            Manage your memberships and see all of your availability blocks.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="exploreStatusCard">Loading…</div>
      ) : err ? (
        <div className="exploreStatusCard">
          <div>{err}</div>
          <div style={{ marginTop: 8 }}>Tip: log in first, then refresh this page.</div>
        </div>
      ) : clubs.length === 0 ? (
        <div className="exploreStatusCard">
          You’re not in any clubs yet. Join one from “Explore Clubs”.
        </div>
      ) : (
        <section className="exploreGrid">
          {clubs.map((c) => (
            <article key={c.club._id} className="exploreCard">
              <div className="exploreCardHeader">
                <div>
                  <div className="exploreCardTitle">{c.club.name}</div>
                  <div className="exploreCardSub">{c.club.description || "No description"}</div>
                </div>
                <div className="explorePill">{c.availability.length} block(s)</div>
              </div>

              <div className="exploreTags">
                <span className="exploreTagStrong">Role • {c.role}</span>
                <Link href={`/clubs/${c.club._id}`} className="exploreGhostButton">
                  View club
                </Link>
              </div>

              <div className="exploreTags" style={{ marginTop: 12 }}>
                {c.availability.length === 0 ? (
                  <span className="exploreTagMuted">No availability set yet.</span>
                ) : (
                  c.availability.map((b, idx) => (
                    <span key={`${c.club._id}-${idx}`} className="exploreTagMuted">
                      {blockLabel(b)}
                    </span>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
