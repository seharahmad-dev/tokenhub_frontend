import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export type EventRow = {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  venue?: string;
  schedule?: string | Date;
  capacity?: number;
  eligibility?: { branch?: string; semester?: string };
  organizers?: { clubId?: string };
  organisingBranch?: string;
  organisingClub?: string;
  permission?: string;
};

export default function EventCard({
  e,
  participated,
  onRegister, // optional
}: {
  e: EventRow;
  participated: boolean;
  onRegister?: (id: string) => void;
}) {
  const navigate = useNavigate();

  const when = useMemo(() => {
    const d = new Date(e.schedule || "");
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }, [e.schedule]);

  const isPast = useMemo(() => {
    const d = new Date(e.schedule || "");
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }, [e.schedule]);

  const showRegister = !isPast && !participated;

  const handleRegister = () => {
    if (onRegister) {
      onRegister(e._id);
    } else {
      navigate(`/student/events/${e._id}/register`);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{e.title}</h3>
          <div className="mt-1 text-sm text-slate-600">
            <span className="inline-block mr-3">
              Type: <b>{e.type || "—"}</b>
            </span>
            <span className="inline-block mr-3">
              Venue: <b>{e.venue || "—"}</b>
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              isPast ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"
            }`}
            title="Date & time"
          >
            {isPast ? "Past" : "Upcoming"}
          </div>
          {participated && (
            <div
              className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              title="You already registered/participated"
            >
              Registered
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 line-clamp-3">{e.description}</p>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="text-slate-600">
          <span className="inline-block w-24 text-slate-500">Schedule:</span>
          <b>{when}</b>
        </div>
        {typeof e.capacity === "number" && (
          <div className="text-slate-600">
            <span className="inline-block w-24 text-slate-500">Capacity:</span>
            <b>{e.capacity}</b>
          </div>
        )}
        {e.eligibility && (
          <div className="text-slate-600">
            <span className="inline-block w-24 text-slate-500">Eligibility:</span>
            <b>
              {e?.eligibility?.branch === "*" && e?.eligibility?.semester === "*"
                ? "All"
                : `${e?.eligibility?.branch ?? ""}${e?.eligibility?.branch && e?.eligibility?.semester ? " " : ""}${e?.eligibility?.semester ?? ""}`}
            </b>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Branch: {e.organisingBranch || "—"} • Status: {e.permission || "—"}
        </div>

        {showRegister ? (
          <button
            onClick={handleRegister}
            className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
          >
            Register Now
          </button>
        ) : (
          <button
            disabled
            className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600"
            title={isPast ? "Event already happened" : "You have already registered"}
          >
            {isPast ? "Closed" : "Registered"}
          </button>
        )}
      </div>
    </div>
  );
}
