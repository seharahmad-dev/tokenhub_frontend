import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import DiscussPostCard, { DiscussPost } from "../../components/student/DiscussPostCard";
import DiscussSidebar from "../../components/student/DiscussSidebar";
import EmptyState from "../../components/common/EmptyState";

const DISCUSS_API = import.meta.env.VITE_DISCUSS_API as string;

console.log(DISCUSS_API);
type AnyObj = Record<string, any>;
function asArray<T = any>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === "object" && "data" in (val as AnyObj)) {
    const inner = (val as AnyObj).data;
    return Array.isArray(inner) ? (inner as T[]) : [];
  }
  return [];
}

export default function Discuss() {
  const [posts, setPosts] = useState<DiscussPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const tagFilter = useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("tag") || "";
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
        const res = await axios.get(`${DISCUSS_API}/discuss/all`, auth);
        console.log(res);
        if (!mounted) return;

        const raw = asArray<DiscussPost>(res.data);
        // Most recent first
        const sorted = [...raw].sort((a, b) => {
          const at = new Date(a?.createdAt ?? 0).getTime();
          const bt = new Date(b?.createdAt ?? 0).getTime();
          return bt - at;
        });

        const filtered = tagFilter
          ? sorted.filter((p) => Array.isArray(p.tags) && p.tags.includes(tagFilter))
          : sorted;

        setPosts(filtered);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to load discussions");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [token, tagFilter]);

  // hot tags aggregation
  const hotTags = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => (p.tags ?? []).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [posts]);

  // hot questions by likes
  const hotQuestions = useMemo(
    () =>
      [...posts]
        .sort((a, b) => Number(b.likes ?? 0) - Number(a.likes ?? 0))
        .slice(0, 10)
        .map((p) => ({ _id: p._id, title: p.title, likes: p.likes ?? 0, tags: p.tags ?? [] })),
    [posts]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
        
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT: posts + create */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Discuss</h1>
              <a
                href="/student/discuss/create"
                className="inline-flex items-center rounded-lg bg-blue-600 text-white px-3 py-2 text-sm"
              >
                + Create
              </a>
            </div>

            {loading ? (
              <div className="rounded-xl border bg-white p-6 text-center">Loading…</div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-6 text-rose-600">{err}</div>
            ) : posts.length === 0 ? (
              <EmptyState title="No posts yet" subtitle="Start the first discussion!" />
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <DiscussPostCard key={p._id} post={p} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: hot tags & hot questions */}
          <DiscussSidebar hotTags={hotTags} hotQuestions={hotQuestions} />
        </div>
      </main>
    </div>
  );
}
