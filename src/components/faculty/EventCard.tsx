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
}: {
  e: EventRow;
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

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{e.title}</h3>
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
              isPast
                ? "bg-slate-100 text-slate-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isPast ? "Past" : "Upcoming"}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 line-clamp-3">
        {e.description}
      </p>

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
              {e.eligibility.branch === "*" &&
              e.eligibility.semester === "*"
                ? "All"
                : `${e.eligibility.branch ?? ""}${
                    e.eligibility.branch && e.eligibility.semester ? " " : ""
                  }${e.eligibility.semester ?? ""}`}
            </b>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Branch: {e.organisingBranch || "—"} • Status:{" "}
          {e.permission || "—"}
        </div>
      </div>
    </div>
  );
}
