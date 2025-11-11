type EventRow = {
  _id: string;
  title: string;
  schedule?: string;
  venue?: string;
};

export default function EventsMini({
  rows,
  loading = false,
  onViewAll,
}: {
  rows: unknown;                // accept anything
  loading?: boolean;
  onViewAll?: () => void;
}) {
  // Coerce to array safely
  const list: EventRow[] = Array.isArray(rows)
    ? rows
    : Array.isArray((rows as any)?.data)
    ? (rows as any).data
    : [];

  if (loading) {
    return (
      <div className="text-sm text-slate-500 px-3 py-2">Loading…</div>
    );
  }

  return (
    <div className="divide-y">
      {list.length === 0 ? (
        <div className="px-3 py-6 text-sm text-slate-500">No events yet.</div>
      ) : (
        list.slice(0, 5).map((e) => (
          <div key={e._id} className="px-3 py-2">
            <div className="font-medium">{e.title}</div>
            <div className="text-xs text-slate-500">
              {e.schedule ?? "—"} · {e.venue ?? "—"}
            </div>
          </div>
        ))
      )}

      {onViewAll && list.length > 0 && (
        <div className="px-3 py-2">
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:underline"
          >
            View more
          </button>
        </div>
      )}
    </div>
  );
}
