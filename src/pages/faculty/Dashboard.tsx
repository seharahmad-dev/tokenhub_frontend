import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAppSelector } from "../../app/hooks";
import { selectFaculty } from "../../app/facultySlice";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EventsMini from "../../components/student/EventsMini";
import FacultyEventsList from "../../components/faculty/FacultyEventsList";
import FacultyProcteeLeaderboard from "../../components/faculty/FacultyProcteeLeaderboard";

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
  const facultyFromRedux = useAppSelector((s: any) => selectFaculty(s as any));
  const [me, setMe] = useState<Faculty | null>(() => facultyFromRedux ?? null);

  // events state
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [, setEventsErr] = useState<string | null>(null);

  // proctee leaderboard state
  const [procteeRows, setProcteeRows] = useState<any[]>([]);
  const [procteeLoading, setProcteeLoading] = useState(false);
  const [procteeErr, setProcteeErr] = useState<string | null>(null);

  const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";
  const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";
  const FACULTY_API = (import.meta.env.VITE_FACULTY_API as string) || "";

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  // keep redux -> local state in sync; fallback to session if redux empty
  useEffect(() => {
    if (facultyFromRedux) {
      setMe(facultyFromRedux);
      return;
    }
    try {
      const raw = sessionStorage.getItem("user");
      setMe(raw ? JSON.parse(raw) : null);
    } catch {
      setMe(null);
    }
  }, [facultyFromRedux]);

  // load events using new faculty endpoint
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const facultyId = me?._id ?? "";
      if (!facultyId) return;
      setEventsLoading(true);
      setEventsErr(null);
      try {
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        if (!FACULTY_API) {
          if (mounted) setEvents([]);
          return;
        }

        const r = await axios.get(`${FACULTY_API}/faculty/${encodeURIComponent(facultyId)}/events`, auth);
        const raw = r?.data?.data ?? r?.data ?? [];
        const arr: any[] = Array.isArray(raw) ? raw : [];

        // If arr contains event ids (strings), resolve each via EVENT_API /event/:id
        if (arr.length > 0 && typeof arr[0] === "string") {
          const base = EVENT_API.replace(/\/+$/, "");
          const eventFetches = arr.map((eid) =>
            axios
              .get(`${EVENT_API}/event/${encodeURIComponent(eid)}/event`, auth)
              .then((res) => res?.data?.data ?? res?.data)
              .catch((err) => {
                console.warn(`Failed to fetch event ${eid}:`, err?.message ?? err);
                return null;
              })
          );
          const resolved = await Promise.all(eventFetches);
          const eventsResolved = resolved.filter(Boolean) as EventRow[];
          if (mounted) setEvents(eventsResolved);
        } else {
          // assume arr is event objects
          if (mounted) setEvents(arr as EventRow[]);
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
    return () => {
      mounted = false;
    };
  }, [me?._id, FACULTY_API, EVENT_API, token]);

  /* Proctee leaderboard (unchanged logic) */
  useEffect(() => {
    let mounted = true;
    const loadProcteesLeaderboard = async () => {
      if (!me?._id) return;
      setProcteeLoading(true);
      setProcteeErr(null);
      try {
        if (!FACULTY_API) {
          setProcteeErr("Faculty service URL not set");
          setProcteeRows([]);
          return;
        }

        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

        const resp = await axios.get(`${FACULTY_API}/faculty/${encodeURIComponent(me._id)}/proctees`, auth).catch((err) => {
          console.warn("Proctees fetch failed:", err?.message ?? err);
          return null;
        });

        let procteesPayload: any[] = [];
        if (resp && resp.data) {
          const payload = resp?.data?.data ?? resp?.data ?? null;
          if (Array.isArray(payload)) {
            procteesPayload = payload;
          } else if (payload && Array.isArray(payload?.proctees)) {
            procteesPayload = payload.proctees;
          }
        }

        if (!procteesPayload || procteesPayload.length === 0) {
          if (mounted) setProcteeRows([]);
          setProcteeLoading(false);
          return;
        }

        const normalized = procteesPayload
          .map((p) => {
            if (!p) return null;
            if (typeof p === "string") return { _id: p };
            if (typeof p === "object" && (p._id || p.id)) {
              const id = p._id ?? p.id;
              const name =
                p.firstName || p.lastName
                  ? `${String(p.firstName ?? "")} ${String(p.lastName ?? "")}`.trim()
                  : p.name ?? p.email ?? "";
              return { _id: String(id), name, usn: p.usn ?? undefined, email: p.email ?? undefined };
            }
            return null;
          })
          .filter(Boolean) as { _id: string; name?: string; usn?: string; email?: string }[];

        if (!TOKEN_API) {
          const rowsNoToken = normalized.map((p) => ({
            studentId: p._id,
            name: p.name ?? "Unknown",
            usn: p.usn,
            email: p.email,
            totalTokens: 0,
          }));
          if (mounted) setProcteeRows(rowsNoToken);
          return;
        }

        const tokenBase = TOKEN_API.replace(/\/+$/, "");
        const promises = normalized.map(async (p) => {
          try {
            const r = await axios.get(`${tokenBase}/token/${encodeURIComponent(p._id)}/total`, auth);
            const data = r?.data?.data ?? r?.data ?? null;
            const total = Number(data?.totalTokens ?? data?.total ?? data?.availableTokens ?? 0);
            return {
              studentId: p._id,
              name: p.name ?? `${p.email ?? "Unknown"}`,
              usn: p.usn,
              email: p.email,
              totalTokens: Number.isNaN(total) ? 0 : total,
            };
          } catch (err) {
            console.warn(`Failed to load token summary for ${p._id}`, (err as Error)?.message ?? err);
            return {
              studentId: p._id,
              name: p.name ?? `${p.email ?? "Unknown"}`,
              usn: p.usn,
              email: p.email,
              totalTokens: 0,
            };
          }
        });

        const resolved = await Promise.all(promises);
        resolved.sort((a, b) => (Number(b.totalTokens) || 0) - (Number(a.totalTokens) || 0));

        if (mounted) setProcteeRows(resolved);
      } catch (err: any) {
        console.error("Failed to build proctee leaderboard:", err);
        if (mounted) {
          setProcteeErr("Failed to fetch proctee leaderboard");
          setProcteeRows([]);
        }
      } finally {
        if (mounted) setProcteeLoading(false);
      }
    };

    loadProcteesLeaderboard();
    return () => {
      mounted = false;
    };
  }, [me?._id, FACULTY_API, TOKEN_API, token]);

  const leaderboardForMini = useMemo(() => {
    return procteeRows.map((r) => ({
      studentId: r.studentId,
      name: r.name,
      totalTokens: r.totalTokens,
      usn: r.usn,
      email: r.email,
    }));
  }, [procteeRows]);

  return (
    <div className="min-h-screen bg-white">
      <FacultyNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-8 space-y-6">
              <SectionCard title={`Welcome${me ? `, ${me.firstName ?? ""} ${me.lastName ?? ""}` : ""}`}>
                <p className="text-sm text-emerald-700">
                  This dashboard shows events you are associated with. Manage event details from the Events page.
                </p>
              </SectionCard>

              <SectionCard title="Events organized by you">
                <FacultyEventsList events={events} loading={eventsLoading} />
              </SectionCard>
            </div>

            {/* RIGHT */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
              <SectionCard title="Proctee Leaderboard">
                {procteeLoading ? (
                  <div className="p-4 text-center">Loading leaderboard…</div>
                ) : procteeErr ? (
                  <div className="p-4 text-rose-600">{procteeErr}</div>
                ) : leaderboardForMini.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">
                    No proctee data available. Ensure your proctees are assigned to you in the Faculty service.
                  </div>
                ) : (
                  <FacultyProcteeLeaderboard rows={leaderboardForMini as any} myId={me?._id} />
                )}
              </SectionCard>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
