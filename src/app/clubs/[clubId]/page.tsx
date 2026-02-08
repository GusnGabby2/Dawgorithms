"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";

type Club = {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  school?: string;
  createdAt?: string;
};

type ClubDetailResponse = {
  club: Club;
  memberCount: number;
  isMember: boolean;
  myRole: "admin" | "member" | null;
};

type AvailabilityBlock = {
  day: number;
  startMin: number;
  endMin: number;
};

type Poll = {
  _id: string;
  title: string;
  description?: string;
  closesAt: string;
  options: string[];
  createdAt?: string;
  myChoice?: string | null;
};

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  myStatus?: "yes" | "no" | "maybe" | null;
};

type ApiError = { error?: string; message?: string };

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minToTime(min: number) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function timeToMin(value: string) {
  const [h, m] = value.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export default function ClubDetailPage() {
  const params = useParams();
  const clubId = String(params?.clubId ?? "");

  const [club, setClub] = useState<Club | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<"admin" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  const [joinLoading, setJoinLoading] = useState(false);

  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [availDay, setAvailDay] = useState(1);
  const [availStart, setAvailStart] = useState("17:00");
  const [availEnd, setAvailEnd] = useState("18:00");
  const [availSaving, setAvailSaving] = useState(false);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [pollClosesAt, setPollClosesAt] = useState("");
  const [pollOptions, setPollOptions] = useState("yes,no,maybe");
  const [pollLoading, setPollLoading] = useState(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLoading, setEventLoading] = useState(false);

  const [googleLinks, setGoogleLinks] = useState<Record<string, string>>({});

  const isAdmin = myRole === "admin";

  const availabilitySummary = useMemo(() => {
    return availability.map((b) => `${dayNames[b.day]} ${minToTime(b.startMin)}–${minToTime(b.endMin)}`);
  }, [availability]);

  async function loadClub() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}`), { credentials: "include" });
      if (res.status === 401) {
        setErr("Please sign in to view this club.");
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to load club.");
      }
      const data: ClubDetailResponse = await res.json();
      setClub(data.club);
      setMemberCount(data.memberCount);
      setIsMember(data.isMember);
      setMyRole(data.myRole);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load club.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMemberData() {
    if (!clubId) return;
    if (!isMember) return;

    try {
      const [availRes, pollsRes, eventsRes] = await Promise.all([
        fetch(apiUrl(`/clubs/${clubId}/availability`), { credentials: "include" }),
        fetch(apiUrl(`/clubs/${clubId}/polls`), { credentials: "include" }),
        fetch(apiUrl(`/clubs/${clubId}/events`), { credentials: "include" })
      ]);

      if (availRes.ok) {
        const data = await availRes.json();
        setAvailability(data.availability ?? []);
      }

      if (pollsRes.ok) {
        const data = await pollsRes.json();
        setPolls(data.polls ?? []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // silent background load
    }
  }

  useEffect(() => {
    if (!clubId) return;
    loadClub();
  }, [clubId]);

  useEffect(() => {
    loadMemberData();
  }, [clubId, isMember]);

  async function joinClub() {
    setJoinLoading(true);
    setMsg(null);
    setMsgType(null);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/join`), {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to join club.");
      }
      await loadClub();
      await loadMemberData();
      setMsg("You joined the club.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to join club.");
      setMsgType("error");
    } finally {
      setJoinLoading(false);
    }
  }

  function addAvailability() {
    const startMin = timeToMin(availStart);
    const endMin = timeToMin(availEnd);
    if (startMin === null || endMin === null) {
      setMsg("Please enter a valid time range.");
      setMsgType("error");
      return;
    }
    if (endMin <= startMin) {
      setMsg("End time must be after start time.");
      setMsgType("error");
      return;
    }
    setAvailability((prev) => [
      ...prev,
      { day: availDay, startMin, endMin }
    ]);
  }

  function removeAvailability(index: number) {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveAvailability() {
    setAvailSaving(true);
    setMsg(null);
    setMsgType(null);
    try {
      const res = await fetch(apiUrl(`/clubs/${clubId}/availability`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ availability })
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to save availability.");
      }
      setMsg("Availability saved.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save availability.");
      setMsgType("error");
    } finally {
      setAvailSaving(false);
    }
  }

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    setPollLoading(true);
    setMsg(null);
    setMsgType(null);
    try {
      if (!pollTitle.trim()) {
        setMsg("Poll title is required.");
        setMsgType("error");
        return;
      }
      if (!pollClosesAt) {
        setMsg("Please select a close date/time.");
        setMsgType("error");
        return;
      }
      const options = pollOptions
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      const res = await fetch(apiUrl(`/clubs/${clubId}/polls`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: pollTitle.trim(),
          description: pollDesc.trim(),
          closesAt: pollClosesAt,
          options: options.length >= 2 ? options : undefined
        })
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to create poll.");
      }
      setPollTitle("");
      setPollDesc("");
      setPollClosesAt("");
      setPollOptions("yes,no,maybe");
      await loadMemberData();
      setMsg("Poll created.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create poll.");
      setMsgType("error");
    } finally {
      setPollLoading(false);
    }
  }

  async function respondPoll(pollId: string, choice: string) {
    setMsg(null);
    setMsgType(null);
    try {
      const res = await fetch(apiUrl(`/polls/${pollId}/respond`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ choice })
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to respond.");
      }
      await loadMemberData();
      setMsg("Response saved.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to respond.");
      setMsgType("error");
    }
  }

  async function loadRecommendations(pollId: string) {
    setMsg(null);
    setMsgType(null);
    try {
      const res = await fetch(apiUrl(`/polls/${pollId}/recommendations?choice=yes&step=30&limit=5`), {
        credentials: "include"
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to load recommendations.");
      }
      const data = await res.json();
      const items = (data.recommendations ?? []).map(
        (r: any) => `${dayNames[r.day]} ${minToTime(r.startMin)}–${minToTime(r.endMin)} (${r.count})`
      );
      setMsg(items.length ? `Top times: ${items.join(", ")}` : "No recommendations yet.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load recommendations.");
      setMsgType("error");
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setEventLoading(true);
    setMsg(null);
    setMsgType(null);
    try {
      if (!eventTitle.trim()) {
        setMsg("Event title is required.");
        setMsgType("error");
        return;
      }
      if (!eventStart || !eventEnd) {
        setMsg("Please select start and end times.");
        setMsgType("error");
        return;
      }
      const res = await fetch(apiUrl(`/clubs/${clubId}/events`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: eventTitle.trim(),
          description: eventDesc.trim(),
          location: eventLocation.trim(),
          startAt: eventStart,
          endAt: eventEnd
        })
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to create event.");
      }
      setEventTitle("");
      setEventDesc("");
      setEventLocation("");
      setEventStart("");
      setEventEnd("");
      await loadMemberData();
      setMsg("Event created.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create event.");
      setMsgType("error");
    } finally {
      setEventLoading(false);
    }
  }

  async function rsvp(eventId: string, status: "yes" | "no" | "maybe") {
    setMsg(null);
    setMsgType(null);
    try {
      const res = await fetch(apiUrl(`/events/${eventId}/rsvp`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to RSVP.");
      }
      await loadMemberData();
      setMsg("RSVP saved.");
      setMsgType("success");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to RSVP.");
      setMsgType("error");
    }
  }

  async function getGoogleLink(eventId: string) {
    setMsg(null);
    setMsgType(null);
    try {
      const res = await fetch(apiUrl(`/events/${eventId}/google`), { credentials: "include" });
      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to get Google link.");
      }
      const data = await res.json();
      if (data?.url) {
        setGoogleLinks((prev) => ({ ...prev, [eventId]: data.url }));
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to get Google link.");
      setMsgType("error");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading club…</div>;
  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <p>{err}</p>
        <Link href="/" style={{ textDecoration: "underline" }}>
          Sign in
        </Link>
      </div>
    );
  }
  if (!club) return <div style={{ padding: 24 }}>Club not found.</div>;

  return (
    <main style={page}>
      <Navbar />

      <header style={hero}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {club.imageUrl ? (
            <img src={club.imageUrl} alt={club.name} style={clubImg} />
          ) : (
            <div style={clubImgPlaceholder}>No image</div>
          )}
          <div>
            <div style={kicker}>{club.school || "Club"}</div>
            <h1 style={title}>{club.name}</h1>
            <p style={subtitle}>{club.description || "No description yet."}</p>
            <div style={metaRow}>
              <span style={metaPill}>{memberCount} member{memberCount === 1 ? "" : "s"}</span>
              {isMember ? (
                <span style={metaPillStrong}>Joined • {myRole ?? "member"}</span>
              ) : (
                <span style={metaPillMuted}>Not a member</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {!isMember && (
            <button onClick={joinClub} disabled={joinLoading} style={buttonPrimary}>
              {joinLoading ? "Joining..." : "Join club"}
            </button>
          )}
          <Link href="/explore_clubs" style={ghostButton}>
            Back to explore
          </Link>
        </div>
      </header>

      {!isMember && (
        <section style={card}>
          <div style={{ fontWeight: 800 }}>Join to unlock club tools</div>
          <div style={{ marginTop: 6, color: "#475569" }}>
            Members can set availability, vote in polls, and RSVP to events.
          </div>
        </section>
      )}

      {isMember && (
        <section style={grid}>
          <div style={card}>
            <div style={cardTitle}>Availability</div>
            <div style={cardSub}>
              Add times you’re available for club events.
            </div>

            <div style={row}>
              <select
                value={availDay}
                onChange={(e) => setAvailDay(Number(e.target.value))}
                style={input}
              >
                {dayNames.map((d, idx) => (
                  <option key={d} value={idx}>{d}</option>
                ))}
              </select>
              <input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} style={input} />
              <input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} style={input} />
              <button type="button" onClick={addAvailability} style={buttonGhostSmall}>
                Add
              </button>
            </div>

            <div style={chipWrap}>
              {availability.length === 0 ? (
                <span style={muted}>No availability yet.</span>
              ) : (
                availabilitySummary.map((label, idx) => (
                  <span key={`${label}-${idx}`} style={chip}>
                    {label}
                    <button type="button" style={chipBtn} onClick={() => removeAvailability(idx)}>
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={saveAvailability}
              disabled={availSaving}
              style={buttonPrimary}
            >
              {availSaving ? "Saving..." : "Save availability"}
            </button>
          </div>

          <div style={card}>
            <div style={cardTitle}>Polls</div>
            <div style={cardSub}>Vote on decisions and see recommendations.</div>

            {polls.length === 0 ? (
              <div style={muted}>No polls yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {polls.map((p) => {
                  const closed = new Date(p.closesAt).getTime() <= Date.now();
                  return (
                    <div key={p._id} style={pollCard}>
                      <div style={{ fontWeight: 800 }}>{p.title}</div>
                      {p.description && <div style={muted}>{p.description}</div>}
                      <div style={muted}>
                        Closes: {new Date(p.closesAt).toLocaleString()} {closed ? "(Closed)" : ""}
                      </div>
                      <div style={rowWrap}>
                        {p.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => respondPoll(p._id, opt)}
                            disabled={closed}
                            style={p.myChoice === opt ? buttonPrimary : buttonGhostSmall}
                          >
                            {opt}
                          </button>
                        ))}
                        <button onClick={() => loadRecommendations(p._id)} style={buttonGhostSmall}>
                          Recommendations
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isAdmin && (
              <form onSubmit={createPoll} style={{ marginTop: 16, display: "grid", gap: 10 }}>
                <div style={cardTitleSmall}>Create poll (admin)</div>
                <input
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Poll title"
                  style={input}
                />
                <input
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  placeholder="Description"
                  style={input}
                />
                <input
                  type="datetime-local"
                  value={pollClosesAt}
                  onChange={(e) => setPollClosesAt(e.target.value)}
                  style={input}
                />
                <input
                  value={pollOptions}
                  onChange={(e) => setPollOptions(e.target.value)}
                  placeholder="Options (comma-separated)"
                  style={input}
                />
                <button type="submit" disabled={pollLoading} style={buttonPrimary}>
                  {pollLoading ? "Creating..." : "Create poll"}
                </button>
              </form>
            )}
          </div>

          <div style={card}>
            <div style={cardTitle}>Events</div>
            <div style={cardSub}>RSVP and see upcoming events.</div>

            {events.length === 0 ? (
              <div style={muted}>No events yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {events.map((e) => (
                  <div key={e._id} style={eventCard}>
                    <div style={{ fontWeight: 800 }}>{e.title}</div>
                    <div style={muted}>
                      {new Date(e.startAt).toLocaleString()} → {new Date(e.endAt).toLocaleString()}
                    </div>
                    {e.location && <div style={muted}>Location: {e.location}</div>}
                    {e.description && <div style={muted}>{e.description}</div>}
                    <div style={rowWrap}>
                      {(["yes", "maybe", "no"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => rsvp(e._id, status)}
                          style={e.myStatus === status ? buttonPrimary : buttonGhostSmall}
                        >
                          {status.toUpperCase()}
                        </button>
                      ))}
                      {e.myStatus === "yes" && (
                        <button onClick={() => getGoogleLink(e._id)} style={buttonGhostSmall}>
                          Google Calendar
                        </button>
                      )}
                    </div>
                    {googleLinks[e._id] && (
                      <a href={googleLinks[e._id]} target="_blank" rel="noreferrer" style={link}>
                        Open Google Calendar
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isAdmin && (
              <form onSubmit={createEvent} style={{ marginTop: 16, display: "grid", gap: 10 }}>
                <div style={cardTitleSmall}>Create event (admin)</div>
                <input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Event title"
                  style={input}
                />
                <input
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Description"
                  style={input}
                />
                <input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Location"
                  style={input}
                />
                <div style={row}>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    style={input}
                  />
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    style={input}
                  />
                </div>
                <button type="submit" disabled={eventLoading} style={buttonPrimary}>
                  {eventLoading ? "Creating..." : "Create event"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {msg && (
        <div style={msgType === "success" ? messageSuccess : messageError}>{msg}</div>
      )}
    </main>
  );
}

const page: React.CSSProperties = {
  padding: 24,
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gap: 18
};

const hero: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  padding: 20,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(120deg, #f8fafc, #eef2ff)"
};

const clubImg: React.CSSProperties = {
  width: 90,
  height: 90,
  borderRadius: 16,
  objectFit: "cover",
  border: "1px solid #e2e8f0",
  background: "#fff"
};

const clubImgPlaceholder: React.CSSProperties = {
  width: 90,
  height: 90,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700
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

const metaRow: React.CSSProperties = {
  marginTop: 8,
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
};

const metaPill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #cbd5f5",
  background: "#eef2ff",
  fontSize: 12,
  fontWeight: 700,
  color: "#3730a3"
};

const metaPillStrong: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #86efac",
  background: "#f0fdf4",
  fontSize: 12,
  fontWeight: 700,
  color: "#166534"
};

const metaPillMuted: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569"
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: 16
};

const card: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  display: "grid",
  gap: 12
};

const cardTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18
};

const cardTitleSmall: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 14
};

const cardSub: React.CSSProperties = {
  marginTop: -6,
  color: "#64748b",
  fontSize: 13
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
  minWidth: 0
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap"
};

const rowWrap: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 8
};

const buttonPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer"
};

const buttonGhostSmall: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer"
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

const chipWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
};

const chip: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: 12,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 6
};

const chipBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontWeight: 900,
  padding: 0
};

const pollCard: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  padding: 12,
  background: "#f8fafc",
  display: "grid",
  gap: 6
};

const eventCard: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  padding: 12,
  background: "#f8fafc",
  display: "grid",
  gap: 6
};

const muted: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13
};

const messageBase: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid",
  fontSize: 14,
  width: "fit-content"
};

const messageSuccess: React.CSSProperties = {
  ...messageBase,
  borderColor: "#bbf7d0",
  background: "#f0fdf4",
  color: "#166534"
};

const messageError: React.CSSProperties = {
  ...messageBase,
  borderColor: "#fecaca",
  background: "#fef2f2",
  color: "#991b1b"
};

const link: React.CSSProperties = {
  color: "#1d4ed8",
  textDecoration: "underline",
  fontSize: 13,
  fontWeight: 700
};
