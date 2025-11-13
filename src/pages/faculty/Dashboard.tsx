import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import EventsMini from "../../components/student/EventsMini";
import EventCard from "../../components/student/EventCard";
import LeaderboardMini from "../../components/student/LeaderboardMini";

/**
 * FacultyDashboard
 *
 * - Uses sessionStorage user (faculty) as auth context (keeps parity with current app)
 * - Left: Events organized by this faculty
 * - Right: Leaderboard of proctees (best-effort filtering by branch). If not possible, show top tokens with note.
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
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [leaderRows, setLeaderRows] = useState<any[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [leaderErr, setLeaderErr] = useState<string | null>(null);

  const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";
  const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";
  const FACULTY_API = (import.meta.env.VITE_FACULTY_API as string) || "";

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  useEffect(() => {
    // hydrate faculty from session user
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

  // fetch events organized by this faculty
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!me?._id) return;
      setEventsLoading(true);
      setErr(null);
      try {
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const r = await axios.get(`${EVENT_API}/event/all`, auth);
        const raw = r?.data?.data ?? r?.data ?? [];
        const arr: any[] = Array.isArray(raw) ? raw : [];

        // filter events where faculties includes this faculty id OR event.faculties contains their email OR organisingClub head etc.
        const filtered = arr.filter((ev: any) => {
          // check faculties array (string or object)
          if (Array.isArray(ev.faculties) && ev.faculties.length > 0) {
            // faculty ids or emails
            const set = new Set(ev.faculties.map((f: any) => (typeof f === "string" ? String(f) : String(f))));
            if (set.has(String(me._id)) || set.has(String(me.email))) return true;
          }
          // fallback: check if event has 'createdBy' or 'owner' equal to faculty id
          if (ev.createdBy && String(ev.createdBy) === String(me._id)) return true;
          // lastly: some events may have organisers with faculty id
          if (Array.isArray(ev.organizers)) {
            if (ev.organizers.some((o: any) => String(o) === String(me._id) || String(o?.facultyId) === String(me._id))) return true;
          }
          // no match
          return false;
        });

        if (mounted) setEvents(filtered);
      } catch (e: any) {
        console.error("Failed to load events for faculty:", e);
        if (mounted) {
          setErr("Failed to load events");
          setEvents([]);
        }
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [me?._id, EVENT_API, token]);

  // fetch leaderboard (token service) — try to restrict to faculty's branch (proctees) if token service returns student info
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

        // If items include nested student object with branch, filter by faculty.branch
        const mapped = arr.map((it: any) => {
          const studentObj = it.studentId ?? it.student ?? null;
          const id = (typeof studentObj === "string" && studentObj) || (studentObj && (studentObj._id || studentObj.id)) || it._id || it.studentId || "";
          const name = it.name || (studentObj && (studentObj.name || `${studentObj.firstName ?? ""} ${studentObj.lastName ?? ""}`)) || it.studentName || "Unknown";
          const branch = studentObj?.branch ?? it.branch ?? null;
          const points = Number(it.totalTokens ?? it.points ?? it.availableTokens ?? 0);
          return { id: String(id), name: String(name), branch, points, raw: it };
        });

        // if faculty branch present, prefer filtering by that branch (proctee view)
        const facultyBranch = me?.branch;
        let final: any[] = mapped;
        if (facultyBranch) {
          const byBranch = mapped.filter((m) => m.branch && String(m.branch).toUpperCase() === String(facultyBranch).toUpperCase());
          if (byBranch.length > 0) final = byBranch;
        }

        // sort desc
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

  // helper: map leaderRows to LeaderboardMini shape (Row)
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
      <FacultyNavbar tokens={0} />

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
                {eventsLoading ? (
                  <div className="p-4 text-center">Loading…</div>
                ) : events.length === 0 ? (
                  <EmptyState title="No events yet" subtitle="You haven't organized any events yet." />
                ) : (
                  <div className="space-y-3">
                    {events.map((ev) => (
                      <EventCard key={ev._id} e={ev as any} participated={false} />
                    ))}
                  </div>
                )}
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
