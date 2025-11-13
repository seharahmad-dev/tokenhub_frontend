// src/components/faculty/FacultyNavbar.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

type NavItem = { label: string; href: string };
// Dashboard removed from LINKS — dashboard reachable by clicking the logo only
const LINKS: NavItem[] = [
  { label: "Events", href: "/faculty/events" },
  { label: "Leaderboard", href: "/faculty/leaderboard" },
  { label: "Students", href: "/faculty/students" },
];

type Notification = {
  title?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
  [k: string]: any;
};

function loadFacultyFromSession() {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // If role field exists and is Faculty/HOD keep it; otherwise still return (defensive)
    return parsed;
  } catch {
    return null;
  }
}

export default function FacultyNavbar({
  tokens = 0, // kept for backward compatibility but not displayed
}: {
  tokens?: number;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // We keep notification state fetching code but we DO NOT render notifications UI,
  // so removing it from the header won't affect backend calls elsewhere.
  const faculty = loadFacultyFromSession();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const isHod =
    (faculty?.designation && faculty.designation.toString().toLowerCase().includes("hod")) ||
    (faculty?.role && faculty.role.toString().toLowerCase() === "hod");

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Optional: we keep a lazy notifications fetch for future uses but do not display it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!faculty?._id) return;
      setLoadingNotifications(true);
      setNotifError(null);
      try {
        const FACULTY_API = import.meta.env.VITE_FACULTY_API || import.meta.env.VITE_STUDENT_API || "";
        if (!FACULTY_API) {
          setNotifications([]);
          return;
        }
        const resp = await axios.get(`${FACULTY_API}/faculty/${faculty._id}/notifications`, {
          withCredentials: true,
          timeout: 5000,
        });
        const payload = resp?.data?.data ?? resp?.data ?? null;
        const notifs: Notification[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.notifications)
          ? payload.notifications
          : [];
        if (!cancelled) setNotifications(notifs);
      } catch (err: any) {
        console.error("Failed to fetch faculty notifications:", err);
        if (!cancelled) setNotifError("Failed to load notifications");
      } finally {
        if (!cancelled) setLoadingNotifications(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [faculty?._id]);

  // logout helper
  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          {/* Logo — clicking it opens the dashboard (no separate Dashboard link anymore) */}
          <a href="/faculty" className="inline-flex items-center gap-2 font-semibold">
            <span className="text-slate-900">
              Token<span className="text-blue-600">HUB</span>
            </span>
            <span className="ml-2 rounded-md border px-2 py-0.5 text-xs text-slate-600">Faculty</span>
          </a>

          {/* Main nav — no Dashboard entry (dashboard is the logo) */}
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

            {/* HOD-only restricted button */}
            {isHod && (
              <a
                href="/faculty/hod-panel"
                className="ml-4 rounded-md bg-rose-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-rose-700"
              >
                HOD Panel
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* NOTE: Tokens / notifications removed from UI per request. */}

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700"
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                👤
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg">
                  <a href="/faculty/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">
                    Your Profile
                  </a>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
