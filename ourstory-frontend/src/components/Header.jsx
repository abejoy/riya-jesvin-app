"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ showLogout = false, onLogout = null }) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");
  const isHome = pathname === "/";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-rose-600 hover:text-rose-700 transition"
        >
          Our Story ❤️
        </Link>

        <div className="flex gap-4 items-center">
          {!isHome && (
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              ← Timeline
            </Link>
          )}

          {!isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              Admin
            </Link>
          )}

          {showLogout && onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
