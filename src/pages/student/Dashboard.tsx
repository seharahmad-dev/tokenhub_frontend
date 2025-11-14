import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import LeaderboardMini from "../../components/student/LeaderboardMini";
import ClubsMini from "../../components/student/ClubsMini";
import EventsMini from "../../components/student/EventsMini";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  setSuggestedEvents,
  clearSuggestedEvents,
  selectSuggestedEvents,
} from "../../app/studentSlice";

type Branch = "CSE" | "ISE" | "ECE" | string;

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  branch: Branch;
  semester: string;
  clubs?: { clubId?: string; _id?: string; role?: string }[] | string[]; // support both
};

type Club = { _id: string; clubName: string };
type EventRow = { _id: string; title: string; schedule?: string; venue?: string };
type LeaderboardRow = { _id: string; name: string; points: number };
type RegistrationRow = {
  _id: string;
  eventId: string;
  teamName?: string;
  participantsId?: string[];
  teamLeaderId?: string;
  paymentId?: string;
  verifiedUsers?: string[];
  date?: string;
};

const STUDENT_API = import.meta.env.VITE_STUDENT_API as string;
const CLUB_API = import.meta.env.VITE_CLUB_API as string;
const REG_API = import.meta.env.VITE_REG_API as string; // registrations service
const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";
const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || ""; // events service

export default function StudentDashboard() {
  const dispatch = useAppDispatch();
  const suggestedEvents = useAppSelector(selectSuggestedEvents);

  const [me, setMe] = useState<Student | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [eventsParticipated, setEventsParticipated] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tokens, setTokens] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);

  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [leaderLoading, setLeaderLoading] = useState<boolean>(false);
  const [leaderErr, setLeaderErr] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const [findModalOpen, setFindModalOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [findSubmitting, setFindSubmitting] = useState(false);
  const [findErr, setFindErr] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const userObj = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // count words in findText
  useEffect(() => {
    const wc = findText
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0).length;
    setWordCount(wc);
  }, [findText]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        if (!userObj?._id) {
          setErr("Not authenticated");
          setLoading(false);
          return;
        }

        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

        // 1) profile
        const meRes = await axios.get(`${STUDENT_API}/student/${userObj._id}`, auth);
        const profile: Student = meRes.data?.data ?? meRes.data;
        if (!mounted) return;
        setMe(profile);

        // 2) clubs — profile.clubs could be strings or objects; extract club ids robustly
        const clubEntries = Array.isArray(profile.clubs) ? profile.clubs : [];
        const clubIds: string[] = clubEntries
          .map((c: any) => {
            if (!c) return "";
            if (typeof c === "string") return c;
            // possible shapes:
            // { clubId: "..." } or { _id: "..."} or { club: { _id: "..." } }
            return c.clubId ?? c._id ?? (c.club && (c.club._id ?? c.clubId)) ?? "";
          })
          .filter(Boolean);

        if (clubIds.length) {
          const list: Club[] = [];
          for (const id of clubIds) {
            try {
              const r = await axios.get(`${CLUB_API}/club/${id}`, auth);
              const club = r.data?.data ?? r.data;
              if (club?._id) list.push({ _id: club._id, clubName: club.clubName });
            } catch (e) {
              // ignore per-club errors
              console.error("club fetch failed for", id, (e as any)?.message ?? e);
            }
          }
          if (!mounted) return;
          setClubs(list);
        } else {
          setClubs([]);
        }

        // 3) events + registrations -> compute participated events (mirror Events page 'mine' logic)
        try {
          // fetch all events and student's registrations in parallel
          const eventReq = EVENT_API ? axios.get(`${EVENT_API}/event/all`, auth) : Promise.resolve({ data: [] });
          const regReq =
            profile && profile._id ? axios.get(`${REG_API}/registrations/student/${profile._id}`, auth) : Promise.resolve({ data: [] });

          const [eventRes, regRes] = await Promise.all([eventReq, regReq]);

          if (!mounted) return;

          // Normalize events array and keep only approved ones
          const allEventsRaw: any[] = eventRes?.data?.data ?? eventRes?.data ?? [];
          const approvedEventsRaw = Array.isArray(allEventsRaw)
            ? allEventsRaw.filter((r) => String(r.permission ?? "").toLowerCase() === "approved")
            : [];

          // Map to EventRow shape
          const approvedEvents: EventRow[] = approvedEventsRaw.map((ev: any) => ({
            _id: String(ev._id ?? ev.id ?? ""),
            title: String(ev.title ?? ev.name ?? `Event ${String(ev._id ?? ev.id ?? "")}`),
            schedule: ev.schedule ? String(ev.schedule) : undefined,
            venue: ev.venue ? String(ev.venue) : undefined,
          }));

          // Load local fallback registered/participated lists if any
          const localRegistered = (() => {
            try {
              return JSON.parse(sessionStorage.getItem("registeredEventIds") || "[]");
            } catch {
              return [];
            }
          })();
          const localParticipated = (() => {
            try {
              return JSON.parse(sessionStorage.getItem("participatedEventIds") || "[]");
            } catch {
              return [];
            }
          })();

          const mineSet = new Set<string>([...(localRegistered ?? []), ...(localParticipated ?? [])]);

          // Normalize registration response (could be wrapped or direct)
          const regData: RegistrationRow[] = regRes?.data?.data ?? regRes?.data ?? [];

          if (Array.isArray(regData)) {
            for (const r of regData) {
              if (!r || !r.eventId) continue;
              const leaderMatches = !!profile && !!r.teamLeaderId && String(r.teamLeaderId) === String(profile._id);
              const verifiedMatches =
                !!profile && Array.isArray(r.verifiedUsers) && r.verifiedUsers.some((id) => String(id) === String(profile._id));

              if (leaderMatches || verifiedMatches) {
                mineSet.add(String(r.eventId));
              }
            }
          } else if (regData && typeof regData === "object") {
            // defensive single-object case
            const r = regData as RegistrationRow;
            const leaderMatches = !!profile && !!r.teamLeaderId && String(r.teamLeaderId) === String(profile._id);
            const verifiedMatches =
              !!profile && Array.isArray(r.verifiedUsers) && r.verifiedUsers.some((id) => String(id) === String(profile._id));
            if (leaderMatches || verifiedMatches) mineSet.add(String(r.eventId));
          }

          // Now pick approved events that are in mineSet (this mirrors the Events 'My Events' filter)
          const participatedEvents = approvedEvents.filter((e) => e._id && mineSet.has(e._id));
          setEventsParticipated(participatedEvents);
        } catch (evErr) {
          console.error("Failed fetching events/registrations for dashboard:", evErr);
          // fallback: keep previous approach if available (try earlier registrations endpoint)
          try {
            const studentIdentifier = profile._id || profile.email;
            const r = await axios.get(`${REG_API}/registrations/${encodeURIComponent(studentIdentifier)}`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
            const regs = r?.data?.data ?? r?.data ?? [];
            const evList: EventRow[] = [];
            for (const reg of regs) {
              const ev = reg.eventId ?? reg.event ?? reg.event_id ?? null;
              if (!ev) continue;
              evList.push({
                _id: String(ev._id ?? ev.id ?? ev),
                title: String(ev.title ?? `Event ${String(ev._id ?? ev.id ?? ev)}`),
                schedule: ev.schedule ? String(ev.schedule) : undefined,
                venue: ev.venue ? String(ev.venue) : undefined,
              });
            }
            const map = new Map<string, EventRow>();
            evList.forEach((e) => map.set(e._id, e));
            if (mounted) setEventsParticipated(Array.from(map.values()));
          } catch (fallbackErr) {
            console.error("Fallback registrations->events failed:", fallbackErr);
            if (mounted) setEventsParticipated([]);
          }
        }
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token, userObj]);

  // === LEADERBOARD FETCH & top-rows ===
  useEffect(() => {
    let mounted = true;
    const fetchLeaderboard = async () => {
      setLeaderLoading(true);
      setLeaderErr(null);

      try {
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const res = await axios.get(`${TOKEN_API}/token/leaderboard/all`, auth);
        const raw = res?.data?.data ?? res?.data ?? res;
        const arr = Array.isArray(raw) ? raw : [];

        const mapped: LeaderboardRow[] = arr.map((r: any) => {
          const studentObj = r.studentId ?? r.student ?? null;
          const id =
            (typeof studentObj === "string" && studentObj) ||
            (studentObj && (studentObj._id || studentObj.id)) ||
            r._id ||
            crypto.randomUUID();

          const name =
            r.name ||
            (studentObj && (studentObj.name || `${studentObj.firstName ?? ""} ${studentObj.lastName ?? ""}`)) ||
            r.studentName ||
            "Unknown";

          const points = Number(r.totalTokens ?? r.points ?? 0);

          return { _id: String(id), name: String(name).trim(), points };
        });

        mapped.sort((a, b) => b.points - a.points);

        if (mounted) {
          setLeaderboardRows(mapped);
          setVisibleCount((prev) => Math.min(prev, Math.max(mapped.length, 10)));
        }
      } catch (err: any) {
        console.error("Leaderboard fetch error:", err);
        if (mounted) setLeaderErr(err?.response?.data?.message || "Failed to load leaderboard");
      } finally {
        if (mounted) setLeaderLoading(false);
      }
    };

    if (TOKEN_API) fetchLeaderboard();
    else setLeaderErr("Token service URL not set");
    return () => {
      mounted = false;
    };
  }, [token]);

  // Sync logged-in user's points/tokens with leaderboard result (prefer token service)
  useEffect(() => {
    if (!me) return;
    const byId = leaderboardRows.find((r) => r._id === me._id || r._id === me.email);
    if (byId) {
      setPoints(byId.points);
      setTokens(byId.points);
      return;
    }
    const fullName = `${me.firstName} ${me.lastName}`.trim();
    const byName = leaderboardRows.find((r) => r.name === fullName);
    if (byName) {
      setPoints(byName.points);
      setTokens(byName.points);
      return;
    }
    // fallback to sessionStorage if token service has no entry for this user
    const storedTokens = Number(sessionStorage.getItem("availableTokens") || "0");
    const storedRedeemed = Number(sessionStorage.getItem("redeemedTokens") || "0");
    setTokens(storedTokens);
    setPoints(storedTokens + storedRedeemed);
  }, [leaderboardRows, me]);

  // Compose club list with roles (works with string[] or object[])
  const clubList = useMemo(() => {
    if (!me) return [];
    const roleMap = new Map<string, string>();

    if (Array.isArray(me.clubs)) {
      me.clubs.forEach((m: any) => {
        if (!m) return;
        if (typeof m === "string") {
          roleMap.set(m, "member");
        } else {
          // possible shapes:
          // { clubId: "...", role: "..." } or { _id: "...", role: "..." } or { club: { _id: "..." }, role: "..." }
          const id = m.clubId ?? m._id ?? (m.club && (m.club._id ?? m.clubId)) ?? "";
          if (id) roleMap.set(id, m.role ?? "member");
        }
      });
    }

    return clubs.map((c) => ({ _id: c._id, name: c.clubName, role: roleMap.get(c._id) ?? "member" }));
  }, [clubs, me]);

  // final leaderboard to pass to LeaderboardMini: top N only (no pinned user)
  const shownLeaderboard = useMemo(() => {
    const full = leaderboardRows.map((r) => ({ studentId: r._id, name: r.name, totalTokens: r.points }));
    return full.slice(0, visibleCount);
  }, [leaderboardRows, visibleCount]);

  const hasMore = leaderboardRows.length > visibleCount;
  const isShowingAll = leaderboardRows.length > 0 && visibleCount >= leaderboardRows.length;

  // ---- RAG: submit interests to EVENT_API/rag-ai ----
  async function submitFind() {
    setFindErr(null);
    if (!EVENT_API) {
      setFindErr("Event service URL not configured.");
      return;
    }
    if (wordCount === 0) {
      setFindErr("Please describe your interests (at least one word).");
      return;
    }
    if (wordCount > 1000) {
      setFindErr("Please keep the input within 1000 words.");
      return;
    }
    setFindSubmitting(true);
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      // send text to rag endpoint - body shape is { text: ... } (adjust if your API expects another key)
      const res = await axios.post(`${EVENT_API}/rag-ai`, { text: findText }, auth);
      const payload = res?.data?.data ?? res?.data ?? [];
      // normalize to EventRow[]
      const list: EventRow[] = ([] as any[]).concat(payload || []).map((ev: any) => ({
        _id: String(ev._id ?? ev.id ?? ev.eventId ?? `${Math.random()}`),
        title: String(ev.title ?? ev.name ?? ev.eventName ?? "Untitled event"),
        schedule: ev.schedule ? String(ev.schedule) : undefined,
        venue: ev.venue ? String(ev.venue) : undefined,
      }));

      // persist in redux (studentSlice)
      dispatch(setSuggestedEvents(list));
      setFindModalOpen(false);
      setFindText("");
    } catch (e: any) {
      console.error("RAG find failed:", e);
      setFindErr(e?.response?.data?.message ?? e?.message ?? "Failed to find events");
    } finally {
      setFindSubmitting(false);
    }
  }

  // clear suggested events
  function handleClearSuggested() {
    dispatch(clearSuggestedEvents());
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <StudentNavbar tokens={tokens} />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-10">
          {loading ? (
            <div className="rounded-2xl bg-white/90 p-10 shadow-2xl border border-blue-100 text-center">Loading…</div>
          ) : err ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-rose-100 text-rose-600">{err}</div>
          ) : !me ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-blue-100">
              <EmptyState title="Not signed in" subtitle="Please login again." />
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* LEFT */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-md border border-blue-100">
                  <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {me.firstName} 👋</h1>
                  <p className="mt-2 text-slate-600">{me.branch} • Semester {me.semester}</p>

                  
                </div>

                <SectionCard
                  title="Suggested for you"
                  action={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFindModalOpen(true);
                          setFindErr(null);
                        }}
                        className=" bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium shadow"
                      >
                        Find
                      </button>

                      <button
                        onClick={handleClearSuggested}
                        disabled={!suggestedEvents || suggestedEvents.length === 0}
                        className={`text-sm px-3 py-1.5 rounded-xl ${
                          suggestedEvents && suggestedEvents.length > 0
                            ? "bg-white border border-blue-100 text-blue-700 hover:bg-blue-50 shadow-sm"
                            : "bg-white border border-blue-50 text-slate-400 cursor-not-allowed"
                        }`}
                        title={suggestedEvents && suggestedEvents.length > 0 ? "Clear suggestions" : "No suggestions to clear"}
                      >
                        Clear
                      </button>
                    </div>
                  }
                >
                  <div className="rounded-2xl border border-dashed border-blue-50 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    {suggestedEvents && suggestedEvents.length > 0 ? (
                      <EventsMini rows={suggestedEvents} />
                    ) : (
                      <div className="space-y-2">
                        <div className="text-slate-700">No suggestions yet</div>
                        <div className="text-xs text-slate-500">
                          Click <span className="font-medium">Find</span> to describe your interests (up to 1000 words) and get recommended events.
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Club Participation"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/clubs">
                      View all
                    </a>
                  }
                >
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <ClubsMini items={clubList} />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Events Participated"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/events">
                      View all
                    </a>
                  }
                >
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <EventsMini rows={eventsParticipated} />
                  </div>
                </SectionCard>
              </div>

              {/* RIGHT */}
              <aside className="lg:col-span-4 lg:sticky lg:top-28 self-start">
                <SectionCard
                  title="Leaderboard - Top 10"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/leaderboard">
                      View more
                    </a>
                  }
                >
                  {leaderLoading ? (
                    <div className="p-4 text-center">Loading leaderboard…</div>
                  ) : leaderErr ? (
                    <div className="p-4 text-rose-600">{leaderErr}</div>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <LeaderboardMini rows={shownLeaderboard as any} />
                      </div>

                      {leaderboardRows.length > 0 && (
                        <div className="mt-3 flex justify-center">
                          <button
                            className="text-sm px-3 py-1 rounded-full bg-white border border-blue-100 shadow-sm hover:bg-blue-50 text-blue-700"
                            onClick={() => {
                              if (isShowingAll) {
                                setVisibleCount(10);
                              } else {
                                setVisibleCount((prev) => Math.min(prev + 10, leaderboardRows.length));
                              }
                            }}
                          >
                            {isShowingAll ? "Show less" : hasMore ? "Show more" : "Show all"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Find modal */}
      {findModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!findSubmitting) {
                setFindModalOpen(false);
                setFindText("");
                setFindErr(null);
              }
            }}
          />

          <div className="relative w-full max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white p-6 shadow-2xl border border-blue-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Find events - tell us about your interests</h2>
                  <p className="text-xs text-slate-500 mt-1">Describe your interests, experience, or what you're looking for (up to 1000 words).</p>
                </div>

                <button
                  onClick={() => {
                    if (!findSubmitting) {
                      setFindModalOpen(false);
                      setFindText("");
                      setFindErr(null);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 rounded-full p-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <textarea
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-blue-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="E.g. I'm interested in robotics competitions, hackathons for beginners, workshops on embedded systems, and networking events..."
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <div>Words: {wordCount}/1000</div>
                  <div>{findErr && <span className="text-rose-600">{findErr}</span>}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setFindModalOpen(false);
                    setFindText("");
                    setFindErr(null);
                  }}
                  disabled={findSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-sm text-blue-700 hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  onClick={submitFind}
                  disabled={findSubmitting || wordCount === 0 || wordCount > 1000}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {findSubmitting ? "Finding…" : "Find"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
