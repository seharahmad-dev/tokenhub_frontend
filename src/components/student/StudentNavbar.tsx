// src/pages/student/StudentNavbar.tsx
import { useEffect, useRef, useState } from "react";
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
  inviterId?: string; // back-compat if server still sends inviterId
  registrationId: string | null;
  eventName: string;
  read?: boolean;
  createdAt?: string;
  [k: string]: any;
};

export default function StudentNavbar({ tokens = 0, points = 0 }: { tokens?: number; points?: number }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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

  // click-outside handler for both panels
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

  // fetch tokens (unchanged)
  useEffect(() => {
    const fetchTokens = async () => {
      if (!student?._id) return;
      setLoadingTokens(true);
      try {
        const baseURL = import.meta.env.VITE_TOKEN_API || "";
        const resp = await axios.get(`${baseURL}/token/${student._id}/total`, { withCredentials: true });
        const data = resp?.data?.data;
        if (data) {
          setTotalTokens(data.totalTokens ?? 0);
          setAvailablePoints(data.availableTokens ?? 0);
        }
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

  // Fetch notifications when the panel opens (and also whenever student changes).
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
        const STUDENT_API = import.meta.env.VITE_STUDENT_API || ""; // e.g. http://localhost:4001
        // NOTE: expects endpoint GET /student/:id/notifications
        const resp = await axios.get(`${STUDENT_API}/student/${student._id}/notifications`, { withCredentials: true, timeout: 5000 });
        // support either shape: { data: { notifications: [...] } } or { data: [...] }
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

  // optional: fetch notifications when user signs in (so badge shows without clicking)
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
        // ignore — main fetch runs on open
      }
    })();
    return () => { mounted = false; };
  }, [student?._id]);

  // helper to mark a notification read locally
  const markNotificationReadLocally = (registrationId?: string | null) => {
    if (!registrationId) return;
    setNotifications(prev => prev.map(n => {
      if (String(n.registrationId) === String(registrationId)) {
        return { ...n, read: true };
      }
      return n;
    }));
  };

  // helper to call student API to mark as read (best-effort)
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

  // Accept invitation: call registration service accept endpoint
  const acceptInvitation = async (notif: Notification) => {
    if (!notif.registrationId || !student?._id) return;
    const REG_API = import.meta.env.VITE_REGISTRATION_API || ""; // e.g. http://localhost:4010
    setActionLoadingId(notif.registrationId);
    try {
      await axios.patch(
        `${REG_API}/registrations/${notif.registrationId}/accept`,
        { studentId: student._id },
        { withCredentials: true }
      );

      // mark notification as read (local + remote best-effort)
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

      // mark notification as read (local + remote best-effort)
      markNotificationReadLocally(notif.registrationId);
      markNotificationReadRemote(notif.registrationId);
    } catch (err) {
      console.error("Reject invitation failed:", err);
      setNotifError("Failed to reject invitation");
    } finally {
      setActionLoadingId(null);
    }
  };

  // unread / badge count (only unread notifications)
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="/student" className="inline-flex items-center gap-2 font-semibold">
            <span className="text-slate-900">
              Token<span className="text-blue-600">HUB</span>
            </span>
            <span className="ml-2 rounded-md border px-2 py-0.5 text-xs text-slate-600">Student</span>
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
          </nav>

          <div className="flex items-center gap-3">
            {student?.clubId && (
              <a
                href="/student/manage-club"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                Manage Club
              </a>
            )}

            <div
              className={`inline-flex items-center justify-center h-8 px-2.5 rounded-lg border bg-white text-sm font-medium ${hasSolvedToday ? "text-orange-600" : "text-slate-400"}`}
              title="Daily Streak"
            >
              <span>🔥</span>
              <span className="ml-1">{streakCount}</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                ref={notifBtnRef}
                onClick={() => setNotifOpen(v => !v)}
                className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg border bg-white text-slate-700"
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
                          <div
                            key={`${n.registrationId ?? "n"}-${idx}`}
                            className={`border rounded-md p-3 ${isRead ? "bg-slate-50 text-slate-400" : "bg-white"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className={`text-sm font-medium ${isRead ? "text-slate-400" : "text-slate-800"}`}>
                                  {n.eventName || "Invitation"}
                                </div>
                                <div className="text-xs" style={{ color: isRead ? undefined : undefined }}>
                                  <span className={isRead ? "text-slate-400" : "text-slate-500"}>
                                    Invited by {n.inviterName ?? n.inviterId ?? "Unknown"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : null}
                                </div>
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

            <div className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm bg-white">
              <span>🪙</span>
              <span>{loadingTokens ? "..." : totalTokens}</span>
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm bg-white">
              <span>🏆</span>
              <span>{loadingTokens ? "..." : availablePoints}</span>
            </div>

            {/* Profile dropdown (restored) */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(v => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700">👤</button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg">
                  <a href="/student/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">Your Profile</a>
                  <button onClick={() => { sessionStorage.removeItem("accessToken"); sessionStorage.removeItem("user"); window.location.href = "/"; }} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
