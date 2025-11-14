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
  rows: unknown; // accept anything
  loading?: boolean;
  onViewAll?: () => void;
}) {
  // Coerce to array safely
  const list: EventRow[] = Array.isArray(rows)
    ? (rows as EventRow[])
    : Array.isArray((rows as any)?.data)
    ? (rows as any).data
    : [];

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-3 shadow-sm border border-blue-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-blue-50 overflow-hidden">
      {list.length === 0 ? (
        <div className="px-4 py-5 text-sm text-slate-500">No events yet.</div>
      ) : (
        <>
          <ul className="divide-y">
            {list.slice(0, 5).map((e) => (
              <li key={e._id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{e.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {e.schedule ?? "—"} · {e.venue ?? "—"}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {onViewAll && list.length > 0 && (
            <div className="px-4 py-3 bg-blue-50/30 flex justify-end">
              <button
                onClick={onViewAll}
                className="text-sm rounded-xl px-3 py-1.5 bg-white border border-blue-100 text-blue-700 hover:bg-blue-50 shadow-sm"
              >
                View more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
