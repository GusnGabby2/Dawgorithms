"use client";

import { useEffect, useState } from "react";

type Club = {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
};

export default function ClubsClient() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/clubs");
    const data = await res.json();
    setClubs(data);
  }

  useEffect(() => {
    refresh().catch(() => setStatus("❌ Failed to load clubs"));
  }, []);

  async function createClub(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!name.trim()) {
      setStatus("Club name is required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create club");
      }

      setName("");
      setDescription("");
      setStatus("✅ Club created!");
      await refresh();
    } catch (err: any) {
      setStatus(`❌ ${err.message || "Something went wrong"}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 720 }}>
      <form onSubmit={createClub} style={{ display: "grid", gap: 10 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Club name"
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {isLoading ? "Creating..." : "Create club"}
        </button>

        {status && <div style={{ fontSize: 14 }}>{status}</div>}
      </form>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Existing clubs</h2>
        <ul style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {clubs.map((c) => (
            <li
              key={c._id}
              style={{
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div style={{ opacity: 0.8 }}>{c.description || "—"}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                Created: {new Date(c.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
