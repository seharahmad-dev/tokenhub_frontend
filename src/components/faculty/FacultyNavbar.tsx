import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectFaculty } from "../../app/facultySlice";

type NavItem = { label: string; href: string };

const LINKS: NavItem[] = [
  { label: "Events", href: "/faculty/events" },
  { label: "Leaderboard", href: "/faculty/leaderboard" },
];

const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

export default function FacultyNavbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu state
  const profileRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // Fetch faculty from Redux (kept exactly as before)
  const faculty = useAppSelector(selectFaculty);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isHod = faculty?.isHod;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/75 backdrop-blur-sm">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="/faculty" className="inline-flex items-center gap-3 font-semibold">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 shadow-sm flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-900">Token</span>
                <span className="text-emerald-600">HUB</span>
              </div>
            </div>
            <span className="ml-2 rounded-md border border-green-100 px-2 py-0.5 text-xs text-slate-600 bg-white/60">
              Faculty
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`px-2 py-1 rounded-md transition-colors duration-150 ${
                  isActive(l.href)
                    ? "text-emerald-700 font-medium bg-emerald-50"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {l.label}
              </a>
            ))}

            {isHod && (
              <a
                href="/faculty/hod-panel"
                className="ml-4 rounded-xl bg-emerald-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-emerald-700 shadow-sm transition"
              >
                HOD Panel
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-green-50 transition"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {/* simple hamburger / close icon */}
              {menuOpen ? (
                <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-green-50 hover:shadow-sm transition"
                title="Profile"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                {/* keep the same simple avatar/emoji */}
                <span aria-hidden>{(user?.firstName || user?.name || "A")[0]?.toUpperCase()}</span>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-green-100 bg-white shadow-lg overflow-hidden"
                  role="menu"
                >
                  <a
                    href="/faculty/profile"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-green-50"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Your Profile
                  </a>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav panel */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-green-100">
            <div className="flex flex-col gap-2 pt-4 px-3">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`block px-3 py-2 rounded-md text-sm transition ${
                    isActive(l.href)
                      ? "text-emerald-700 font-medium bg-emerald-50"
                      : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}

              {isHod && (
                <a
                  href="/faculty/hod-panel"
                  className="mt-2 inline-block rounded-md bg-emerald-600 px-3 py-2 text-white text-sm font-medium hover:bg-emerald-700 shadow-sm transition"
                  onClick={() => setMenuOpen(false)}
                >
                  HOD Panel
                </a>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
