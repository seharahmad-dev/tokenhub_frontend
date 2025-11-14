// src/pages/student/StudentNavbar.tsx
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";
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

type Notification = {
  inviterName?: string;
  inviterId?: string;
  registrationId: string | null;
  eventName: string;
  read?: boolean;
  createdAt?: string;
  [k: string]: any;
};

export default function StudentNavbar({ tokens = 0, points = 0 }: { tokens?: number; points?: number }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notifBtnRef = useRef<HTMLButtonElement | null>(null);

  const [totalTokens, setTotalTokens] = useState(tokens);
  const [availablePoints, setAvailablePoints] = useState(points);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [hasSolvedToday, setHasSolvedToday] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const student = useAppSelector(selectStudent);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (notifOpen) {
        if (notifRef.current && !notifRef.current.contains(target) && !notifBtnRef.current?.contains(target)) {
          setNotifOpen(false);
        }
      }
      if (profileOpen) {
        if (profileRef.current && !profileRef.current.contains(target)) {
          setProfileOpen(false);
        }
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen, profileOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!student?._id) return;
      setLoadingTokens(true);
      try {
        const baseURL = import.meta.env.VITE_TOKEN_API || "";
        const resp = await axios.get(`${baseURL}/token/${student._id}/total`, { withCredentials: true });
        const payload = resp?.data?.data ?? resp?.data ?? null;

        let total: number | undefined;
        let available: number | undefined;

        const obj = payload?.token ?? payload ?? null;
        if (obj && typeof obj === "object") {
          if (typeof obj.totalTokens === "number") total = obj.totalTokens;
          if (typeof obj.availableTokens === "number") available = obj.availableTokens;
          if (typeof payload.totalTokens === "number" && total === undefined) total = payload.totalTokens;
          if (typeof payload.availableTokens === "number" && available === undefined) available = payload.availableTokens;
        }

        if (total !== undefined) setTotalTokens(total);
        if (available !== undefined) setAvailablePoints(available);
      } catch (err: any) {
        console.error("Error fetching tokens:", err);
      } finally {
        setLoadingTokens(false);
      }
    };
    fetchTokens();
  }, [student?._id]);

  useEffect(() => {
    setStreakCount(5);
    setHasSolvedToday(true);
  }, []);

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    if (!notifOpen) return;
    if (!student?._id) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      setNotifError(null);
      try {
        const STUDENT_API = import.meta.env.VITE_STUDENT_API || "";
        const resp = await axios.get(`${STUDENT_API}/student/${student._id}/notifications`, { withCredentials: true, timeout: 5000 });
        const payload = resp?.data?.data ?? resp?.data ?? null;
        const notifs: Notification[] = Array.isArray(payload) ? payload : Array.isArray(payload?.notifications) ? payload.notifications : [];
        if (!cancelled) setNotifications(notifs);
      } catch (err: any) {
        console.error("Failed to fetch notifications:", err);
        if (!cancelled) setNotifError("Failed to load notifications");
      } finally {
        if (!cancelled) setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    return () => { cancelled = true; };
  }, [notifOpen, student?._id]);

  useEffect(() => {
    if (!student?._id) return;
    let mounted = true;
    (async () => {
      try {
        const STUDENT_API = import.meta.env.VITE_STUDENT_API || "";
        const resp = await axios.get(`${STUDENT_API}/student/${student._id}/notifications`, { withCredentials: true, timeout: 5000 });
        const payload = resp?.data?.data ?? resp?.data ?? null;
        const notifs: Notification[] = Array.isArray(payload) ? payload : Array.isArray(payload?.notifications) ? payload.notifications : [];
        if (mounted) setNotifications(notifs);
      } catch (err) {
      }
    })();
    return () => { mounted = false; };
  }, [student?._id]);

  const markNotificationReadLocally = (registrationId?: string | null) => {
    if (!registrationId) return;
    setNotifications(prev => prev.map(n => {
      if (String(n.registrationId) === String(registrationId)) {
        return { ...n, read: true };
      }
      return n;
    }));
  };

  const markNotificationReadRemote = async (registrationId?: string | null) => {
    if (!registrationId || !student?._id) return;
    const STUDENT_API = import.meta.env.VITE_STUDENT_API || "";
    try {
      await axios.patch(
        `${STUDENT_API}/student/${student._id}/notifications/${registrationId}/read`,
        {},
        { withCredentials: true, timeout: 4000 }
      );
    } catch (err) {
      console.error("Failed to mark notification read remotely:", err);
    }
  };

  const acceptInvitation = async (notif: Notification) => {
    if (!notif.registrationId || !student?._id) return;
    const REG_API = import.meta.env.VITE_REGISTRATION_API || "";
    setActionLoadingId(notif.registrationId);
    try {
      await axios.patch(
        `${REG_API}/registrations/${notif.registrationId}/accept`,
        { studentId: student._id },
        { withCredentials: true }
      );
      markNotificationReadLocally(notif.registrationId);
      markNotificationReadRemote(notif.registrationId);
    } catch (err) {
      console.error("Accept invitation failed:", err);
      setNotifError("Failed to accept invitation");
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectInvitation = async (notif: Notification) => {
    if (!notif.registrationId || !student?._id) return;
    const REG_API = import.meta.env.VITE_REGISTRATION_API || "";
    setActionLoadingId(notif.registrationId);
    try {
      await axios.patch(
        `${REG_API}/registrations/${notif.registrationId}/reject`,
        { studentId: student._id },
        { withCredentials: true }
      );
      markNotificationReadLocally(notif.registrationId);
      markNotificationReadRemote(notif.registrationId);
    } catch (err) {
      console.error("Reject invitation failed:", err);
      setNotifError("Failed to reject invitation");
    } finally {
      setActionLoadingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  async function handleLogout() {
    try {
      const base = import.meta.env.VITE_STUDENT_API ?? "";
      await axios.post(`${base}/student/logout`, {}, { withCredentials: true });
    } catch {
    } finally {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
      window.location.href = "/";
    }
  }

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/75 backdrop-blur-sm">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="/student" className="inline-flex items-center gap-2 font-semibold">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-900">Token</span>
                <span className="text-blue-600">HUB</span>
              </div>
            </div>
            <span className="ml-2 rounded-md border border-blue-100 px-2 py-0.5 text-xs text-slate-600 bg-white/60">Student</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`px-2 py-1 rounded-md transition-colors duration-150 ${
                  isActive(l.href)
                    ? "text-blue-700 font-medium bg-blue-50"
                    : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-50 transition"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5 text-blue-700" /> : <Menu className="w-5 h-5 text-blue-700" />}
            </button>

            {student?.clubId && (
              <a href="/student/manage-club" className="hidden sm:inline-block bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
                Manage Club
              </a>
            )}

            {/* <div className={`inline-flex items-center justify-center h-8 px-2.5 rounded-xl bg-white/60 backdrop-blur text-sm font-medium ${hasSolvedToday ? "text-orange-600" : "text-slate-400"}`} title="Daily Streak"> */}


            <div className="relative">
              <button
                ref={notifBtnRef}
                onClick={() => setNotifOpen(v => !v)}
                className="relative inline-flex items-center justify-center h-8 w-8 rounded-xl bg-white/60 backdrop-blur text-slate-700"
                title="Notifications"
                aria-expanded={notifOpen}
                aria-haspopup="true"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-rose-600 text-white rounded-full px-1 leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div ref={notifRef} className="absolute right-0 mt-2 w-80 max-h-[60vh] overflow-auto rounded-xl border bg-white shadow-lg z-50">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Notifications</h4>
                      <button onClick={() => setNotifications([])} className="text-xs text-slate-500 hover:text-slate-700">Clear</button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {loadingNotifications ? (
                      <div className="text-center text-sm text-slate-500 py-8">Loading…</div>
                    ) : notifError ? (
                      <div className="text-center text-sm text-rose-600 py-4">{notifError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 py-6">No notifications</div>
                    ) : (
                      notifications.map((n, idx) => {
                        const isRead = !!n.read;
                        return (
                          <div key={`${n.registrationId ?? "n"}-${idx}`} className={`border rounded-md p-3 ${isRead ? "bg-slate-50 text-slate-400" : "bg-white"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className={`text-sm font-medium ${isRead ? "text-slate-400" : "text-slate-800"}`}>{n.eventName || "Invitation"}</div>
                                <div className="text-xs">
                                  <span className={isRead ? "text-slate-400" : "text-slate-500"}>Invited by {n.inviterName ?? n.inviterId ?? "Unknown"}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : null}</div>
                              </div>

                              {n.registrationId ? (
                                isRead ? (
                                  <div className="text-xs text-slate-400">Handled</div>
                                ) : (
                                  <div className="flex flex-col items-end gap-2">
                                    <button
                                      onClick={() => acceptInvitation(n)}
                                      disabled={actionLoadingId === n.registrationId}
                                      className="text-xs px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                                    >
                                      {actionLoadingId === n.registrationId ? "…" : "Accept"}
                                    </button>
                                    <button
                                      onClick={() => rejectInvitation(n)}
                                      disabled={actionLoadingId === n.registrationId}
                                      className="text-xs px-3 py-1 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-60"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )
                              ) : (
                                <div className="text-xs text-slate-500">Info</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-sm bg-white/60 backdrop-blur">
              <span>🪙</span>
              <span>{loadingTokens ? "..." : availablePoints}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-sm bg-white/60 backdrop-blur">
              <span>🏆</span>
              <span>{loadingTokens ? "..." : totalTokens}</span>
            </div>

            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(v => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                { (user?.firstName || user?.name || "A")[0]?.toUpperCase() }
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg">
                  <a href="/student/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">Your Profile</a>
                  <button
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-slate-200">
            <div className="flex flex-col gap-2 pt-4 px-3">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`block px-3 py-2 rounded-md text-sm transition ${isActive(l.href) ? "text-blue-700 font-medium bg-blue-50" : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}

              <a href="/student/profile" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-md text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50">Profile</a>

              {student?.clubId && (
                <a href="/student/manage-club" onClick={() => setMenuOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium">Manage Club</a>
              )}

              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-all duration-150"
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
