import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

type NavItem = { label: string; href: string };
const LINKS: NavItem[] = [
  { label: "Events", href: "/faculty/events" },
  { label: "Leaderboard", href: "/faculty/leaderboard" },
  { label: "Students", href: "/faculty/students" },
];

function loadFacultyFromSession() {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export default function FacultyNavbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const faculty = loadFacultyFromSession();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const isHod = faculty.isHod;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="/faculty" className="inline-flex items-center gap-2 font-semibold">
            <span className="text-slate-900">
              Token<span className="text-blue-600">HUB</span>
            </span>
            <span className="ml-2 rounded-md border px-2 py-0.5 text-xs text-slate-600">Faculty</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`hover:text-slate-900 ${isActive(l.href) ? "text-blue-600 font-medium" : "text-slate-600"}`}
              >
                {l.label}
              </a>
            ))}

            {isHod && (
              <a href="/faculty/hod-panel" className="ml-4 rounded-md bg-rose-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-rose-700">
                HOD Panel
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700"
                title="Profile"
              >
                👤
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg">
                  <a href="/faculty/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">Your Profile</a>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
