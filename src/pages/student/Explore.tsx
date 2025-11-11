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

type AnyObj = Record<string, any>;

function asArray<T = any>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === "object" && "data" in (val as AnyObj)) {
    const inner = (val as AnyObj).data;
    return Array.isArray(inner) ? (inner as T[]) : [];
  }
  return [];
}

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([]);
  const [topEvents, setTopEvents] = useState<any[]>([]);
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

        const [pRes, eRes] = await Promise.all([
          axios.get(`${DISCUSS_API}/discuss/all`, auth),
          axios.get(`${EVENT_API}/event/all`, auth),
        ]);

        if (!mounted) return;

        // Normalize to arrays defensively
        const rawPosts = asArray(pRes.data);
        const rawEvents = asArray(eRes.data);

        // Sort posts by recency (createdAt desc; fallback to updatedAt/_id)
        const sortedPosts = [...rawPosts].sort((a, b) => {
          const aTime =
            new Date(a?.createdAt ?? a?.updatedAt ?? 0).getTime() ||
            (typeof a?._id === "string"
              ? new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime()
              : 0);
          const bTime =
            new Date(b?.createdAt ?? b?.updatedAt ?? 0).getTime() ||
            (typeof b?._id === "string"
              ? new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime()
              : 0);
          return bTime - aTime;
        });

        setPosts(sortedPosts);
        setTopEvents(rawEvents.slice(0, 10)); // carousel will handle the fade UI
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
              <div className="rounded-xl border bg-white p-6 text-center">Loading…</div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-6 text-rose-600">{err}</div>
            ) : posts.length === 0 ? (
              <EmptyState title="No posts yet" subtitle="Be the first to start a discussion!" />
            ) : (
              <PostsFeed posts={posts} />
            )}
          </div>

          {/* RIGHT: SUGGESTED (RAG) + TOP EVENTS */}
          <aside className="space-y-6 sticky top-20 h-fit">
            <SectionCard title="Suggested for You (RAG)">
              {/* This component is your placeholder / RAG hook */}
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
              <TopEventsCarousel rows={Array.isArray(topEvents) ? topEvents : []} />
            </SectionCard>
          </aside>
        </div>
      </main>
    </div>
  );
}
