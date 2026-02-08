import Link from "next/link";

const Navbar = () => {
  return (
    <nav>
        <div>Dawgorithm</div>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/your_clubs">Your Clubs</Link>
            <Link href="/explore_clubs">Explore Clubs</Link> 
            <Link href="/calendar">Calendar</Link>
            <Link href="/account">Account</Link>
    </nav>
  );
}

export default Navbar;