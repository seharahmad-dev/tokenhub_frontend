export type EventsFilter = "upcoming" | "past" | "mine" | "all";

export default function EventsFilterBar({
  active,
  onChange,
  q,
  onQChange,
  typeFilter,
  onTypeChange,
}: {
  active: EventsFilter;
  onChange: (f: EventsFilter) => void;
  q: string;
  onQChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
}) {
  const btn = (id: EventsFilter, label: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`rounded-lg px-3 py-1.5 text-sm border ${
        active === id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        {btn("upcoming", "Upcoming")}
        {btn("past", "Past")}
        {btn("mine", "My Events")}
        {btn("all", "All")}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="rounded-lg border px-2.5 py-1.5 text-sm bg-white"
        >
          <option value="">All Types</option>
          <option value="Hackathon">Hackathon</option>
          <option value="Workshop">Workshop</option>
          <option value="Webinar">Webinar</option>
          <option value="Competition">Competition</option>
          <option value="Codeathon">Codeathon</option>
        </select>

        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search events…"
          className="rounded-lg border px-3 py-1.5 text-sm bg-white w-56"
        />
      </div>
    </div>
  );
}