import React, { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import BlackholeIcon from "@/components/BlackholeIcon";

export const START_FREE = "/register?returnTo=" + encodeURIComponent("/chat");
const LOGIN = "/login?returnTo=" + encodeURIComponent("/chat");

const LINKS = [
  { to: "/arcade", label: "Arcade" },
  { to: "/templates", label: "Templates" },
  { to: "/showcase", label: "Gallery" },
  { to: "/business", label: "For business" },
];

// Header, footer and background shared by the public pages (welcome, arcade, templates,
// gallery, business), so visitors can move between them and always find "Start free".
export default function PublicLayout({ title, children }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!title) return;
    document.title = `${title} · Blackhole AI`;
    return () => {
      document.title = "Blackhole AI";
    };
  }, [title]);

  const navLink = ({ isActive }) => `whitespace-nowrap hover:text-white ${isActive ? "text-white" : "text-slate-400"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#000000] text-slate-100 overflow-hidden relative">
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-10 max-w-6xl mx-auto px-4 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
              <BlackholeIcon className="w-5 h-5" />
            </span>
            Blackhole AI
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLink}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {isAuthenticated ? (
              <Link to="/chat" className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200">Open app</Link>
            ) : (
              <>
                <Link to={LOGIN} className="px-3 py-2 text-slate-300 hover:text-white">Log in</Link>
                <Link to={START_FREE} className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200">Start free</Link>
              </>
            )}
          </div>
        </div>
        <nav className="md:hidden mt-4 flex items-center gap-5 text-sm overflow-x-auto">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLink}>{l.label}</NavLink>
          ))}
        </nav>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 pb-16">{children}</main>

      <footer className="relative z-10 max-w-6xl mx-auto px-4 pb-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-slate-300">{l.label}</Link>
        ))}
        <Link to="/contact" className="hover:text-slate-300">Contact</Link>
        <Link to="/report" className="hover:text-slate-300">Report a page</Link>
        <Link to="/terms" className="hover:text-slate-300">Terms</Link>
        <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
      </footer>
    </div>
  );
}
