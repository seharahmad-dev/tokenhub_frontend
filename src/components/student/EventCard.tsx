import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export type EventRow = {
  _id: string;
  title: string;
  description: string;
  type: string;
  venue: string;
  schedule: string | Date;
  capacity?: number;
  eligibility?: { branch: string; semester: string };
  organizers?: { clubId: string };
  organizingBranch?: string;
  permission?: string;
};

export default function EventCard({
  e,
  participated,
}: {
  e: EventRow;
  participated: boolean;
}) {
  const navigate = useNavigate();

  const isPast = useMemo(() => {
    const d = new Date(e.schedule);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }, [e.schedule]);

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{e.title}</h3>
          <div className="mt-1 text-sm text-slate-600">
            <span className="inline-block mr-3">
              Type: <b>{e.type}</b>
            </span>
            <span className="inline-block mr-3">
              Venue: <b>{e.venue}</b>
            </span>
            <span className="inline-block">
              Club: <b>{e.organizers?.clubId || "—"}</b>
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              isPast ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isPast ? "Past" : "Upcoming"}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 line-clamp-3">{e.description}</p>

      <div className="mt-4 text-xs text-slate-500">
        Branch: {e.organizingBranch || "—"} • Status: {e.permission || "—"}
      </div>

      <div className="mt-4">
        {!isPast && !participated ? (
          <button
            onClick={() => navigate(`/student/events/${e._id}/register`)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Register Now
          </button>
        ) : (
          <button
            disabled
            className="inline-flex items-center rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
          >
            {isPast ? "Closed" : "Registered"}
          </button>
        )}
      </div>
    </div>
  );
}
