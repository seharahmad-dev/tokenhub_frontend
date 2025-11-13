// src/components/faculty/OrganizeEventModal.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const EVENT_API = import.meta.env.VITE_EVENT_API as string;

type Member = { studentId: string; name?: string; role?: string; email?: string; _id?: string };

export default function OrganizeEventModal({
  clubId,
  open,
  onClose,
  onCreated,
  token,
}: {
  clubId?: string; // optional now
  open: boolean;
  onClose: () => void;
  onCreated?: (ev: any) => void;
  token?: string;
}) {
  const [members,] = useState<Member[]>([]);
  const [loadingMembers, ] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Workshop");
  const [venue, setVenue] = useState("");
  const [schedule, setSchedule] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [branch, setBranch] = useState("*");
  const [semester, setSemester] = useState("*");
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const auth = useMemo(
    () => ({ headers: { Authorization: token ? `Bearer ${token}` : `Bearer ${sessionStorage.getItem("accessToken") || ""}` }, withCredentials: true }),
    [token]
  );

  // reset form when modal closed/opened
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setType("Workshop");
      setVenue("");
      setSchedule("");
      setCapacity("");
      setBranch("*");
      setSemester("*");
      setSelectedCoordinators([]);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e?: any) {
    e?.preventDefault?.();
    setError(null);

    // client-side validation
    if (!title?.trim() || !description?.trim() || !venue?.trim() || !schedule || !capacity) {
      setError("Please fill required fields (title, description, venue, schedule, capacity).");
      return;
    }

    // make sure EVENT_API is configured
    if (!EVENT_API) {
      setError("Event service URL is not configured.");
      return;
    }

    // build payload
    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      type,
      venue: venue.trim(),
      schedule: new Date(schedule).toISOString(),
      capacity: Number(capacity),
      eligibility: { branch, semester },
    };

    // pick correct endpoint (explicit 'undefined' when clubId absent)
    const endpoint = `${EVENT_API}/event/club/random/create`;

    setSubmitting(true);
    try {
      // merge headers and ensure content-type
      const postConfig = {
        ...(auth || {}),
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          ...(auth?.headers ?? {}),
        },
      };

      console.debug("OrganizeEventModal: POST", endpoint, payload, postConfig);

      const res = await axios.post(endpoint, payload, postConfig);
      const created = res?.data?.data ?? res?.data ?? null;

      // call callback if present (safely)
      try {
        onCreated?.(created);
      } catch (cbErr) {
        console.warn("onCreated callback error:", cbErr);
      }

      // close modal
      onClose();
    } catch (err: any) {
      console.error("Event create failed", err);
      // prefer server message
      const serverMsg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? String(err);
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!submitting) onClose(); }} />

      <form onSubmit={submit} className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Organise Event {clubId ? `— club ${clubId}` : ""}</h3>
          <button type="button" onClick={() => { if (!submitting) onClose(); }} className="text-sm text-slate-500">Close</button>
        </div>

        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}

        <div className="grid gap-3 mt-4">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full rounded border px-3 py-2" />
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="w-full rounded border px-3 py-2 h-24" />

          <div className="grid sm:grid-cols-2 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border px-3 py-2">
              <option>Workshop</option>
              <option>Hackathon</option>
              <option>Webinar</option>
              <option>Competition</option>
              <option>Codeathon</option>
            </select>
            <input required value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="rounded border px-3 py-2" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input required type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="rounded border px-3 py-2" />
            <input required type="number" min={1} value={String(capacity)} onChange={(e) => setCapacity(Number(e.target.value || ""))} placeholder="Capacity" className="rounded border px-3 py-2" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded border px-3 py-2">
              <option value="*">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ISE">ISE</option>
              <option value="EC">EC</option>
            </select>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="rounded border px-3 py-2">
              <option value="*">All Semesters</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </div>

          <div>
            <div className="text-sm text-slate-600 mb-2">Select coordinators (from club members)</div>
            {loadingMembers ? (
              <div className="text-sm text-slate-500">Loading members…</div>
            ) : (
              <div className="grid gap-2 max-h-40 overflow-auto">
                {members.length === 0 && <div className="text-sm text-slate-500">No members available</div>}
                {members.map((m) => {
                  const id = m.studentId ?? m._id ?? "";
                  return (
                    <label key={id} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCoordinators.includes(id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCoordinators((s) => [...s, id]);
                          else setSelectedCoordinators((s) => s.filter((x) => x !== id));
                        }}
                      />
                      <span>{m.name || m.email || id} <span className="text-xs text-slate-400">({m.role})</span></span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-3">
            <button type="button" onClick={() => { if (!submitting) onClose(); }} className="rounded px-3 py-2 border text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
              {submitting ? "Creating…" : "Create Event"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
