type HotQuestion = {
  _id: string;
  title: string;
  likes?: number;
  tags?: string[];
};

export default function DiscussSidebar({
  hotTags,
  hotQuestions,
}: {
  hotTags: { tag: string; count: number }[];
  hotQuestions: HotQuestion[];
}) {
  return (
    <aside className="space-y-6 sticky top-20 h-fit">
      <section className="rounded-xl border bg-white p-4">
        <h4 className="text-sm font-semibold">🔥 Hot Tags</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {hotTags.length ? (
            hotTags.map((t) => (
              <a
                key={t.tag}
                href={`/student/discuss?tag=${encodeURIComponent(t.tag)}`}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs bg-slate-50 hover:bg-slate-100"
                title={`${t.count} posts`}
              >
                #{t.tag}
                <span className="opacity-70">({t.count})</span>
              </a>
            ))
          ) : (
            <p className="text-sm text-slate-600">No tags yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">⭐ Hot Questions</h4>
          <a href="/student/discuss" className="text-xs text-blue-600 hover:underline">
            View all
          </a>
        </div>
        <ul className="mt-3 space-y-3">
          {hotQuestions.length ? (
            hotQuestions.map((q) => (
              <li key={q._id} className="text-sm">
                <a href={`/student/discuss/${q._id}`} className="font-medium hover:underline">
                  {q.title}
                </a>
                <div className="mt-0.5 text-xs text-slate-600 flex items-center gap-2">
                  <span>👍 {Number(q.likes ?? 0)}</span>
                  <span>•</span>
                  <span className="truncate">
                    {Array.isArray(q.tags) && q.tags.length ? q.tags.slice(0, 3).map((t) => `#${t}`).join("  ") : "—"}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <p className="text-sm text-slate-600">No questions yet.</p>
          )}
        </ul>
      </section>
    </aside>
  );
}