export type ClubMember = {
  studentId: string;
  name: string;
  email: string;
  role: string;
  joiningDate?: string | Date;
};

export type ClubDoc = {
  _id: string;
  clubName: string;
  description?: string;
  status?: "active" | "inactive" | "dissolved" | string;
  logoUrl?: string;
  members?: ClubMember[];
};

export default function ClubCard({
  club,
  president = "—",
  hiring = false,
  onApply,
}: {
  club: ClubDoc;
  president?: string;
  hiring?: boolean;
  onApply?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col">
      <div className="flex items-center gap-3">
        {club.logoUrl ? (
          <img
            src={club.logoUrl}
            alt={club.clubName}
            className="h-10 w-10 rounded-lg object-cover border"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg border bg-slate-100 flex items-center justify-center text-sm">
            {club.clubName?.slice(0, 2)?.toUpperCase() || "CL"}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{club.clubName}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-md border px-1.5 py-0.5">
              {club.status ?? "active"}
            </span>
            {hiring && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5">
                Hiring
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 line-clamp-4">
        {club.description || "No description provided."}
      </p>

      <div className="mt-3 text-sm text-slate-600">
        <span className="font-medium">President:</span> {president}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={`/student/clubs/${club._id}`}
          className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm"
        >
          View details
        </a>
        {hiring && (
          <button
            onClick={() => onApply?.(club._id)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-3 py-2 text-sm"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}