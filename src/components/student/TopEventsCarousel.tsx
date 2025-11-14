export default function TopEventsCarousel({ rows }: { rows: any[] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-blue-50 p-4 shadow-sm text-sm text-slate-600">
        No top events available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto whitespace-nowrap pb-3 -mx-4 px-4">
      <div className="inline-flex gap-3">
        {rows.map((e) => {
          const id = e?._id ?? e?.id ?? String(Math.random());
          const title = String(e?.title ?? "Untitled event");
          const date = e?.schedule ? (() => {
            const d = new Date(e.schedule);
            return isNaN(d.getTime()) ? "TBA" : d.toLocaleDateString();
          })() : "TBA";

          return (
            <a
              key={id}
              href={`/student/events/${id}`}
              className="inline-block mr-0 rounded-xl border bg-white p-4 min-w-[200px] max-w-[260px] shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label={`View event ${title}`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 line-clamp-2">{title}</div>
                    <div className="mt-1 text-xs text-slate-500">{e?.venue ?? "Venue TBA"}</div>
                  </div>

                  <div className="shrink-0">
                    <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {date}
                    </div>
                  </div>
                </div>

                {e?.description && (
                  <p className="mt-3 text-xs text-slate-600 line-clamp-3">{String(e.description)}</p>
                )}

                <div className="mt-4 flex items-center justify-end">
                  <span className="text-xs text-slate-500">View details →</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
