import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import EventsMini from "../../components/student/EventsMini";
import EventCard from "../../components/student/EventCard";
import LeaderboardMini from "../../components/student/LeaderboardMini";

/**
 * FacultyDashboard - updated to show PROCTEE leaderboard only (based on faculty.myStudents)
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
  const [, setErr] = useState<string | null>(null);

  const [leaderRows, setLeaderRows] = useState<any[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [leaderErr, setLeaderErr] = useState<string | null>(null);

  // proctee ids fetched from faculty service
  const [procteeIds, setProcteeIds] = useState<string[] | null>(null);

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

  // fetch proctee IDs from faculty service
  useEffect(() => {
    let mounted = true;
    const loadProctees = async () => {
      if (!me?._id || !FACULTY_API) {
        setProcteeIds([]);
        return;
      }
      try {
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const resp = await axios.get(`${FACULTY_API}/faculty/${me._id}/proctees`, auth);
        const data = resp?.data?.data ?? resp?.data ?? [];
        // data may be list of ids or snapshots
        const ids = Array.isArray(data)
          ? data.map((d: any) => (typeof d === "string" ? d : d._id ?? d.id ?? null)).filter(Boolean)
          : [];
        if (mounted) setProcteeIds(ids);
      } catch (e) {
        console.error("Failed to fetch proctees:", e);
        if (mounted) setProcteeIds([]);
      }
    };

    loadProctees();
    return () => { mounted = false; };
  }, [me?._id, FACULTY_API, token]);

  // fetch events organized by this faculty (unchanged)
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

        const filtered = arr.filter((ev: any) => {
          if (Array.isArray(ev.faculties) && ev.faculties.length > 0) {
            const set = new Set(ev.faculties.map((f: any) => (typeof f === "string" ? String(f) : String(f))));
            if (set.has(String(me._id)) || set.has(String(me.email))) return true;
          }
          if (ev.createdBy && String(ev.createdBy) === String(me._id)) return true;
          if (Array.isArray(ev.organizers)) {
            if (ev.organizers.some((o: any) => String(o) === String(me._id) || String(o?.facultyId) === String(me._id))) return true;
          }
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

  // fetch leaderboard and filter to proctees only
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

        // map raw into usable entries
        const mapped = arr.map((it: any) => {
          const studentObj = it.studentId ?? it.student ?? null;
          const id = (typeof studentObj === "string" && studentObj) || (studentObj && (studentObj._id || studentObj.id)) || it._id || it.studentId || "";
          const name = it.name || (studentObj && (studentObj.name || `${studentObj.firstName ?? ""} ${studentObj.lastName ?? ""}`)) || it.studentName || "Unknown";
          const points = Number(it.totalTokens ?? it.points ?? it.availableTokens ?? 0);
          return { id: String(id), name: String(name), points, raw: it, studentObj };
        });

        // if we have proctees, restrict to them only
        if (procteeIds && procteeIds.length > 0) {
          const proSet = new Set(procteeIds.map((x) => String(x)));
          const filtered = mapped.filter((m) => {
            // match nested student id or top-level id
            if (!m.id) return false;
            if (proSet.has(String(m.id))) return true;
            // sometimes raw may have student as object with _id in different property:
            const nestedId = (m.studentObj && (m.studentObj._id || m.studentObj.id)) ?? null;
            if (nestedId && proSet.has(String(nestedId))) return true;
            return false;
          });
          filtered.sort((a, b) => b.points - a.points);
          if (mounted) setLeaderRows(filtered);
        } else {
          // no proctees assigned — return empty list (or optionally global with note)
          if (mounted) setLeaderRows([]); // we intentionally do NOT show global list
        }
      } catch (e: any) {
        console.error("Failed to fetch leaderboard:", e);
        if (mounted) setLeaderErr("Failed to load leaderboard");
      } finally {
        if (mounted) setLeaderLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [TOKEN_API, procteeIds, token]);

  // convert leaderRows -> LeaderboardMini shape
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
                ) : procteeIds && procteeIds.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">You have no proctees assigned yet.</div>
                ) : leaderboardForMini.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">No proctee leaderboard data available.</div>
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
