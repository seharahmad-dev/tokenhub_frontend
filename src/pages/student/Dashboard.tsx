import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import LeaderboardMini from "../../components/student/LeaderboardMini";
import ClubsMini from "../../components/student/ClubsMini";
import EventsMini from "../../components/student/EventsMini";

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

const STUDENT_API = import.meta.env.VITE_STUDENT_API as string;
const CLUB_API = import.meta.env.VITE_CLUB_API as string;
const REG_API = import.meta.env.VITE_REG_API as string;
const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";

export default function StudentDashboard() {
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

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const userObj = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

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

        // 3) registrations -> events participated
        try {
          const studentIdentifier = profile._id || profile.email;
          const r = await axios.get(`${REG_API}/registrations/${encodeURIComponent(studentIdentifier)}`, auth);
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
          if (!mounted) return;
          setEventsParticipated(Array.from(map.values()));
        } catch (err) {
          console.error("Failed fetching registrations for student:", err);
          setEventsParticipated([]);
        }

        // 4) tokens/points (local fallback)
        const storedTokens = Number(sessionStorage.getItem("availableTokens") || "0");
        const storedRedeemed = Number(sessionStorage.getItem("redeemedTokens") || "0");
        setTokens(storedTokens);
        setPoints(storedTokens + storedRedeemed);
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

  // === LEADERBOARD FETCH & user highlight ===
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

  // final leaderboard to pass to LeaderboardMini: prefer showing user first (highlight)
  const shownLeaderboard = useMemo(() => {
    // map server rows to Row shape expected by mini
    const full = leaderboardRows.map((r) => ({ studentId: r._id, name: r.name, totalTokens: r.points }));
    if (!me) return full.slice(0, visibleCount);
    // attempt to find user index
    const userKey = me._id ?? me.email ?? "";
    const idx = full.findIndex((r) => r.studentId === userKey || r.studentId === (me.email ?? ""));
    let rank = idx >= 0 ? idx + 1 : -1;
    if (rank === -1) {
      const nm = `${me.firstName} ${me.lastName}`.trim();
      const byNameIdx = full.findIndex((r) => r.name === nm);
      if (byNameIdx >= 0) rank = byNameIdx + 1;
    }

    const userRow = {
      studentId: me._id ?? crypto.randomUUID(),
      name: rank > 0 ? `You • ${me.firstName} ${me.lastName} (#${rank})` : `You • ${me.firstName} ${me.lastName}`,
      totalTokens: points,
    };

    // build top list excluding a possible duplicate of user
    const filtered = full.filter((r) => r.studentId !== userRow.studentId && r.name !== `${me.firstName} ${me.lastName}`);
    const top = filtered.slice(0, Math.max(visibleCount - 1, 0));
    return [userRow, ...top];
  }, [leaderboardRows, me, visibleCount, points]);

  const hasMore = leaderboardRows.length > visibleCount;
  const isShowingAll = leaderboardRows.length > 0 && visibleCount >= leaderboardRows.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar tokens={tokens} />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          {loading ? (
            <div className="rounded-xl border bg-white p-8 text-center">Loading…</div>
          ) : err ? (
            <div className="rounded-xl border bg-white p-4 text-rose-600">{err}</div>
          ) : !me ? (
            <div className="rounded-xl border bg-white p-8">
              <EmptyState title="Not signed in" subtitle="Please login again." />
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* LEFT */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-xl border bg-white p-5">
                  <h1 className="text-xl font-semibold">
                    Hey, {me.firstName} {me.lastName}
                  </h1>
                  <p className="mt-1 text-slate-600">
                    Branch: <b>{me.branch}</b> • Semester: <b>{me.semester}</b>
                  </p>
                </div>

                <SectionCard
                  title="Club Participation"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/clubs">
                      View all
                    </a>
                  }
                >
                  <ClubsMini items={clubList} />
                </SectionCard>

                <SectionCard
                  title="Events Participated"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/events">
                      View all
                    </a>
                  }
                >
                  <EventsMini rows={eventsParticipated} />
                </SectionCard>

                <SectionCard
                  title="Suggested for you (RAG)"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/explore">
                      Explore
                    </a>
                  }
                >
                  <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
                    Placeholder — hook this to your RAG service. Show 3–5 recommended events based on
                    branch/interest/history.
                  </div>
                </SectionCard>
              </div>

              {/* RIGHT */}
              <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
                <SectionCard
                  title="Leaderboard — Top"
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
                      <LeaderboardMini rows={shownLeaderboard as any} myId={me?._id} />

                      {leaderboardRows.length > 0 && (
                        <div className="mt-3 flex justify-center">
                          <button
                            className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-slate-50"
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
    </div>
  );
}
