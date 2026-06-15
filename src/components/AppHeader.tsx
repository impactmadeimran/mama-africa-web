import { Link } from "@tanstack/react-router";
import type { User } from "#/lib/types";

export default function AppHeader({
  user,
  onLogout,
}: {
  user?: User | null;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-[var(--green-deep)] px-[18px] py-3 text-white shadow-[0_2px_10px_rgba(0,0,0,0.18)]">
      <div>
        <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[1.1rem] font-bold">
          <span className="h-[9px] w-[9px] rounded-full bg-[var(--green-light)]" />
          My Business
        </div>
        {user && (
          <div className="mt-0.5 text-[0.7rem] opacity-60">
            {user.name ? `${user.name}'s Business · ` : ''}ID: {user.id}
          </div>
        )}
      </div>
      {user ? (
        <button
          type="button"
          onClick={onLogout}
          className="rounded-[8px] px-[11px] py-[7px] text-[0.78rem] opacity-60 hover:opacity-100"
        >
          Sign out
        </button>
      ) : (
        <Link to="/login" className="text-[0.78rem] opacity-80">
          Sign in
        </Link>
      )}
    </header>
  );
}
