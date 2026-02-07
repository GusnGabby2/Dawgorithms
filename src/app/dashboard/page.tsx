export default function DashboardPage() {
  return (
    <main style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Dawgorithm</h1>
      <p style={{ marginTop: 10, opacity: 0.85 }}>
        <a href="/your_clubs">Your Clubs</a>
        <a href="/explore_clubs">Explore Clubs</a>
        <a href="/calendar">Calendar</a>
        <a href="/account">Account</a>
      </p>
    </main>
  );
}
