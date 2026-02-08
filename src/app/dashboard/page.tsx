import Link from "next/link";
import Image from "next/image";
import your_clubs from "@/assets/box1.png";
import explore_clubs from "@/assets/box2.png";
import account from "@/assets/box4.png";
import dawgorithm from "@/assets/dawgorithmslogo.png";

export default function DashboardPage() {
  return (
    <main className="dashboardPage">
      <div className="dashboardBrand">
        <Image
          src={dawgorithm}
          alt="Dawgorithms"
          width={400}
          height={150}
          priority
        />
      </div>
      <section className="dashboardGrid">
        <Link href="/your_clubs" className="dashboardCard">
          <Image src={your_clubs} alt="Your Clubs" width={500} height={500} />
        </Link>
        <Link href="/explore_clubs" className="dashboardCard">
          <Image src={explore_clubs} alt="Explore Clubs" width={500} height={500} />
        </Link>
        <Link href="/account" className="dashboardCard">
          <Image src={account} alt="Account" width={500} height={500} />
        </Link>
      </section>
    </main>
  );
}
