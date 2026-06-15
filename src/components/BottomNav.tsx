import { Link, useRouterState } from "@tanstack/react-router";

type NavLink = {
  to: "/dashboard" | "/upload" | "/history" | "/ask";
  label: string;
  icon: string;
  search?: { weekStart?: string };
};

const links: NavLink[] = [
  { to: "/dashboard", label: "Results", icon: "📊" },
  { to: "/upload", label: "Upload", icon: "📸", search: { weekStart: undefined } },
  { to: "/history", label: "History", icon: "📅" },
  { to: "/ask", label: "Ask", icon: "💬" },
];

export default function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hidden =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/processing") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/report/print");

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-white shadow-[0_-3px_16px_rgba(27,77,53,0.07)]">
      {links.map((link) => {
        const active =
          pathname === link.to ||
          (link.to === "/dashboard" && pathname === "/");
        return (
          <Link
            key={link.to}
            to={link.to}
            {...(link.search ? { search: link.search } : {})}
            className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.72rem] font-semibold uppercase tracking-wide ${
              active ? "text-[var(--green-deep)]" : "text-[var(--warm-gray)]"
            }`}
          >
            <span className="text-[1.45rem]">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
