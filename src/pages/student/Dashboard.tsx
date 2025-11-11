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
  clubs?: { clubId: string; role?: string }[];
};

type Club = { _id: string; clubName: string };
type EventRow = { _id: string; title: string; schedule?: string };

const STUDENT_API = import.meta.env.VITE_STUDENT_API as string;
const CLUB_API = import.meta.env.VITE_CLUB_API as string;
const EVENT_API = import.meta.env.VITE_EVENT_API as string; // ensure in .env

export default function StudentDashboard() {
  const [me, setMe] = useState<Student | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // still needed for navbar icons
  const [tokens, setTokens] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);

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

        // 2) clubs — expand names
        const clubIds = (profile.clubs ?? []).map((c) => c.clubId).filter(Boolean);
        if (clubIds.length) {
          const list: Club[] = [];
          for (const id of clubIds) {
            try {
              const r = await axios.get(`${CLUB_API}/club/${id}`, auth);
              const club = r.data?.data ?? r.data;
              if (club?._id) list.push({ _id: club._id, clubName: club.clubName });
            } catch {
              /* ignore per-club errors */
            }
          }
          if (!mounted) return;
          setClubs(list);
        } else {
          setClubs([]);
        }

        // 3) events (coerce to array & shape -> prevents rows.map crash)
        try {
          const e = await axios.get(`${EVENT_API}/event/all`, auth);
          const raw = e?.data?.data ?? e?.data ?? [];
          const safeArray = Array.isArray(raw) ? raw : [];
          const shaped: EventRow[] = safeArray.slice(0, 5).map((ev: any) => ({
            _id: String(ev?._id ?? crypto.randomUUID()),
            title: String(ev?.title ?? "Untitled Event"),
            schedule: ev?.schedule ? String(ev.schedule) : undefined,
          }));
          setEvents(shaped);
        } catch {
          setEvents([]);
        }

        // 4) tokens/points for navbar icons (placeholders)
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

  const clubList = useMemo(() => {
    const roleMap = new Map<string, string>();
    (me?.clubs ?? []).forEach((m) => roleMap.set(m.clubId, m.role || "member"));
    return clubs.map((c) => ({ _id: c._id, name: c.clubName, role: roleMap.get(c._id) }));
  }, [clubs, me]);

  // placeholder leaderboard; actual API can replace this
  const leaderboard = useMemo(() => {
    return [
      ...(me
        ? [
            {
              _id: me._id,
              name: `${me.firstName} ${me.lastName}`,
              points,
            },
          ]
        : []),
    ];
  }, [me, points]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notification -> icon is handled inside StudentNavbar per your latest changes */}
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
              {/* LEFT COLUMN (scrolls) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Greeting */}
                <div className="rounded-xl border bg-white p-5">
                  <h1 className="text-xl font-semibold">
                    Hey, {me.firstName} {me.lastName}
                  </h1>
                  <p className="mt-1 text-slate-600">
                    Branch: <b>{me.branch}</b> • Semester: <b>{me.semester}</b>
                  </p>
                </div>

                {/* Clubs participated */}
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

                {/* Events participated */}
                <SectionCard
                  title="Events Participated"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/events">
                      View all
                    </a>
                  }
                >
                  <EventsMini rows={Array.isArray(events) ? events : []} />
                </SectionCard>

                {/* Suggested events (RAG placeholder) */}
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

              {/* RIGHT COLUMN — STICKY LEADERBOARD */}
              <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
                <SectionCard
                  title="Leaderboard — Top 10"
                  action={
                    <a className="text-sm text-blue-600 hover:underline" href="/student/leaderboard">
                      View more
                    </a>
                  }
                >
                  <LeaderboardMini rows={leaderboard} />
                </SectionCard>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
