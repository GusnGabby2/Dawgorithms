"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
};

type ExploreClub = {
  _id: string;
  name: string;
  description?: string;
  school?: string;
  memberCount: number;
  isMember: boolean;
  myRole: "admin" | "member" | null;
};

type ExploreResponse = {
  clubs: ExploreClub[];
};

export default function ExploreClubsPage() {
  const [me, setMe] = useState<User | null>(null);
  const [clubs, setClubs] = useState<ExploreClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadClubs(school: string) {
    const params = school ? `?school=${encodeURIComponent(school)}` : "";
    const res = await fetch(apiUrl(`/clubs/explore${params}`), { credentials: "include" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to load clubs.");
    }
    const data: ExploreResponse = await res.json();
    setClubs(data.clubs);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      setMsg(null);

      try {
        const meRes = await fetch(apiUrl("/auth/me"), { credentials: "include" });
        if (!meRes.ok) {
          setErr("You’re not logged in. Log in to explore clubs.");
          setMe(null);
          setClubs([]);
          return;
        }
        const meData = await meRes.json();
        setMe(meData.user);
        const school = String(meData.user?.school ?? "").trim();
        setSchoolFilter(school);
        await loadClubs(school);
      } catch (e: any) {
        setErr(e?.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function applyFilter() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      await loadClubs(schoolFilter.trim());
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function joinClub(clubId: string) {
    setJoiningId(clubId);
    setMsg(null);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/join`), {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to join club.");
      }
      await loadClubs(schoolFilter.trim());
      setMsg("Joined club successfully.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to join club.");
    } finally {
      setJoiningId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter((c) => {
      const text = `${c.name} ${c.description ?? ""} ${c.school ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [clubs, query]);

  return (
    <main className="explorePage">
      <Navbar />

      <header className="exploreHero">
        <div className="exploreHeroCopy">
          <div className="exploreKicker">Explore Clubs</div>
          <h1 className="exploreTitle">Find your people</h1>
          <p className="exploreSubtitle">
            Browse clubs at your school, check popularity, and join instantly.
          </p>
        </div>
      </header>

      <section className="exploreControls">
        <div className="exploreField">
          <label className="exploreLabel">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs by name or description"
            className="exploreInput"
          />
        </div>

        <div className="exploreField">
          <label className="exploreLabel">School</label>
          <div className="exploreInline">
            <input
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              placeholder="Filter by school"
              className="exploreInput"
            />
            <button className="exploreButtonPrimary" onClick={applyFilter} disabled={loading}>
              Apply
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="exploreStatusCard">Loading clubs…</div>
      ) : err ? (
        <div className="exploreStatusCard">{err}</div>
      ) : (
        <section className="exploreGrid">
          {filtered.length === 0 ? (
            <div className="exploreStatusCard">No clubs found.</div>
          ) : (
            filtered.map((club) => (
              <article key={club._id} className="exploreCard">
                <div className="exploreCardHeader">
                  <div>
                    <div className="exploreCardTitle">{club.name}</div>
                    <div className="exploreCardSub">{club.description || "No description yet."}</div>
                  </div>
                  <div className="explorePill">
                    {club.memberCount} member{club.memberCount === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="exploreTags">
                  {club.school && <span className="exploreTag">{club.school}</span>}
                  {club.isMember ? (
                    <span className="exploreTagStrong">Joined • {club.myRole ?? "member"}</span>
                  ) : (
                    <span className="exploreTagMuted">Not a member</span>
                  )}
                </div>

                <div className="exploreActions">
                  <button
                    className={club.isMember ? "exploreButtonDisabled" : "exploreButtonPrimary"}
                    onClick={() => joinClub(club._id)}
                    disabled={club.isMember || joiningId === club._id}
                  >
                    {club.isMember ? "Joined" : joiningId === club._id ? "Joining..." : "Join"}
                  </button>
                  <Link href={`/clubs/${club._id}`} className="exploreGhostButton">
                    View club
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {msg && <div className="exploreMessage">{msg}</div>}

      {me && !err && (
        <div className="exploreFooterNote">
          Showing clubs for <b>{schoolFilter || me.school}</b>.
        </div>
      )}

      <footer className="exploreFooterCta">
        <span>Don&apos;t see your club?</span>
        <Link href="/clubs/new" className="exploreFooterLink">
          Click here to create one
        </Link>
      </footer>
    </main>
  );
}
