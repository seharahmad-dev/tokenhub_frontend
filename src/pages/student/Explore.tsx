import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import PostsFeed from "../../components/student/PostsFeed";
import SuggestedEvents from "../../components/student/SuggestedEvents";
import TopEventsCarousel from "../../components/student/TopEventsCarousel";

const DISCUSS_API = import.meta.env.VITE_DISCUSS_API as string;
const EVENT_API = import.meta.env.VITE_EVENT_API as string;
const CLUB_API = import.meta.env.VITE_CLUB_API as string;

type AnyObj = Record<string, any>;

function asArray<T = any>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === "object" && "data" in (val as AnyObj)) {
    const inner = (val as AnyObj).data;
    return Array.isArray(inner) ? (inner as T[]) : [];
  }
  return [];
}

function mongoIdTime(id: unknown) {
  if (typeof id === "string" && id.length >= 8) {
    const ts = parseInt(id.substring(0, 8), 16);
    if (!Number.isNaN(ts)) return ts * 1000;
  }
  return 0;
}

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([]);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [hiringClubs, setHiringClubs] = useState<
    { _id: string; clubName: string; description?: string; headName?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const auth = {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        };

        const [pRes, eRes, cRes] = await Promise.all([
          axios.get(`${DISCUSS_API}/discuss/all`, auth),
          axios.get(`${EVENT_API}/event/all`, auth),
          axios.get(`${CLUB_API}/club/all`, auth),
        ]);

        if (!mounted) return;

        // Normalize to arrays defensively
        const rawPosts = asArray(pRes.data);
        const rawEvents = asArray(eRes.data);
        const rawClubs = asArray(cRes.data);

        // Sort posts by recency (createdAt desc; fallback to updatedAt/_id time)
        const sortedPosts = [...rawPosts].sort((a, b) => {
          const aTime =
            new Date(a?.createdAt ?? a?.updatedAt ?? 0).getTime() ||
            mongoIdTime(a?._id);
          const bTime =
            new Date(b?.createdAt ?? b?.updatedAt ?? 0).getTime() ||
            mongoIdTime(b?._id);
          return bTime - aTime;
        });

        // Ensure counts exist so PostsFeed can display them reliably
        const normalizedPosts = sortedPosts.map((p) => {
          const likesArr = Array.isArray(p.likedBy)
            ? p.likedBy
            : Array.isArray(p.likes)
            ? p.likes
            : [];
          const commentsArr = Array.isArray(p.comments) ? p.comments : [];
          return {
            ...p,
            likesCount: likesArr.length,
            commentsCount: commentsArr.length,
          };
        });

        setPosts(normalizedPosts);
        setTopEvents(rawEvents.slice(0, 10));

        // Heuristic “hiring” detection + pick club head name
        // SHOW clubs where either cl.isHiring === true OR description contains hiring keywords
        const hiring = rawClubs
          .filter((cl: any) => {
            // explicit flag wins
            if (cl?.isHiring === true) return true;

            // fallback: detect keywords in description or other text fields
            const combinedText = `${cl?.description ?? ""} ${cl?.about ?? ""} ${cl?.announcements ?? ""}`.toString();
            const hiringHint = /hiring|recruit|applications\s*open|apply|vacancy|vacancies|join us/i.test(
              combinedText
            );

            // also ensure club is active (if status exists)
            const isActive = (cl?.status ?? "active") === "active";

            return isActive && hiringHint;
          })
          .map((cl: any) => {
            // Find head robustly: check members array and also fallback to 'members' snapshots
            let head = null;
            if (Array.isArray(cl?.members)) {
              head = cl.members.find((m: any) => {
                if (!m) return false;
                const role = (m.role ?? m.position ?? "").toString().toLowerCase();
                return (
                  role.includes("club head") ||
                  role.includes("clubhead") ||
                  role.includes("president") ||
                  role.includes("head")
                );
              });
            }

            // fallback to explicit head fields if present
            const headName =
              head?.name ?? cl?.headName ?? cl?.presidentName ?? cl?.leaderName ?? undefined;

            return {
              _id: cl?._id,
              clubName: cl?.clubName,
              description: cl?.description,
              headName,
            };
          });

        setHiringClubs(hiring);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to load explore page");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT: POSTS FEED (recency) */}
          <div>
            {loading ? (
              <div className="rounded-xl border bg-white p-6 text-center">
                Loading…
              </div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-6 text-rose-600">
                {err}
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                title="No posts yet"
                subtitle="Be the first to start a discussion!"
              />
            ) : (
              <PostsFeed posts={posts} />
            )}
          </div>

          {/* RIGHT: SUGGESTED (RAG) + TOP EVENTS + CLUBS HIRING */}
          <aside className="space-y-6 sticky top-20 h-fit">
            <SectionCard title="Suggested for You (RAG)">
              <SuggestedEvents />
            </SectionCard>

            <SectionCard
              title="Top Events"
              action={
                <a
                  href="/student/events"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View more
                </a>
              }
            >
              <TopEventsCarousel
                rows={Array.isArray(topEvents) ? topEvents : []}
              />
            </SectionCard>

            <SectionCard title="Clubs Hiring">
              {hiringClubs.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No hiring announcements right now. Check back later!
                </div>
              ) : (
                <ul className="space-y-3">
                  {hiringClubs.map((c) => (
                    <li key={c._id} className="rounded-lg border bg-white p-3">
                      <div className="font-medium">{c.clubName}</div>
                      {c.headName && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          President: {c.headName}
                        </div>
                      )}
                      {c.description && (
                        <p className="text-sm text-slate-700 mt-2 line-clamp-3">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-3">
                        <a
                          href={`/student/clubs?apply=${c._id}`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white"
                        >
                          Apply
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </aside>
        </div>
      </main>
    </div>
  );
}
