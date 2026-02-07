import ClubsClient from "./ClubsClient";

export default function ClubsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Clubs</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Create a club and see it stored in MongoDB.
      </p>

      <div style={{ marginTop: 24 }}>
        <ClubsClient />
      </div>
    </main>
  );
}
