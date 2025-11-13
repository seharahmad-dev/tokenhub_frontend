// src/pages/faculty/FacultyDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EventsMini from "../../components/student/EventsMini";
import LeaderboardMini from "../../components/student/LeaderboardMini";
import FacultyEventsList from "../../components/faculty/FacultyEventsList";

/**
 * FacultyDashboard - updated to prefer faculty-specific events endpoint
 */

type Faculty = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  branch?: string;
  designation?: string;
  email?: string;
  role?: string;
};

type EventRow = {
  _id: string;
  title: string;
  description?: string;
  schedule?: string;
  venue?: string;
  capacity?: number;
  eligibility?: { branch?: string; semester?: string };
  faculties?: string[] | any[];
  organisingClub?: string;
  permission?: string;
};

export default function FacultyDashboard() {
  const [me, setMe] = useState<Faculty | null>(null);

  // events state
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [, setEventsErr] = useState<string | null>(null);

  // leaderboard state (unchanged)
  const [leaderRows, setLeaderRows] = useState<any[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [leaderErr, setLeaderErr] = useState<string | null>(null);

  const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";
  const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";
  const FACULTY_API = (import.meta.env.VITE_FACULTY_API as string) || "";

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setMe(parsed);
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!me?._id) return;
      setEventsLoading(true);
      setEventsErr(null);
      try {
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        // Use faculty API to get event snapshots (array of event IDs or event objects)
        if (!FACULTY_API) {
          setEvents([]);
          return;
        }
        const r = await axios.get(`${FACULTY_API}/faculty/${me._id}/events`, auth);
        const raw = r?.data?.data ?? r?.data ?? [];
        const arr: any[] = Array.isArray(raw) ? raw : [];

        // If arr contains strings (event ids), fetch full event objects
        if (arr.length > 0 && typeof arr[0] === "string") {
          const eventFetches = arr.map((eid) => axios.get(`${EVENT_API}/event/${encodeURIComponent(eid)}`, auth).then(res => res?.data?.data ?? res?.data).catch(() => null));
          const resolved = await Promise.all(eventFetches);
          const eventsResolved = resolved.filter(Boolean);
          if (mounted) setEvents(eventsResolved);
        } else {
          if (mounted) setEvents(arr);
        }
      } catch (e: any) {
        console.error("Failed to load faculty events:", e);
        if (mounted) {
          setEventsErr("Failed to load events");
          setEvents([]);
        }
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [me?._id, FACULTY_API, EVENT_API, token]);

  // leader board (unchanged)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLeaderLoading(true);
      setLeaderErr(null);
      try {
        if (!TOKEN_API) {
          setLeaderErr("Token service URL not set");
          return;
        }
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const r = await axios.get(`${TOKEN_API}/token/leaderboard/all`, auth);
        const raw = r?.data?.data ?? r?.data ?? [];
        const arr: any[] = Array.isArray(raw) ? raw : [];

        const mapped = arr.map((it: any) => {
          const studentObj = it.studentId ?? it.student ?? null;
          const id = (typeof studentObj === "string" && studentObj) || (studentObj && (studentObj._id || studentObj.id)) || it._id || it.studentId || "";
          const name = it.name || (studentObj && (studentObj.name || `${studentObj.firstName ?? ""} ${studentObj.lastName ?? ""}`)) || it.studentName || "Unknown";
          const branch = studentObj?.branch ?? it.branch ?? null;
          const points = Number(it.totalTokens ?? it.points ?? it.availableTokens ?? 0);
          return { id: String(id), name: String(name), branch, points, raw: it };
        });

        // faculty proctee-filter is not implemented here; keep for backward compatibility
        const facultyBranch = me?.branch;
        let final: any[] = mapped;
        if (facultyBranch) {
          const byBranch = mapped.filter((m) => m.branch && String(m.branch).toUpperCase() === String(facultyBranch).toUpperCase());
          if (byBranch.length > 0) final = byBranch;
        }

        final.sort((a, b) => b.points - a.points);

        if (mounted) setLeaderRows(final);
      } catch (e: any) {
        console.error("Failed to fetch leaderboard:", e);
        if (mounted) setLeaderErr("Failed to load leaderboard");
      } finally {
        if (mounted) setLeaderLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [TOKEN_API, me?.branch, token]);

  const leaderboardForMini = useMemo(() => {
    return leaderRows.map((r) => ({
      studentId: r.id,
      name: r.name,
      totalTokens: r.points,
      usn: undefined,
      email: undefined,
    }));
  }, [leaderRows]);

  return (
    <div className="min-h-screen bg-slate-50">
      <FacultyNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-8 space-y-6">
              <SectionCard title={`Welcome${me ? `, ${me.firstName ?? ""} ${me.lastName ?? ""}` : ""}`}>
                <p className="text-sm text-slate-600">
                  This dashboard shows events you are associated with. Manage event details from the Events page.
                </p>
              </SectionCard>

              <SectionCard title="Events organized by you">
                <FacultyEventsList events={events} loading={eventsLoading} />
              </SectionCard>

              <SectionCard title="All your events (compact)" action={<a href="/faculty/events" className="text-sm text-blue-600 hover:underline">View all</a>}>
                <EventsMini rows={events.map(e => ({ _id: e._id, title: e.title, schedule: e.schedule, venue: e.venue }))} loading={eventsLoading} onViewAll={() => { window.location.href = "/faculty/events"; }} />
              </SectionCard>
            </div>

            {/* RIGHT */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
              <SectionCard title="Proctee Leaderboard">
                {leaderLoading ? (
                  <div className="p-4 text-center">Loading leaderboard…</div>
                ) : leaderErr ? (
                  <div className="p-4 text-rose-600">{leaderErr}</div>
                ) : leaderboardForMini.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">No proctee data available. Showing global leaderboard will require token service to provide student branch info.</div>
                ) : (
                  <LeaderboardMini rows={leaderboardForMini as any} myId={me?._id} />
                )}
              </SectionCard>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
