import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

type NavItem = { label: string; href: string };
const LINKS: NavItem[] = [
  { label: "Explore", href: "/student/explore" },
  { label: "Events", href: "/student/events" },
  { label: "Clubs", href: "/student/clubs" },
  { label: "Discuss", href: "/student/discuss" },
  { label: "Quiz", href: "/student/quiz" },
  { label: "Leaderboard", href: "/student/leaderboard" },
  { label: "Store", href: "/student/store" },
];

export default function StudentNavbar({
  tokens = 0,
  points = 0,
}: {
  tokens?: number;
  points?: number;
}) {
  const [open, setOpen] = useState(false);
  const dd = useRef<HTMLDivElement | null>(null);

  const [totalTokens, setTotalTokens] = useState<number>(tokens);
  const [availablePoints, setAvailablePoints] = useState<number>(points);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const student = useAppSelector(selectStudent);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dd.current && !dd.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Fetch tokens as soon as navbar mounts or student becomes available
  useEffect(() => {    
    const fetchTokens = async () => {     
      if (!student?._id) {
        console.log("⏳ Waiting for student data...");
        return;
      }

      setLoadingTokens(true);
      try {
        // if your backend is running on a different origin, replace with full base URL
        const baseURL = import.meta.env.VITE_TOKEN_API || "";
        const resp = await axios.get(
          `${baseURL}/token/${student._id}/total`,
          { withCredentials: true }
        );
        
        console.log(`${baseURL}/api/token/${student._id}/total`);
        

        const data = resp?.data?.data;
        console.log("✅ Token data:", data);

        if (data) {
          setTotalTokens(data.totalTokens ?? 0);
          setAvailablePoints(data.availableTokens ?? 0);
        }
      } catch (err: any) {
        console.error("❌ Error fetching tokens:", err);
      } finally {
        setLoadingTokens(false);
      }
    };

    // Always run once on mount, and whenever student id changes
    fetchTokens();
  }, [student?._id]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          {/* Logo → Dashboard */}
          <a href="/student" className="inline-flex items-center gap-2 font-semibold">
            <span className="text-slate-900">
              Token<span className="text-blue-600">HUB</span>
            </span>
            <span className="ml-2 rounded-md border px-2 py-0.5 text-xs text-slate-600">
              Student
            </span>
          </a>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-slate-900 text-slate-600">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right: notification + tokens + points + avatar */}
          <div className="flex items-center gap-3">
            {/* 🔔 Notification icon */}
            <a
              href="/student/notifications"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border bg-white text-slate-700"
              title="Notifications"
            >
              <span>🔔</span>
            </a>

            {/* 🪙 Total Tokens */}
            <div
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm bg-white"
              title="Total Tokens"
            >
              <span>🪙</span>
              <span className="font-medium">
                {loadingTokens ? "..." : totalTokens}
              </span>
            </div>

            {/* 🏆 Available Tokens */}
            <div
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm bg-white"
              title="Available Tokens"
            >
              <span>🏆</span>
              <span className="font-medium">
                {loadingTokens ? "..." : availablePoints}
              </span>
            </div>

            {/* Avatar dropdown */}
            <div className="relative" ref={dd}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700"
                aria-label="Profile menu"
              >
                <span>👤</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg">
                  <a href="/student/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">
                    View Profile
                  </a>
                  <a
                    href="/student/profile/edit"
                    className="block px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Edit Profile
                  </a>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem("accessToken");
                      sessionStorage.removeItem("user");
                      window.location.href = "/";
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <button className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm">
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
