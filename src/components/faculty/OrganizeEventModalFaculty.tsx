// src/components/faculty/OrganizeEventModal.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAppSelector } from "../../app/hooks";
import { selectFaculty } from "../../app/facultySlice";

const CLUB_API = import.meta.env.VITE_CLUB_API as string;
const EVENT_API = import.meta.env.VITE_EVENT_API as string;
const FACULTY_API = import.meta.env.VITE_FACULTY_API as string;

type Member = { studentId: string; name?: string; role?: string; email?: string; _id?: string };

export default function OrganizeEventModal({
    clubId,
    open,
    onClose,
    onCreated,
    token,
}: {
    clubId?: string;
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
    // eligibilityBranch is separate from organisingBranch (user chooses eligibility)
    const [eligibilityBranch, setEligibilityBranch] = useState("*");
    const [semester, setSemester] = useState("*");
    const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const auth = useMemo(
        () => ({ headers: { Authorization: token ? `Bearer ${token}` : `Bearer ${sessionStorage.getItem("accessToken") || ""}` }, withCredentials: true }),
        [token]
    );

    // Read organising branch from faculty slice (do not use it for eligibility)
    const organisingBranchFromRedux = useAppSelector((state: any) => state?.faculty?.faculty?.branch ?? "");

    // Try to read faculty object from redux (prefer this for faculty id)
    const facultyFromRedux = useAppSelector((state: any) => selectFaculty(state as any) ?? state?.faculty?.faculty ?? null);

    // robust extraction of faculty id from sessionStorage (keeps existing behavior)
    function getFacultyIdFromSession(): string | null {
        try {
            const raw = sessionStorage.getItem("user");
            if (!raw) return null;
            const parsed = JSON.parse(raw);

            if (parsed && (parsed._id || parsed.id)) return String(parsed._id ?? parsed.id);

            if (Array.isArray(parsed)) {
                for (const p of parsed) {
                    if (p && (p._id || p.id)) return String(p._id ?? p.id);
                    if (p && p.user && (p.user._id || p.user.id)) return String(p.user._id ?? p.user.id);
                }
            }

            if (parsed.user && (parsed.user._id || parsed.user.id)) return String(parsed.user._id ?? parsed.user.id);

            if (parsed.data && parsed.data.user && (parsed.data.user._id || parsed.data.user.id)) return String(parsed.data.user._id ?? parsed.data.user.id);

            for (const k of Object.keys(parsed)) {
                const v = (parsed as any)[k];
                if (v && typeof v === "object" && (v._id || v.id)) return String(v._id ?? v.id);
            }

            return null;
        } catch (e) {
            console.warn("Failed to parse session user for faculty id:", e);
            return null;
        }
    }

    // Derived faculty id (prefer redux, fallback to session)
    const facultyId = useMemo(() => {
        const idFromRedux = (facultyFromRedux && (facultyFromRedux._id || facultyFromRedux.id)) ? String(facultyFromRedux._id ?? facultyFromRedux.id) : null;
        return idFromRedux ?? getFacultyIdFromSession();
    }, [facultyFromRedux]);

    useEffect(() => {
        if (!open) return;
        if (!clubId) {
            setMembers([]);
            return;
        }
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
        if (!open) return;
        // reset form on open (organisingBranch comes from redux; eligibility reset locally)
        setTitle("");
        setDescription("");
        setType("Workshop");
        setVenue("");
        setSchedule("");
        setCapacity("");
        setEligibilityBranch("*");
        setSemester("*");
        setSelectedCoordinators([]);
        setError(null);
        setSubmitting(false);
    }, [open]);

    if (!open) return null;

    async function submit(e?: any) {
        e?.preventDefault?.();
        setError(null);

        if (!title?.trim() || !description?.trim() || !venue?.trim() || !schedule || !capacity) {
            setError("Please fill required fields (title, description, venue, schedule, capacity).");
            return;
        }

        const actorId = getFacultyIdFromSession();
        if (!actorId) {
            setError("Faculty id not available in session. Please login again.");
            return;
        }

        const payload: any = {
            title: title.trim(),
            description: description.trim(),
            type,
            venue: venue.trim(),
            schedule: new Date(schedule).toISOString(),
            capacity: Number(capacity),
            // eligibility is user-selected and separate
            eligibility: { branch: eligibilityBranch, semester },
            coordinators: selectedCoordinators.map((s) => ({ studentId: s })),
            actorId: actorId,
            // sending organisingBranch from faculty redux; if it's "*" or falsy send empty string so server can fallback
            organisingBranch: organisingBranchFromRedux && organisingBranchFromRedux !== "*" ? String(organisingBranchFromRedux) : "",
            // include current faculty id in faculties (if available)
            faculties: facultyId ? [String(facultyId)] : [],
        };

        console.log("OrganizeEventModal: sending payload:", payload, "clubId:", clubId);

        setSubmitting(true);
        try {
            let res;
            if (clubId) {
                // club-backed event
                res = await axios.post(`${EVENT_API}/event/club/${clubId}/create`, payload, auth);
            } else {
                // faculty-created event -> use 'random' club placeholder per your backend
                res = await axios.post(`${EVENT_API}/event/club/random/create`, payload, auth);
            }

            const created = res?.data?.data ?? res?.data ?? null;
            // fallback: try to inform FACULTY service about new event id (best-effort)
            try {
                if (created && created._id && FACULTY_API) {
                    await axios.post(`${FACULTY_API}/faculty/${actorId}/add-events`, { eventIds: [String(created._id)] }, auth);
                }
            } catch (e) {
                console.warn("Fallback: failed to register event with FACULTY_API:", e);
            }

            onCreated?.(created);
            onClose();
        } catch (err: any) {
            console.error("Event create failed", err);
            const serverMsg = err?.response?.data?.message ?? err?.response?.data ?? err?.message;
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
                        {/* Eligibility branch — user selectable and NOT tied to faculty branch */}
                        <select value={eligibilityBranch} onChange={(e) => setEligibilityBranch(e.target.value)} className="rounded border px-3 py-2">
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
                                            <input type="checkbox" checked={selectedCoordinators.includes(id)} onChange={(e) => {
                                                if (e.target.checked) setSelectedCoordinators((s) => [...s, id]);
                                                else setSelectedCoordinators((s) => s.filter((x) => x !== id));
                                            }} />
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
