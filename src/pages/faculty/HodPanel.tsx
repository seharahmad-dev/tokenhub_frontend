// src/pages/faculty/HodPanel.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";

const EVENT_API = import.meta.env.VITE_EVENT_API as string;

export default function HodPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Approved" | "Unapproved">("All");

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` }, withCredentials: true }), [token]);

  const me = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const hodBranch = useMemo(() => {
    // isHod holds branch string in your schema
    return me?.isHod ?? null;
  }, [me]);

  useEffect(() => {
    const load = async () => {
      if (!hodBranch) {
        setEvents([]);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const r = await axios.get(`${EVENT_API}/event/${encodeURIComponent(hodBranch)}/branch`, auth);
        const data = r?.data?.data ?? r?.data ?? [];
        setEvents(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("Failed to load branch events:", e);
        setErr("Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [hodBranch, auth]);

  const displayed = useMemo(() => {
    if (filter === "All") return events;
    return events.filter((ev) => (filter === "Approved" ? ev.permission === "Approved" : ev.permission !== "Approved"));
  }, [events, filter]);

  const approveEvent = async (id: string) => {
    if (!confirm("Approve this event?")) return;
    if (!hodBranch) {
      alert("HOD branch not set");
      return;
    }
    try {
      // send hodBranch in body as backend expects
      const r = await axios.post(`${EVENT_API}/event/${encodeURIComponent(id)}/approve`, { hodBranch }, auth);
      const updatedEvent = r?.data?.data ?? null;
      // update state using returned event if available, otherwise optimistic
      setEvents((s) => s.map((ev) => (String(ev._id) === String(id) ? (updatedEvent ?? { ...ev, permission: "Approved" }) : ev)));
    } catch (e: any) {
      console.error("Approve failed:", e);
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to approve event";
      alert(String(msg));
    }
  };

  const disapproveEvent = async (id: string) => {
    if (!confirm("Disapprove this event?")) return;
    if (!hodBranch) {
      alert("HOD branch not set");
      return;
    }
    try {
      const r = await axios.post(`${EVENT_API}/event/${encodeURIComponent(id)}/dis-approve`, { hodBranch }, auth);
      const updatedEvent = r?.data?.data ?? null;
      setEvents((s) => s.map((ev) => (String(ev._id) === String(id) ? (updatedEvent ?? { ...ev, permission: "Unapproved" }) : ev)));
    } catch (e: any) {
      console.error("Disapprove failed:", e);
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to disapprove event";
      alert(String(msg));
    }
  };

  if (!hodBranch) {
    return (
      <div className="min-h-screen bg-slate-50">
        <FacultyNavbar />
        <main className="container 2xl:px-0 px-4 py-8">
          <SectionCard title="HOD Panel">
            <EmptyState title="Not an HOD" subtitle="You are not assigned as HOD. Only HODs can access this panel." />
          </SectionCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <FacultyNavbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">HOD Panel — {hodBranch}</h1>
            <div className="flex items-center gap-3">
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 rounded border text-sm">
                <option value="All">All</option>
                <option value="Approved">Unapproved</option>
                <option value="Unapproved">Approved</option>
              </select>
            </div>
          </div>

          <SectionCard title="Events for your branch">
            {loading ? (
              <div className="p-4 text-center">Loading…</div>
            ) : err ? (
              <div className="p-4 text-rose-600">{err}</div>
            ) : displayed.length === 0 ? (
              <EmptyState title="No events" subtitle="No events found for your branch." />
            ) : (
              <div className="grid gap-3">
                {displayed.map((ev: any) => (
                  <div key={String(ev._id)} className="rounded border bg-white p-3 flex justify-between items-start">
                    <div>
                      <div className="font-medium">{ev.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{ev.description ?? ""}</div>
                      <div className="text-xs text-slate-400 mt-2">{ev.schedule ? new Date(ev.schedule).toLocaleString() : ""}</div>
                      <div className="text-xs text-slate-400 mt-1">Permission: {ev.permission}</div>
                    </div>
                    <div className="flex gap-2 items-start">
                      {ev.permission !== "Approved" && <button onClick={() => approveEvent(ev._id)} className="text-sm px-2 py-1 rounded border text-emerald-700">Approve</button>}
                      {ev.permission === "Approved" && <button onClick={() => disapproveEvent(ev._id)} className="text-sm px-2 py-1 rounded border text-rose-600">Disapprove</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
