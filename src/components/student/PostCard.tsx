export type Post = {
  _id: string;
  author: { name: string; avatar?: string; role?: string };
  title?: string;
  content: string;
  createdAt?: string;
  attachments?: { type?: string; url?: string }[];
  stats?: { likes?: number; comments?: number };
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function PostCard({ post }: { post: Post }) {
  const { author, title, content, createdAt, attachments, stats } = post;
  const firstImage =
    attachments?.find((a) => (a?.type || "").includes("image"))?.url ||
    attachments?.find((a) => /\.(png|jpg|jpeg|gif|webp)$/i.test(a?.url || ""))?.url;

  return (
    <article className="rounded-xl border bg-white p-4">
      {/* header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 grid place-items-center overflow-hidden">
          {author?.avatar ? (
            <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{author?.name || "Anonymous"}</span>
            {author?.role && (
              <span className="text-xs rounded border px-1.5 py-0.5 text-slate-600">
                {author.role}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">{timeAgo(createdAt)}</div>
        </div>
      </div>

      {/* body */}
      {title ? <h3 className="mt-3 font-semibold">{title}</h3> : null}
      {content ? <p className="mt-2 text-slate-700 whitespace-pre-wrap">{content}</p> : null}

      {firstImage && (
        <div className="mt-3 overflow-hidden rounded-lg border">
          <img src={firstImage} alt="" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* footer */}
      <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-slate-50"
          title="Like"
        >
          <span>👍</span>
          <span>{stats?.likes ?? 0}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-slate-50"
          title="Comments"
        >
          <span>💬</span>
          <span>{stats?.comments ?? 0}</span>
        </button>
      </div>
    </article>
  );
}