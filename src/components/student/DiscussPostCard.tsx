// src/components/student/DiscussPostCard.tsx
export type DiscussPost = {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
  likes?: number | unknown[];
  dislikes?: number | unknown[];
  likedBy?: unknown[];
  dislikedBy?: unknown[];
  comments?: { _id: string; author?: string; content?: string; text?: string; createdAt?: string }[];
  author?: { name?: string; _id?: string } | string;
  createdAt?: string;
  updatedAt?: string;
};

function truncate(s: string, n = 180) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function countFrom(val: unknown, fallbackAlt?: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (Array.isArray(val)) return val.length;
  if (fallbackAlt !== undefined) return countFrom(fallbackAlt);
  return 0;
}

export default function DiscussPostCard({ post }: { post: DiscussPost }) {
  const likeCount = countFrom(post.likes, post.likedBy);
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
  const date = post.createdAt ? new Date(post.createdAt).toLocaleString() : "";
  return (
    <article className="rounded-xl border border-blue-100 bg-white p-4 hover:shadow-md transition">
      <a href={`/student/discuss/${post._id}`} className="no-underline">
        <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
      </a>

      {post.tags && post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="inline-flex rounded-md border px-2 py-0.5 text-xs text-slate-600 bg-slate-50">#{t}</span>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm text-slate-700">{truncate(post.content)}</p>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span title="likes">👍 {likeCount}</span>
          <span title="comments">💬 {commentCount}</span>
        </div>
        <span className="text-xs text-slate-500">{date}</span>
      </div>
    </article>
  );
}
