import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import FacultyEventCard from "../../components/faculty/FacultyEventCard";
import OrganizeEventModalFaculty from "../../components/faculty/OrganizeEventModalFaculty";

type EventRow = {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  venue?: string;
  schedule?: string;
  capacity?: number;
  eligibility?: { branch?: string; semester?: string };
  faculties?: any[];
  organizers?: any[];
  organizingBranch?: string;
  permission?: string;
  createdBy?: string;
};

export default function FacultyEventsPage() {
  const [me, setMe] = useState<any | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [openModal, setOpenModal] = useState(false);

  const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";
  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user");
      if (raw) setMe(JSON.parse(raw));
      else setMe(null);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const r = await axios.get(`${EVENT_API}/event/all`, auth);
        const raw = r?.data?.data ?? r?.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        if (mounted) setEvents(arr);
      } catch (e: any) {
        console.error("Failed to fetch events:", e);
        if (mounted) setErr("Failed to load events");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (EVENT_API) load();
    return () => { mounted = false; };
  }, [EVENT_API, token]);

  const myEvents = useMemo(() => {
    if (!me) return [];
    return events.filter((ev) => {
      // check faculties array for this faculty id or email
      if (Array.isArray(ev.faculties) && ev.faculties.length > 0) {
        const set = new Set(ev.faculties.map((f: any) => (typeof f === "string" ? String(f) : String(f))));
        if (set.has(String(me._id)) || set.has(String(me.email))) return true;
      }
      if (ev.createdBy && String(ev.createdBy) === String(me._id)) return true;
      if (Array.isArray(ev.organizers) && ev.organizers.some((o: any) => String(o) === String(me._id) || String(o?.facultyId) === String(me._id))) return true;
      return false;
    });
  }, [events, me]);

  const shown = filter === "all" ? events : myEvents;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This action cannot be undone.")) return;
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      await axios.delete(`${EVENT_API}/event/${id}`, auth);
      // refresh local list
      setEvents((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event. See console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <FacultyNavbar />

      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          <SectionCard
            title="Events"
            action={
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-600">{events.length} events</div>
                <button onClick={() => setOpenModal(true)} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
                  Organize Event
                </button>
              </div>
            }
          >
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>All events</button>
              <button onClick={() => setFilter("mine")} className={`px-3 py-1 rounded ${filter === "mine" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>My events</button>
            </div>

            {loading ? (
              <div className="p-6 text-center">Loading events…</div>
            ) : err ? (
              <div className="p-4 text-rose-600">{err}</div>
            ) : shown.length === 0 ? (
              <EmptyState title="No events" subtitle={filter === "mine" ? "You have not organized any events yet." : "No events available."} />
            ) : (
              <div className="space-y-3">
                {shown.map((ev) => {
                  // allow manage/delete if faculty is organizer/creator
                  const canManage = myEvents.some((m) => m._id === ev._id);
                  return (
                    <FacultyEventCard key={ev._id} e={ev as any} showManage={canManage} onManage={handleDelete} />
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </main>

      <OrganizeEventModalFaculty open={openModal} onClose={() => setOpenModal(false)} onCreated={(ev) => {
        // append created event to events list
        if (ev) setEvents((prev) => [ev, ...prev]);
      }} />
    </div>
  );
}
