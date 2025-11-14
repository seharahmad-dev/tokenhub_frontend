import React from "react";

export type Post = {
  _id: string;
  author: { name: string; avatar?: string; role?: string } | undefined;
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
  const author = post.author ?? { name: "Anonymous" };
  const firstImage =
    post.attachments?.find((a) => (a?.type || "").includes("image"))?.url ||
    post.attachments?.find((a) => /\.(png|jpg|jpeg|gif|webp)$/i.test(a?.url || ""))?.url;

  return (
    <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden grid place-items-center">
          {author?.avatar ? <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" /> : <span className="text-sm">👤</span>}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 truncate">{author?.name || "Anonymous"}</span>
            {author?.role && <span className="text-xs rounded px-1.5 py-0.5 text-slate-600 bg-slate-50">{author.role}</span>}
          </div>
          <div className="text-xs text-slate-500">{timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {post.title ? <h3 className="mt-3 text-base font-normal text-slate-900">{post.title}</h3> : null}
      {post.content ? <p className="mt-2 text-slate-700 whitespace-pre-wrap">{post.content}</p> : null}

      {firstImage && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
          <img src={firstImage} alt="" className="w-full h-auto object-cover" />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
        <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-slate-50">
          <span>👍</span>
          <span>{post.stats?.likes ?? 0}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-slate-50">
          <span>💬</span>
          <span>{post.stats?.comments ?? 0}</span>
        </div>
      </div>
    </article>
  );
}
