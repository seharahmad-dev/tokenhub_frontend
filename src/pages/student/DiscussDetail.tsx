import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const DISCUSS_API = import.meta.env.VITE_DISCUSS_API as string;

type Comment = {
  _id: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  text?: string;    // UI field (we normalize to this)
  content?: string; // backend field
  createdAt?: string;
};

type Post = {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
  authorId: string;
  authorName?: string;

  // Different possible backend shapes; we normalize these:
  likes?: unknown;
  dislikes?: unknown;
  likedBy?: unknown;
  dislikedBy?: unknown;

  createdAt?: string;
  comments?: Comment[];
};

function toIdArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === "string" ? v : String((v as any)?._id ?? v)));
  }
  // handle mongoose docs or objects with length fields incorrectly sent
  return [];
}

function displayName(firstName?: string, lastName?: string, email?: string) {
  const n = [firstName, lastName].filter(Boolean).join(" ").trim();
  return n || email || "Student";
}

export default function DiscussDetail() {
  const { id } = useParams<{ id: string }>();
  const student = useAppSelector(selectStudent);
  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const authCfg = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }),
    [token]
  );

  async function fetchPost() {
    try {
      setLoading(true);
      setErr(null);
      const res = await axios.get(`${DISCUSS_API}/discuss/${id}`, authCfg);
      const data: Post =
        (res?.data?.data as Post) ??
        (res?.data?.payload as Post) ??
        (res?.data?.post as Post) ??
        (res?.data as Post);

      if (!data) {
        setPost(null);
        return;
      }

      // Normalize reactions into array<string>
      const likesArr = toIdArray((data as any).likes ?? (data as any).likedBy);
      const dislikesArr = toIdArray(
        (data as any).dislikes ?? (data as any).dislikedBy
      );

      // Normalize comments so UI can always use `text`
      let normalizedComments: Comment[] | undefined = data.comments;
      if (Array.isArray(data.comments)) {
        normalizedComments = data.comments.map((c) => ({
          ...c,
          text: c.text ?? c.content ?? "",
        }));
      }

      setPost({
        ...data,
        likes: likesArr,
        dislikes: dislikesArr,
        comments: normalizedComments,
      });
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to load discussion");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const hasLiked =
    !!student?._id &&
    Array.isArray(post?.likes) &&
    (post!.likes as string[]).includes(student._id);

  const hasDisliked =
    !!student?._id &&
    Array.isArray(post?.dislikes) &&
    (post!.dislikes as string[]).includes(student._id);

  async function reactToPost(kind: "like" | "dislike") {
    if (!student?._id || !post?._id) return;
    setBusy(true);
    try {
      const url = `${DISCUSS_API}/discuss/${post._id}/${kind}`;
      // Backend expects userId (keep it simple & aligned with your controller)
      await axios.post(
        url,
        {
          userId: student._id,
        },
        authCfg
      );

      // Optimistic update: keep arrays as arrays of strings
      setPost((prev) => {
        if (!prev) return prev;
        const likes = new Set<string>(
          Array.isArray(prev.likes) ? (prev.likes as string[]) : []
        );
        const dislikes = new Set<string>(
          Array.isArray(prev.dislikes) ? (prev.dislikes as string[]) : []
        );

        if (kind === "like") {
          if (likes.has(student._id!)) {
            likes.delete(student._id!);
          } else {
            likes.add(student._id!);
            dislikes.delete(student._id!);
          }
        } else {
          if (dislikes.has(student._id!)) {
            dislikes.delete(student._id!);
          } else {
            dislikes.add(student._id!);
            likes.delete(student._id!);
          }
        }

        return {
          ...prev,
          likes: Array.from(likes),
          dislikes: Array.from(dislikes),
        };
      });
    } catch {
      // If something went wrong, re-sync with server
      fetchPost();
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!student?._id || !post?._id || comment.trim().length === 0) return;

    setBusy(true);
    try {
      await axios.post(
        `${DISCUSS_API}/discuss/${post._id}/comments`,
        {
          authorId: student._id,
          authorName: displayName(
            student.firstName,
            student.lastName,
            student.email
          ),
          authorEmail: student.email,
          content: comment.trim(), // backend expects `content`
        },
        authCfg
      );

      setComment("");

      // Optimistic append
      setPost((prev) => {
        if (!prev) return prev;
        const now = new Date().toISOString();
        const newC: Comment = {
          _id: Math.random().toString(36).slice(2),
          authorId: student._id!,
          authorName: displayName(
            student.firstName,
            student.lastName,
            student.email
          ),
          authorEmail: student.email,
          text: comment.trim(),
          createdAt: now,
        };
        return { ...prev, comments: [newC, ...(prev.comments ?? [])] };
      });
    } catch {
      await fetchPost();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 py-8">
          {/* LEFT: Post detail */}
          <div>
            {loading ? (
              <div className="rounded-xl border bg-white p-6 text-center">
                Loading…
              </div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-6 text-rose-600">
                {err}
              </div>
            ) : !post ? (
              <EmptyState
                title="Post not found"
                subtitle="It may have been removed."
              />
            ) : (
              <>
                <SectionCard
                  title={post.title}
                  action={
                    <Link
                      to="/student/discuss"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Back to Discuss
                    </Link>
                  }
                >
                  {/* meta */}
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <div>
                      By{" "}
                      <span className="font-medium">
                        {post.authorName || "Student"}
                      </span>
                    </div>
                    {post.createdAt && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </>
                    )}
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md border bg-slate-50 px-2 py-0.5"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* content */}
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* like / dislike */}
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      disabled={!student?._id || busy}
                      onClick={() => reactToPost("like")}
                      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm ${
                        hasLiked
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      👍{" "}
                      <span className="ml-1">
                        {Array.isArray(post.likes) ? post.likes.length : 0}
                      </span>
                    </button>
                    <button
                      disabled={!student?._id || busy}
                      onClick={() => reactToPost("dislike")}
                      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm ${
                        hasDisliked
                          ? "bg-rose-600 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      👎{" "}
                      <span className="ml-1">
                        {Array.isArray(post.dislikes) ? post.dislikes.length : 0}
                      </span>
                    </button>
                  </div>
                </SectionCard>

                {/* comments */}
                <SectionCard title="Comments">
                  {!student?._id && (
                    <p className="mb-4 text-sm text-slate-600">
                      Sign in to comment.
                    </p>
                  )}

                  {student?._id && (
                    <form onSubmit={submitComment} className="mb-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Add a comment
                      </label>
                      <textarea
                        className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Write something helpful…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <div className="mt-2">
                        <button
                          type="submit"
                          disabled={busy || comment.trim().length === 0}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {busy ? "Posting…" : "Post Comment"}
                        </button>
                      </div>
                    </form>
                  )}

                  {(post.comments?.length ?? 0) === 0 ? (
                    <EmptyState
                      title="No comments yet"
                      subtitle="Be the first to comment!"
                    />
                  ) : (
                    <ul className="space-y-3">
                      {post.comments!.map((c) => (
                        <li key={c._id} className="rounded-lg border bg-white p-3">
                          <div className="mb-1 text-xs text-slate-600">
                            <span className="font-medium">
                              {c.authorName || "Student"}
                            </span>{" "}
                            {c.createdAt && (
                              <>
                                • {new Date(c.createdAt).toLocaleString()}
                              </>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {c.text ?? ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </>
            )}
          </div>

          {/* RIGHT: related sidebar */}
          <aside className="space-y-6">
            <SectionCard title="Related Tags">
              {Array.isArray(post?.tags) && post!.tags!.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post!.tags!.map((t) => (
                    <a
                      key={t}
                      href={`/student/discuss?tag=${encodeURIComponent(t)}`}
                      className="rounded-md border bg-slate-50 px-2 py-1 text-xs hover:bg-slate-100"
                    >
                      #{t}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No tags.</p>
              )}
            </SectionCard>

            <SectionCard title="Hot Questions">
              <p className="text-sm text-slate-600">
                Placeholder — hook to an endpoint like <code>/discuss/hot</code> (most liked).
              </p>
              <div className="mt-2 space-y-2">
                <a
                  href="/student/discuss"
                  className="block rounded-md border bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                >
                  Explore more discussions →
                </a>
              </div>
            </SectionCard>
          </aside>
        </div>
      </main>
    </div>
  );
}
