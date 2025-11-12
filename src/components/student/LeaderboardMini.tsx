import { useMemo } from "react";

type Row = {
  studentId: string;
  name: string;
  usn?: string;
  email?: string;
  totalTokens: number;
  redeemedTokens?: number;
  availableTokens?: number;
};

export default function LeaderboardMini({
  rows,
  myId,
}: {
  rows: Row[];
  myId?: string | null;
}) {
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => b.totalTokens - a.totalTokens);
  }, [rows]);

  const myRow = useMemo(() => {
    if (!myId) return null;
    return sorted.find((r) => String(r.studentId) === String(myId)) ?? null;
  }, [sorted, myId]);

  const myRank = useMemo(() => {
    if (!myId) return undefined;
    const idx = sorted.findIndex((r) => String(r.studentId) === String(myId));
    return idx === -1 ? undefined : idx + 1;
  }, [sorted, myId]);

  // Exclude current user from list below
  const visible = sorted
    .filter((r) => !myId || String(r.studentId) !== String(myId))
    .slice(0, 10);

  return (
    <div id="leaderboard-mini" className="text-slate-800">
      {/* pinned current user card */}
      {myRow && (
        <div className="mb-3 rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-semibold">
                {myRank ?? "—"}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{myRow.name || "You"}</div>
                <div className="text-xs text-slate-500">{myRow.usn ?? myRow.email}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-700 font-semibold">{myRow.totalTokens} pts</div>
              <div className="text-xs text-slate-500">Your rank</div>
            </div>
          </div>
        </div>
      )}

      {/* leaderboard table */}
      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-[40px_1fr_90px] gap-3 px-4 py-2 border-b text-xs text-slate-500">
          <div>#</div>
          <div>Name</div>
          <div className="text-right">Points</div>
        </div>

        <ol className="divide-y">
          {visible.map((r) => {
            const rank = sorted.findIndex((x) => x.studentId === r.studentId) + 1;
            return (
              <li key={r.studentId} className="px-4 py-2 bg-white">
                <div className="grid grid-cols-[40px_1fr_90px] items-center gap-3">
                  <div className="font-semibold text-slate-700">{rank}</div>
                  <div>
                    <div className="text-sm text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.usn ?? r.email}</div>
                  </div>
                  <div className="text-right text-sm font-medium text-slate-700">
                    {r.totalTokens} pts
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
