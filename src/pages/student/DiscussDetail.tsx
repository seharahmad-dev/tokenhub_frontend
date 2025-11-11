import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import DiscussSidebar from "../../components/student/DiscussSidebar";
import DiscussComments, { CommentForm } from "../../components/student/DiscussComments";
import { DiscussPost } from "../../components/student/DiscussPostCard";

const DISCUSS_API = import.meta.env.VITE_DISCUSS_API as string;

type AnyObj = Record<string, any>;
function asArray<T = any>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === "object" && "data" in (val as AnyObj)) {
    const inner = (val as AnyObj).data;
    return Array.isArray(inner) ? (inner as T[]) : [];
  }
  return [];
}
function asObject<T = any>(val: unknown): T | null {
  if (val && typeof val === "object" && "data" in (val as AnyObj)) {
    return ((val as AnyObj).data as T) ?? null;
  }
  return (val as T) ?? null;
}

export default function DiscussDetail() {
  const [post, setPost] = useState<DiscussPost | null>(null);
  const [allPosts, setAllPosts] = useState<DiscussPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const postId = useMemo(() => window.location.pathname.split("/").pop() || "", []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

        const [pRes, allRes] = await Promise.all([
          axios.get(`${DISCUSS_API}/discuss/${postId}`, auth),
          axios.get(`${DISCUSS_API}/discuss/all`, auth),
        ]);

        if (!mounted) return;
        setPost(asObject<DiscussPost>(pRes.data));
        setAllPosts(asArray<DiscussPost>(allRes.data));
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to load discussion");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [token, postId]);

  const hotTags = useMemo(() => {
    const map = new Map<string, number>();
    allPosts.forEach((p) => (p.tags ?? []).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [allPosts]);

  const hotQuestions = useMemo(
    () =>
      [...allPosts]
        .sort((a, b) => Number(b.likes ?? 0) - Number(a.likes ?? 0))
        .slice(0, 8)
        .map((p) => ({ _id: p._id, title: p.title, likes: p.likes ?? 0, tags: p.tags ?? [] })),
    [allPosts]
  );

  async function like(dislike = false) {
    if (!post) return;
    try {
      setActionBusy(true);
      const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      const url = `${DISCUSS_API}/discuss/${post._id}/${dislike ? "dislike" : "like"}`;
      await axios.post(url, {}, auth);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likes: (dislike ? Number(prev.likes ?? 0) - 1 : Number(prev.likes ?? 0) + 1),
            }
          : prev
      );
    } catch {
      // ignore
    } finally {
      setActionBusy(false);
    }
  }

  async function addComment(text: string) {
    if (!post) return;
    const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
    await axios.post(`${DISCUSS_API}/discuss/${post._id}/comment`, { content: text }, auth);
    // refetch comments quickly
    try {
      const res = await axios.get(`${DISCUSS_API}/discuss/${post._id}`, auth);
      const fresh = asObject<DiscussPost>(res.data);
      setPost(fresh);
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT: post content */}
          <div>
            {loading ? (
              <div className="rounded-xl border bg-white p-6 text-center">Loading…</div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-6 text-rose-600">{err}</div>
            ) : !post ? (
              <div className="rounded-xl border bg-white p-6">Not found.</div>
            ) : (
              <div className="rounded-xl border bg-white p-5 space-y-5">
                <header>
                  <h1 className="text-2xl font-semibold">{post.title}</h1>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((t) => (
                        <a
                          key={t}
                          href={`/student/discuss?tag=${encodeURIComponent(t)}`}
                          className="inline-flex rounded-md border px-2 py-0.5 text-xs bg-slate-50"
                        >
                          #{t}
                        </a>
                      ))}
                    </div>
                  )}
                </header>

                <article className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </article>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => like(false)}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm bg-white"
                  >
                    👍 Like
                  </button>
                  <button
                    onClick={() => like(true)}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm bg-white"
                  >
                    👎 Dislike
                  </button>
                  <span className="text-sm text-slate-600">Likes: {Number(post.likes ?? 0)}</span>
                </div>

                <section>
                  <h3 className="text-sm font-semibold mb-2">Comments</h3>
                  <DiscussComments comments={Array.isArray(post.comments) ? post.comments : []} />
                  <CommentForm onSubmit={addComment} />
                </section>
              </div>
            )}
          </div>

          {/* RIGHT: hot tags + questions */}
          <DiscussSidebar hotTags={hotTags} hotQuestions={hotQuestions} />
        </div>
      </main>
    </div>
  );
}
