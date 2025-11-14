import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAppSelector } from "../../app/hooks";

const CLUB_API = import.meta.env.VITE_CLUB_API as string;
const EVENT_API = import.meta.env.VITE_EVENT_API as string;

type Member = { studentId: string; name?: string; role?: string; email?: string; _id?: string };

const INTEREST_OPTIONS = [
  "Artificial Intelligence","Machine Learning","Web Development","Mobile App Development","Cybersecurity",
  "Cloud Computing","DevOps","Blockchain","IoT (Internet of Things)","Data Science","Competitive Programming",
  "Open Source","UI/UX Design","Game Development","Embedded Systems","AR/VR","Big Data","Software Engineering",
  "Networking","Database Management",
];

export default function OrganizeEventModal({
  clubId,
  open,
  onClose,
  onCreated,
  token,
}: {
  clubId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: (ev: any) => void;
  token?: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Workshop");
  const [venue, setVenue] = useState("");
  const [schedule, setSchedule] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [eligibilityBranch, setEligibilityBranch] = useState("*");
  const [semester, setSemester] = useState("*");
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [interestInput, setInterestInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const auth = useMemo(
    () => ({ headers: { Authorization: token ? `Bearer ${token}` : `Bearer ${sessionStorage.getItem("accessToken") || ""}` }, withCredentials: true }),
    [token]
  );

  const studentBranch = useAppSelector((state: any) => state?.student?.student?.branch ?? "");

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        setError(null);
        const res = await axios.get(`${CLUB_API}/club/${clubId}`, auth);
        const club = res?.data?.data ?? res?.data;
        const rawMembers = club?.members ?? [];
        const parsed: Member[] = rawMembers.map((m: any) => ({
          studentId: m.studentId ?? m._id ?? String(m.student?._id ?? ""),
          name: m.name ?? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(),
          role: m.role,
          email: m.email,
        }));
        if (mounted) setMembers(parsed);
      } catch (err: any) {
        console.error("Failed to load club members", err);
        if (mounted) setError("Failed to load club members");
      } finally {
        if (mounted) setLoadingMembers(false);
      }
    };
    loadMembers();
    return () => { mounted = false; };
  }, [open, clubId, auth]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setHighlightIndex(0);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = interestInput.trim().toLowerCase();
    return INTEREST_OPTIONS.filter((it) => {
      if (selectedInterests.includes(it)) return false;
      if (!q) return true;
      return it.toLowerCase().includes(q);
    });
  }, [interestInput, selectedInterests]);

  function addInterest(it: string) {
    if (!it) return;
    if (selectedInterests.includes(it)) return;
    setSelectedInterests((s) => [...s, it]);
    setInterestInput("");
    setDropdownOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function removeInterest(it: string) {
    setSelectedInterests((s) => s.filter((x) => x !== it));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, Math.max(0, filteredOptions.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = filteredOptions[highlightIndex];
      if (pick) addInterest(pick);
      return;
    }
    if (e.key === "Backspace" && interestInput === "" && selectedInterests.length > 0) {
      e.preventDefault();
      setSelectedInterests((s) => s.slice(0, -1));
    }
    if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  }

  if (!open) return null;

  async function submit(e?: any) {
    e?.preventDefault?.();
    setError(null);
    if (!title?.trim() || !description?.trim() || !venue?.trim() || !schedule || !capacity) {
      setError("Please fill required fields (title, description, venue, schedule, capacity).");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        type,
        venue: venue.trim(),
        schedule: new Date(schedule).toISOString(),
        capacity: Number(capacity),
        eligibility: { branch: eligibilityBranch, semester },
        coordinators: selectedCoordinators.map((s) => ({ studentId: s })),
        organisingBranch: studentBranch && studentBranch !== "*" ? String(studentBranch) : "",
        interests: selectedInterests,
      };

      const res = await axios.post(`${EVENT_API}/event/club/${clubId}/create`, payload, auth);
      const created = res?.data?.data ?? res?.data ?? null;
      onCreated?.(created);
      onClose();
    } catch (err: any) {
      console.error("Event create failed", err);
      setError(err?.response?.data?.message || err?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <form onSubmit={submit} className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">Organise Event</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}

        <div className="grid gap-3 mt-4">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full rounded-xl border border-blue-100 px-3 py-2 bg-white" />
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="w-full rounded-xl border border-blue-100 px-3 py-2 h-24 bg-white" />

          <div className="grid sm:grid-cols-2 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-blue-100 px-3 py-2 bg-white">
              <option>Workshop</option>
              <option>Hackathon</option>
              <option>Webinar</option>
              <option>Competition</option>
              <option>Codeathon</option>
            </select>
            <input required value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="rounded-xl border border-blue-100 px-3 py-2 bg-white" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input required type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="rounded-xl border border-blue-100 px-3 py-2 bg-white" />
            <input required type="number" min={1} value={String(capacity)} onChange={(e) => setCapacity(Number(e.target.value || ""))} placeholder="Capacity" className="rounded-xl border border-blue-100 px-3 py-2 bg-white" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <select value={eligibilityBranch} onChange={(e) => setEligibilityBranch(e.target.value)} className="rounded-xl border border-blue-100 px-3 py-2 bg-white">
              <option value="*">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ISE">ISE</option>
              <option value="EC">EC</option>
            </select>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="rounded-xl border border-blue-100 px-3 py-2 bg-white">
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

          <div ref={containerRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Interests (optional)</label>

            <div
              className="min-h-[44px] w-full rounded-xl border border-blue-100 px-3 py-2 flex items-center gap-2 flex-wrap bg-white"
              onClick={() => {
                setDropdownOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              {selectedInterests.map((it) => (
                <span key={it} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs">
                  <span>{it}</span>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      removeInterest(it);
                    }}
                    className="text-slate-500"
                    aria-label={`Remove ${it}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                ref={inputRef}
                value={interestInput}
                onChange={(e) => {
                  setInterestInput(e.target.value);
                  setDropdownOpen(true);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={selectedInterests.length === 0 ? "Type or pick interests…" : "Add more interests…"}
                className="flex-1 min-w-[120px] outline-none text-sm bg-white"
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
              />
            </div>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-blue-100 bg-white shadow" role="listbox">
                {filteredOptions.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">No matches</div>
                ) : (
                  filteredOptions.map((opt, idx) => (
                    <div
                      key={opt}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        addInterest(opt);
                      }}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={`px-3 py-2 cursor-pointer text-sm ${idx === highlightIndex ? "bg-blue-50" : ""}`}
                      role="option"
                      aria-selected={idx === highlightIndex}
                    >
                      {opt}
                    </div>
                  ))
                )}
              </div>
            )}
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
                    <label key={id} className="inline-flex items-center gap-3 text-sm">
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
            <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 border border-blue-100 bg-white text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
              {submitting ? "Creating…" : "Create Event"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
