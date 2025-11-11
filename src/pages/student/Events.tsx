import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import EventCard, { EventRow } from "../../components/student/EventCard";

const EVENT_API = import.meta.env.VITE_EVENT_API as string;

type FilterKey = "upcoming" | "past" | "mine";

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("upcoming");

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const me = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // Placeholder sources for "my events"
  // If you later add a real participation API, populate this Set from it.
  const [myEventIds, setMyEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const res = await axios.get(`${EVENT_API}/event/all`, auth);
        const rows: EventRow[] = res.data?.data ?? res.data ?? [];

        if (!mounted) return;

        // local placeholder: look for any stored "registered/participated" ids
        const localRegistered = JSON.parse(sessionStorage.getItem("registeredEventIds") || "[]");
        const localParticipated = JSON.parse(sessionStorage.getItem("participatedEventIds") || "[]");
        const mine = new Set<string>([...localRegistered, ...localParticipated]);

        setMyEventIds(mine);
        setEvents(rows);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to fetch events");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const now = Date.now();
  const isPast = (isoOrDate: string | Date) => {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < now;
  };

  const filtered = useMemo(() => {
    const list = [...events].sort((a, b) => {
      const da = new Date(a.schedule).getTime();
      const db = new Date(b.schedule).getTime();
      // recent first overall
      return db - da;
    });

    if (filter === "upcoming") return list.filter((e) => !isPast(e.schedule));
    if (filter === "past") return list.filter((e) => isPast(e.schedule));
    // "mine": registered/participated placeholder
    return list.filter((e) => myEventIds.has(e._id));
  }, [events, filter]);

  const handleRegister = (id: string) => {
    // Client-side placeholder to simulate a registration:
    // Persist id so button hides next render. Replace with real POST /event/:id/register later.
    const stored = JSON.parse(sessionStorage.getItem("registeredEventIds") || "[]");
    if (!stored.includes(id)) {
      const next = [...stored, id];
      sessionStorage.setItem("registeredEventIds", JSON.stringify(next));
      setMyEventIds(new Set<string>([...Array.from(myEventIds), id]));
    }
    // Optionally navigate to details/confirmation page
    // window.location.href = `/student/events/${id}`;
  };

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
                    participated={myEventIds.has(e._id) || isPast(e.schedule)}
                    onRegister={handleRegister}
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
