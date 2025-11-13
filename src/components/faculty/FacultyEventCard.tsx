import { useMemo } from "react";

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
  organizingBranch?: string;
  permission?: string;
  faculties?: any[];
  createdBy?: string;
};

export default function FacultyEventCard({ e, onManage, showManage = false }: { e: EventRow; onManage?: (id: string) => void; showManage?: boolean; }) {

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
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{e.title}</h3>
          <div className="mt-1 text-sm text-slate-600">
            <span className="inline-block mr-3">Type: <b>{e.type || "—"}</b></span>
            <span className="inline-block mr-3">Venue: <b>{e.venue || "—"}</b></span>
            <span className="inline-block">Branch: <b>{e.organizingBranch || "—"}</b></span>
          </div>
          <p className="mt-3 text-sm text-slate-700 line-clamp-3">{e.description}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${isPast ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}>
            {isPast ? "Past" : "Upcoming"}
          </div>

          <div className="mt-2 text-xs text-slate-500">
            {when}
          </div>

          {showManage && onManage && (
            <div className="mt-3 flex gap-2 justify-end">
              <a href={`/faculty/event/${e._id}`} className="text-sm text-blue-600 hover:underline">Manage</a>
              <button onClick={() => onManage(e._id)} className="text-sm px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700">Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
