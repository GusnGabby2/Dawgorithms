"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";

type ApiError = { error?: string; message?: string };

type AuthState = "loading" | "authed" | "guest";

export default function CreateClubPage() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(apiUrl("/auth/me"), { credentials: "include" });
        setAuth(res.ok ? "authed" : "guest");
      } catch {
        setAuth("guest");
      }
    }

    checkAuth();
  }, []);

  async function onSelectImage(file: File | null) {
    setMsg(null);
    setMsgType(null);

    if (!file) {
      setImageUrl("");
      setImageName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMsg("Please select an image file.");
      setMsgType("error");
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setMsg("Image is too large. Please choose one under 2MB.");
      setMsgType("error");
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageUrl(result);
    };
    reader.onerror = () => {
      setMsg("Failed to read image.");
      setMsgType("error");
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageUrl("");
    setImageName("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setMsgType(null);

    if (auth !== "authed") {
      setMsg("Please sign in to create a club.");
      setMsgType("error");
      return;
    }

    if (!name.trim()) {
      setMsg("Club name is required.");
      setMsgType("error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/clubs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim()
        })
      });

      if (!res.ok) {
        const data: ApiError = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to create club.");
      }

      setName("");
      setDescription("");
      clearImage();
      setMsg("Club created successfully.");
      setMsgType("success");
    } catch (err: any) {
      setMsg(err?.message || "Failed to create club.");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <Navbar />

      <header style={header}>
        <div>
          <div style={kicker}>Create Club</div>
          <h1 style={title}>Start something new</h1>
          <p style={subtitle}>
            Create a club for your school. You’ll be set as the admin automatically.
          </p>
        </div>
        <Link href="/explore_clubs" style={ghostButton}>
          Back to explore
        </Link>
      </header>

      <section style={card}>
        <form onSubmit={onSubmit} style={formGrid}>
          <div style={formCol}>
            <label style={label}>Club name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dawgorithms"
              style={input}
            />

            <label style={label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your club do?"
              rows={5}
              style={{ ...input, resize: "vertical" }}
            />

            <label style={label}>Club image</label>
            <label style={fileDrop}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onSelectImage(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              <div style={fileDropTitle}>Select an image</div>
              <div style={fileDropSub}>PNG or JPG, max 2MB</div>
              {imageName && <div style={fileSelected}>Selected: {imageName}</div>}
            </label>

            <div style={actions}>
              <button type="submit" disabled={loading || auth === "loading"} style={buttonPrimary}>
                {loading ? "Creating..." : "Create club"}
              </button>
              {auth === "guest" && (
                <Link href="/" style={ghostButton}>
                  Sign in
                </Link>
              )}
            </div>

            {msg && (
              <div style={msgType === "success" ? messageSuccess : messageError}>{msg}</div>
            )}
          </div>

          <div style={previewCol}>
            <div style={previewCard}>
              <div style={previewHeader}>Preview</div>
              <div style={previewBody}>
                {imageUrl ? (
                  <img src={imageUrl} alt="Club preview" style={previewImg} />
                ) : (
                  <div style={previewEmpty}>No image selected</div>
                )}
              </div>
              {imageUrl && (
                <button type="button" onClick={clearImage} style={buttonGhostSmall}>
                  Remove image
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  padding: 24,
  maxWidth: 1000,
  margin: "0 auto",
  display: "grid",
  gap: 18
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: 22,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(120deg, #f8fafc, #e0f2fe)"
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

const card: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  background: "#fff",
  padding: 20,
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)"
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.8fr",
  gap: 18
};

const formCol: React.CSSProperties = {
  display: "grid",
  gap: 10
};

const previewCol: React.CSSProperties = {
  display: "grid",
  alignItems: "start"
};

const label: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
  color: "#475569"
};

const input: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5f5",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff"
};

const fileDrop: React.CSSProperties = {
  borderRadius: 14,
  border: "1px dashed #94a3b8",
  padding: 16,
  background: "#f8fafc",
  display: "grid",
  gap: 6,
  cursor: "pointer"
};

const fileDropTitle: React.CSSProperties = {
  fontWeight: 800,
  color: "#0f172a"
};

const fileDropSub: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b"
};

const fileSelected: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#1d4ed8",
  fontWeight: 700
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginTop: 4
};

const buttonPrimary: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer"
};

const ghostButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};

const previewCard: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 12
};

const previewHeader: React.CSSProperties = {
  fontWeight: 800,
  color: "#0f172a"
};

const previewBody: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  padding: 12
};

const previewImg: React.CSSProperties = {
  width: "100%",
  maxWidth: 220,
  height: 220,
  objectFit: "cover",
  borderRadius: 12
};

const previewEmpty: React.CSSProperties = {
  fontSize: 13,
  color: "#94a3b8"
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

const messageBase: React.CSSProperties = {
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid",
  width: "fit-content"
};

const messageSuccess: React.CSSProperties = {
  ...messageBase,
  color: "#166534",
  background: "#f0fdf4",
  borderColor: "#bbf7d0"
};

const messageError: React.CSSProperties = {
  ...messageBase,
  color: "#991b1b",
  background: "#fef2f2",
  borderColor: "#fecaca"
};
