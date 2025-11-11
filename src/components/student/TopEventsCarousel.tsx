export default function TopEventsCarousel({ rows }: { rows: any[] }) {
  if (!Array.isArray(rows)) return null;

  return (
    <div className="overflow-x-auto whitespace-nowrap pb-2">
      {rows.map((e) => (
        <a
          key={e._id}
          href={`/student/events/${e._id}`}
          className="inline-block mr-3 rounded-lg border bg-white p-3 min-w-[180px] shadow-sm hover:shadow"
        >
          <div className="font-medium text-sm">{e.title}</div>
          <div className="text-xs text-slate-500">{e.schedule ? new Date(e.schedule).toLocaleDateString() : "TBA"}</div>
        </a>
      ))}
    </div>
  );
}