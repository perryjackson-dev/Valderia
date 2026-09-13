"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/city", label: "City" },
  { href: "/field", label: "Field" },
  { href: "/troops", label: "Troops" },
  { href: "/world", label: "World Map" },
];

export default function GameNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 text-sm">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={pathname.startsWith(tab.href) ? "font-semibold underline" : "opacity-70 hover:opacity-100"}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
