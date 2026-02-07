import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="font-bold text-5xl mb-4">404</h1>
            <p className="text-lg mb-6">Sorry, the page you are looking for cannot be found.</p>

            <Link href="/">
                <div>
                    Return Home
                </div>
            </Link>
        </div>
    )
}