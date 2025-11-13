import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import OrganizeEventModal from "../../components/faculty/OrganizeEventModalFaculty";

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
  const [allEvents, setAllEvents] = useState<RawEvent[]>([]);
  const [myEvents, setMyEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterMy, setFilterMy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [, setErr] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` }, withCredentials: true }),
    [token]
  );

  const me = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

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
    if (!me?._id) {
      setMyEvents([]);
      return;
    }
    try {
      setLoading(true);
      const r = await axios.get(`${FACULTY_API}/faculty/${encodeURIComponent(me._id)}/events`, auth);
      const payload = r?.data?.data ?? r?.data ?? [];
      setMyEvents(filterApproved(Array.isArray(payload) ? payload : []));
    } catch (e) {
      console.error("Failed to load my events:", e);
      setMyEvents([]);
    } finally {
      setLoading(false);
    }
  }, [FACULTY_API, me?._id, auth]);

  useEffect(() => {
    loadAll();
    loadMy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // callback after successful create from modal
  const onCreated = useCallback((created: any) => {
    if (!created) return;
    // only add created event to lists if it's approved
    if (isApproved(created)) {
      setMyEvents((s) => [created, ...s]);
      setAllEvents((s) => [created, ...s]);
    }
  }, []);

  const handleDelete = useCallback(
    async (eventId: string) => {
      if (!me?._id) {
        alert("Faculty identity missing");
        return;
      }
      const ok = confirm("Delete this event? This action cannot be undone.");
      if (!ok) return;
      try {
        // endpoint per your backend contract:
        await axios.delete(`${EVENT_API}/event/${encodeURIComponent(eventId)}/faculty/${encodeURIComponent(me._id)}`, auth);

        setMyEvents((s) => s.filter((e) => {
          const id = String(e._id ?? e.id ?? e.eventId ?? "");
          return id !== String(eventId);
        }));
        setAllEvents((s) => s.filter((e) => {
          const id = String(e._id ?? e.id ?? e.eventId ?? "");
          return id !== String(eventId);
        }));
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete event");
      }
    },
    [EVENT_API, me?._id, auth]
  );

  const displayed = filterMy ? myEvents : allEvents;

  return (
    <div className="min-h-screen bg-slate-50">
      <FacultyNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Events</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterMy((f) => !f)}
                className={`px-3 py-2 rounded border text-sm ${filterMy ? "bg-blue-50" : ""}`}
                title={filterMy ? "Show all events" : "Show only my organised events"}
              >
                {filterMy ? "Showing: My organised events" : "Showing: All events"}
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
              >
                Organise Event
              </button>
            </div>
          </div>

          <SectionCard title={filterMy ? "My organised events" : "All events"}>
            {loading ? (
              <div className="p-4 text-center">Loading…</div>
            ) : displayed.length === 0 ? (
              <EmptyState
                title="No events"
                subtitle={filterMy ? "You haven't organised any events yet." : "No events found."}
              />
            ) : (
              <div className="grid gap-3">
                {displayed.map((ev: RawEvent) => {
                  const id = String(ev._id ?? ev.id ?? ev.eventId ?? "");
                  const title = ev.title ?? ev.name ?? "Untitled event";
                  const isMy = Boolean(
                    me &&
                      (
                        (Array.isArray(ev.faculties) && ev.faculties.map((f: any) => String(f)).includes(String(me._id)))
                        || (ev.organisingFaculty && String(ev.organisingFaculty) === String(me._id))
                      )
                  );

                  return (
                    <div key={id} className="rounded border bg-white p-3 flex justify-between items-start">
                      <div>
                        <div className="font-medium">{title}</div>
                        <div className="text-xs text-slate-500 mt-1">{ev.description ?? ""}</div>
                        <div className="text-xs text-slate-400 mt-2">{ev.schedule ? new Date(ev.schedule).toLocaleString() : ""}</div>
                      </div>

                      <div className="flex gap-2 items-start">
                        {isMy && (
                          <button
                            onClick={() => handleDelete(id)}
                            className="text-sm px-2 py-1 rounded border text-rose-600"
                          >
                            Delete
                          </button>
                        )}
                        <a href={`/event/${encodeURIComponent(id)}`} className="text-sm px-2 py-1 rounded border text-slate-700">
                          View
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </main>

      <OrganizeEventModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={onCreated} />
    </div>
  );
}
