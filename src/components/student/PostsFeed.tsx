import PostCard, { Post } from "./PostCard";

function toArray(input: any): any[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.data)) return input.data;
  if (input && Array.isArray(input.items)) return input.items;
  return [];
}

export default function PostsFeed({ posts }: { posts: any }) {
  const list: Post[] = toArray(posts)
    .map((p: any) => ({
      _id: String(p?._id ?? p?.id ?? Math.random().toString(36).slice(2)),
      author: {
        name: p?.author?.name ?? p?.user?.name ?? p?.createdBy?.name ?? p?.authorName ?? "Anonymous",
        avatar: p?.author?.avatar ?? p?.avatar ?? undefined,
        role: p?.author?.role ?? p?.role ?? undefined,
      },
      title: p?.title ?? "",
      content: p?.content ?? p?.text ?? "",
      createdAt: p?.createdAt ?? p?.created_at ?? p?.timestamp ?? new Date().toISOString(),
      attachments: Array.isArray(p?.attachments) ? p.attachments : [],
      stats: {
        likes: Number(p?.likes ?? p?.reactionsCount ?? 0),
        comments: Number(p?.commentsCount ?? 0),
      },
    }))
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });

  if (list.length === 0) {
    return <div className="rounded-xl border border-blue-100 bg-white p-6 text-sm text-slate-600">No posts yet.</div>;
  }

  return (
    <div className="space-y-4">
      {list.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
