import Link from "next/link";
import Image from "next/image";
import your_clubs from "@/assets/box1.png";
import explore_clubs from "@/assets/box2.png";
import calendar from "@/assets/box3.png";
import account from "@/assets/box4.png";
import dawgorithm from "@/assets/dawgorithmslogo.png";

export default function DashboardPage() {
  return (
    <main style={{ padding: 28, maxWidth: 1350, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 24, paddingBottom: 16 }}>
        <Image
          src={dawgorithm}
          alt="Dawgorithms"
          width={400}
          height={150}
          priority
        />
      </div>
      <div className="grid grid-cols-4 gap-[50px] mt-10">
        <Link href="/your_clubs"><Image src={your_clubs} alt="Your Clubs" width={500} height={500}></Image></Link>
        <Link href="/explore_clubs"><Image src={explore_clubs} alt="Explore Clubs" width={500} height={500}></Image></Link>
        <Link href="/calendar"><Image src={calendar} alt="Calendar" width={500} height={500}></Image></Link>
        <Link href="/account"><Image src={account} alt="Account" width={500} height={500}></Image></Link>
      </div>
    </main>
  );
}
