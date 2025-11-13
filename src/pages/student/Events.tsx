import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import EventCard, { EventRow } from "../../components/student/EventCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const EVENT_API = import.meta.env.VITE_EVENT_API as string;
const REGISTRATION_API = import.meta.env.VITE_REGISTRATION_API as string;

type FilterKey = "upcoming" | "past" | "mine";

type RegistrationRow = {
  _id: string;
  eventId: string;
  teamName?: string;
  participantsId?: string[]; // not used for determining real participants
  teamLeaderId?: string;
  paymentId?: string;
  verifiedUsers?: string[];
  date?: string;
};

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("upcoming");

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const student = useAppSelector(selectStudent);

  // Set of event IDs that the student has registered (based on teamLeaderId or verifiedUsers)
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!mounted) return;
      setLoading(true);
      setErr(null);

      const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

      try {
        const eventReq = axios.get(`${EVENT_API}/event/all`, auth);

        // keep your existing registration path — returns list of registrations for this student
        const regReq =
          student && student._id
            ? axios.get(`${REGISTRATION_API}/registrations/student/${student._id}`, auth)
            : Promise.resolve({ data: [] });

        const [eventRes, regRes] = await Promise.all([eventReq, regReq]);

        if (!mounted) return;

        const rows: EventRow[] = eventRes.data?.data ?? eventRes.data ?? [];

        // <-- NEW: only keep events that are explicitly Approved
        const approvedEvents = rows.filter((r) => String(r.permission ?? "").toLowerCase() === "approved");

        setEvents(approvedEvents);

        // Preserve fallback local storage ids (if you still want them)
        const localRegistered = JSON.parse(sessionStorage.getItem("registeredEventIds") || "[]");
        const localParticipated = JSON.parse(sessionStorage.getItem("participatedEventIds") || "[]");

        const mine = new Set<string>([...localRegistered, ...localParticipated]);

        // Normalize registration response
        const regData: RegistrationRow[] =
          regRes?.data?.data ??
          regRes?.data ??
          [];

        if (Array.isArray(regData)) {
          for (const r of regData) {
            if (!r || !r.eventId) continue;
            const leaderMatches = !!student && !!r.teamLeaderId && String(r.teamLeaderId) === String(student._id);
            const verifiedMatches =
              !!student &&
              Array.isArray(r.verifiedUsers) &&
              r.verifiedUsers.some((id) => String(id) === String(student._id));

            if (leaderMatches || verifiedMatches) {
              mine.add(String(r.eventId));
            }
          }
        } else if (regData && typeof regData === "object") {
          // single object case (defensive)
          const r = regData as RegistrationRow;
          const leaderMatches = !!student && !!r.teamLeaderId && String(r.teamLeaderId) === String(student._id);
          const verifiedMatches =
            !!student && Array.isArray(r.verifiedUsers) && r.verifiedUsers.some((id) => String(id) === String(student._id));
          if (leaderMatches || verifiedMatches) mine.add(String(r.eventId));
        }

        setRegisteredEventIds(mine);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to fetch events/registrations");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [token, student]);

  const now = Date.now();
  const isPast = (isoOrDate: string | Date) => {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < now;
  };

  const filtered = useMemo(() => {
    const list = [...events].sort((a, b) => {
      const da = new Date(a.schedule ?? 0).getTime();
      const db = new Date(b.schedule ?? 0).getTime();
      return db - da; // recent first
    });

    if (filter === "upcoming") return list.filter((e) => e.schedule && !isPast(e.schedule));
    if (filter === "past") return list.filter((e) => e.schedule && isPast(e.schedule));

    return list.filter((e) => registeredEventIds.has(e._id));
  }, [events, filter, registeredEventIds]);

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-6 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">Events</h1>

            <div className="inline-flex rounded-lg border bg-white p-1">
              {(["upcoming", "past", "mine"] as FilterKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    filter === key ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {key === "upcoming" ? "Upcoming" : key === "past" ? "Past" : "My Events"}
                </button>
              ))}
            </div>
          </header>

          <SectionCard title="">
            {loading ? (
              <div className="rounded-xl border bg-white p-6 text-center">Loading…</div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-6 text-rose-600">{err}</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title={
                  filter === "upcoming"
                    ? "No upcoming events"
                    : filter === "past"
                    ? "No past events found"
                    : "You have no registered/participated events yet"
                }
                subtitle={
                  filter === "upcoming"
                    ? "Check back soon for new events."
                    : filter === "past"
                    ? "Try another filter."
                    : "Register for an event to see it here."
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((e) => (
                  <EventCard
                    key={e._id}
                    e={e}
                    // mark as participated if registered OR schedule is past
                    participated={registeredEventIds.has(e._id) || (e.schedule ? isPast(e.schedule) : false)}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
