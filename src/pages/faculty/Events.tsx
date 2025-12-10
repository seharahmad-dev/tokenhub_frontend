import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAppSelector } from "../../app/hooks";
import { selectFaculty } from "../../app/facultySlice";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import OrganizeEventModal from "../../components/faculty/OrganizeEventModalFaculty";
import EventCard from "../../components/faculty/EventCard";

const EVENT_API = import.meta.env.VITE_EVENT_API as string;
const FACULTY_API = import.meta.env.VITE_FACULTY_API as string;

type RawEvent = {
  _id?: string;
  id?: string;
  eventId?: string;
  title?: string;
  name?: string;
  description?: string;
  schedule?: string;
  venue?: string;
  capacity?: number;
  faculties?: string[] | any[];
  organisingFaculty?: string;
  permission?: string | null;
};

type FilterKey = "upcoming" | "past" | "mine";

function isApproved(ev: RawEvent | null | undefined) {
  if (!ev) return false;
  const p = String(ev.permission ?? "").toLowerCase();
  return p === "approved";
}

function filterApproved(arr: any[]) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => isApproved(x));
}

export default function FacultyEventsPage(): JSX.Element {
  const facultyFromRedux = useAppSelector((s: any) => selectFaculty(s as any));
  const [allEvents, setAllEvents] = useState<RawEvent[]>([]);
  const [myEvents, setMyEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [, setErr] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` }, withCredentials: true }),
    [token]
  );

  const me = useMemo(() => {
    if (facultyFromRedux) return facultyFromRedux;
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [facultyFromRedux]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const r = await axios.get(`${EVENT_API}/event/all`, auth);
      const payload = r?.data?.data ?? r?.data ?? [];
      setAllEvents(filterApproved(Array.isArray(payload) ? payload : []));
    } catch (e) {
      console.error("Failed to load events:", e);
      setErr("Failed to load events");
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  }, [EVENT_API, auth]);

  const loadMy = useCallback(async () => {
    const facultyId = me?._id ?? "";
    if (!facultyId) {
      setMyEvents([]);
      return;
    }
    try {
      setLoading(true);
      const r = await axios.get(
        `${FACULTY_API}/faculty/${encodeURIComponent(facultyId)}/events`,
        auth
      );
      const payload = r?.data?.data ?? r?.data ?? [];
      if (Array.isArray(payload) && payload.length > 0 && typeof payload[0] === "string") {
        const fetches = payload.map((id: string) =>
          axios
            .get(`${EVENT_API}/event/${encodeURIComponent(id)}/event`, auth)
            .then((res) => res?.data?.data ?? res?.data)
            .catch(() => null)
        );
        const resolved = await Promise.all(fetches);
        setMyEvents(filterApproved(resolved.filter(Boolean) as any[]));
      } else {
        setMyEvents(filterApproved(Array.isArray(payload) ? payload : []));
      }
    } catch (e) {
      console.error("Failed to load my events:", e);
      setMyEvents([]);
    } finally {
      setLoading(false);
    }
  }, [FACULTY_API, me?._id, auth, EVENT_API]);

  useEffect(() => {
    loadAll();
    loadMy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreated = useCallback((created: any) => {
    if (!created) return;
    if (isApproved(created)) {
      setMyEvents((s) => [created, ...s]);
      setAllEvents((s) => [created, ...s]);
    }
  }, []);

  const now = Date.now();
  const isPast = (isoOrDate: string | Date) => {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < now;
  };

  const sorted = useMemo(() => {
    const list = [...allEvents].sort((a, b) => {
      const da = new Date(a.schedule ?? 0).getTime();
      const db = new Date(b.schedule ?? 0).getTime();
      return db - da;
    });
    return list;
  }, [allEvents]);

  const displayed = useMemo(() => {
    if (filter === "upcoming") return sorted.filter((e) => e.schedule && !isPast(e.schedule));
    if (filter === "past") return sorted.filter((e) => e.schedule && isPast(e.schedule));
    return myEvents;
  }, [filter, sorted, myEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <FacultyNavbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-emerald-900">Events</h1>

            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-white border border-emerald-100 p-1 shadow-sm">
                {(["upcoming", "past", "mine"] as FilterKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 text-sm rounded-xl transition ${
                      filter === key
                        ? "bg-emerald-600 text-white shadow"
                        : "text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    {key === "upcoming"
                      ? "Upcoming"
                      : key === "past"
                      ? "Past"
                      : "My Events"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700"
              >
                Organise Event
              </button>
            </div>
          </header>

          <SectionCard title="">
            {loading ? (
              <div className="rounded-xl border border-emerald-100 bg-white p-6 text-center shadow-sm text-emerald-700">
                Loading…
              </div>
            ) : displayed.length === 0 ? (
              <EmptyState
                title={
                  filter === "upcoming"
                    ? "No upcoming events"
                    : filter === "past"
                    ? "No past events found"
                    : "You have not organised any events yet"
                }
                subtitle={
                  filter === "upcoming"
                    ? "Check back soon for new events."
                    : filter === "past"
                    ? "Try another filter."
                    : "Organise an event to see it here."
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.map((ev: RawEvent) => {
                  const id = String(ev._id ?? ev.id ?? ev.eventId ?? "");
                  const title = ev.title ?? ev.name ?? "Untitled event";
                  const isMy = Boolean(
                    me &&
                      ((Array.isArray(ev.faculties) &&
                        ev.faculties.map((f: any) => String(f)).includes(String(me._id))) ||
                        (ev.organisingFaculty &&
                          String(ev.organisingFaculty) === String(me._id)))
                  );

                  return (
                    <div
                      key={id}
                      className="rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3"
                    >
                      <EventCard
                        e={{
                          _id: id,
                          title,
                          description: ev.description ?? "",
                          type: "",
                          venue: ev.venue,
                          schedule: ev.schedule,
                          capacity: ev.capacity,
                          eligibility: {},
                          organizers: {},
                          organisingBranch: "",
                          organisingClub: "",
                          permission: ev.permission ?? ""
                        }}
                      />

                      <div className="flex items-center justify-end gap-2">
                        {isMy && (
                          <a
                            href={`/faculty/manage-winners/${id}`}
                            className="px-3 py-2 rounded-xl text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Manage
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </main>

      <OrganizeEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onCreated}
      />
    </div>
  );
}
