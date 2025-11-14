import { useRef, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import axios from "axios";
import { useLocation } from "react-router-dom";

type NavItem = { label: string; href: string };

const LINKS: NavItem[] = [
  { label: "Students", href: "/admin/students" },
  { label: "Faculty", href: "/admin/faculties" },
  { label: "HOD", href: "/admin/hod" },
  { label: "Clubs", href: "/admin/clubs" },
];

export default function AdminNavbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu state
  const profileRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // read user from sessionStorage (keeps same approach as your other navbars)
  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

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

  async function handleLogout() {
    try {
      const base = import.meta.env.VITE_ADMIN_API ?? "";
      await axios.post(`${base}/admin/logout`, {}, { withCredentials: true });
    } catch {
      // ignore network errors on logout
    } finally {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
      // keep same behavior as other navbars (redirect to login)
      window.location.href = "/login/admin";
    }
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-40 border-b border-red-100 bg-white/75 backdrop-blur-sm">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="/admin" className="inline-flex items-center gap-3 font-semibold">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-sm flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-900">Token</span>
                <span className="text-red-600">HUB</span>
              </div>
            </div>
            <span className="ml-2 rounded-md border border-red-100 px-2 py-0.5 text-xs text-slate-600 bg-white/60">
              Admin
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
                    ? "text-red-700 font-medium bg-red-50"
                    : "text-slate-600 hover:text-red-700 hover:bg-red-50"
                }`}
              >
                {l.label}
              </a>
            ))}

            {/* keep no extra buttons beyond these (logout/profile handled below) */}
          </nav>

          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-red-50 transition"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-red-700" />
              ) : (
                <Menu className="w-5 h-5 text-red-700" />
              )}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-50 hover:shadow-sm transition"
                title="Profile"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                {/* same simple avatar/emoji */}
                <span aria-hidden>{(user?.firstName || user?.name || "A")[0]?.toUpperCase()}</span>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-red-100 bg-white shadow-lg overflow-hidden"
                  role="menu"
                >
                  <a
                    href="/admin/profile"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Your Profile
                  </a>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
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
          <nav className="md:hidden pb-4 border-t border-red-100">
            <div className="flex flex-col gap-2 pt-4 px-3">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`block px-3 py-2 rounded-md text-sm transition ${
                    isActive(l.href)
                      ? "text-red-700 font-medium bg-red-50"
                      : "text-slate-600 hover:text-red-700 hover:bg-red-50"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}

              <a
                href="/admin/profile"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm text-slate-600 hover:text-red-700 hover:bg-red-50"
              >
                Profile
              </a>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium shadow-sm hover:bg-red-700 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
