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
    <main style={page}>
      <Navbar />

      <header style={hero}>
        <div>
          <div style={kicker}>Explore Clubs</div>
          <h1 style={title}>Find your people</h1>
          <p style={subtitle}>
            Browse clubs at your school, check popularity, and join instantly.
          </p>
        </div>
        <Link href="/dashboard" style={ghostButton}>
          Back to dashboard
        </Link>
      </header>

      <section style={controls}>
        <div style={searchBlock}>
          <label style={label}>Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs by name or description"
            style={input}
          />
        </div>

        <div style={searchBlock}>
          <label style={label}>School</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              placeholder="Filter by school"
              style={input}
            />
            <button style={buttonPrimary} onClick={applyFilter} disabled={loading}>
              Apply
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div style={statusCard}>Loading clubs…</div>
      ) : err ? (
        <div style={statusCard}>{err}</div>
      ) : (
        <section style={grid}>
          {filtered.length === 0 ? (
            <div style={statusCard}>No clubs found.</div>
          ) : (
            filtered.map((club) => (
              <article key={club._id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={cardTitle}>{club.name}</div>
                    <div style={cardSub}>{club.description || "No description yet."}</div>
                  </div>
                  <div style={pill}>
                    {club.memberCount} member{club.memberCount === 1 ? "" : "s"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  {club.school && <span style={tag}>{club.school}</span>}
                  {club.isMember ? (
                    <span style={tagStrong}>Joined • {club.myRole ?? "member"}</span>
                  ) : (
                    <span style={tagMuted}>Not a member</span>
                  )}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <button
                    style={club.isMember ? buttonDisabled : buttonPrimary}
                    onClick={() => joinClub(club._id)}
                    disabled={club.isMember || joiningId === club._id}
                  >
                    {club.isMember ? "Joined" : joiningId === club._id ? "Joining..." : "Join"}
                  </button>
                  <Link href={`/clubs/${club._id}`} style={ghostButton}>
                    View club
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {msg && <div style={message}>{msg}</div>}

      {me && !err && (
        <div style={footerNote}>
          Showing clubs for <b>{schoolFilter || me.school}</b>.
        </div>
      )}

      <footer style={footerCta}>
        <span>Don&apos;t see your club?</span>
        <Link href="/clubs/new" style={footerLink}>
          Click here to create one
        </Link>
      </footer>
    </main>
  );
}

const page: React.CSSProperties = {
  padding: 24,
  maxWidth: 1100,
  margin: "0 auto",
  display: "grid",
  gap: 18
};

const hero: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: 20,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(120deg, #f8fafc, #ecfeff)"
};

const kicker: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontWeight: 700,
  color: "#0f172a"
};

const title: React.CSSProperties = {
  margin: "6px 0 6px",
  fontSize: 30,
  fontWeight: 900
};

const subtitle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: "#475569"
};

const controls: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16
};

const searchBlock: React.CSSProperties = {
  display: "grid",
  gap: 8
};

const label: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
  color: "#475569"
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff"
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16
};

const card: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#fff",
  padding: 16,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  display: "grid"
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900
};

const cardSub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  color: "#64748b"
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #94a3b8",
  fontSize: 12,
  fontWeight: 700,
  height: "fit-content"
};

const tag: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #cbd5f5",
  background: "#eef2ff",
  fontSize: 12,
  fontWeight: 700,
  color: "#3730a3"
};

const tagStrong: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #86efac",
  background: "#f0fdf4",
  fontSize: 12,
  fontWeight: 700,
  color: "#166534"
};

const tagMuted: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569"
};

const buttonPrimary: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer"
};

const buttonDisabled: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  background: "#e2e8f0",
  color: "#64748b",
  fontWeight: 800,
  cursor: "not-allowed"
};

const ghostButton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};

const statusCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: 14
};

const message: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#166534",
  fontSize: 14,
  width: "fit-content"
};

const footerNote: React.CSSProperties = {
  fontSize: 13,
  color: "#475569"
};

const footerCta: React.CSSProperties = {
  marginTop: 8,
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px dashed #cbd5f5",
  background: "#f8fafc",
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  color: "#0f172a"
};

const footerLink: React.CSSProperties = {
  color: "#1d4ed8",
  textDecoration: "underline"
};
