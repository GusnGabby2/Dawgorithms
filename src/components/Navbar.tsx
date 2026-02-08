import Link from "next/link";
import Image from "next/image";
import dawgorithm from "@/assets/dawgorithmssmalllogo.png";

const Navbar = () => {
  return (
    <header className="navbar">
      <nav className="navInner">
        <Link href="/dashboard"><Image src={dawgorithm} alt="Dawgorithms" width={50} height={50}></Image></Link>
        <div className="navLinks">
            <Link href="/your_clubs" className="navLink">Your Clubs</Link>
            <Link href="/explore_clubs" className="navLink">Explore Clubs</Link> 
            <Link href="/account" className="navLink">Account</Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
