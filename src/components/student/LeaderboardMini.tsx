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
}: {
  rows: Row[];
}) {
  // rows are expected to already be top-N; sort defensively
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => b.totalTokens - a.totalTokens);
  }, [rows]);

  // show first 10 (or fewer)
  const visible = sorted.slice(0, 10);

  return (
    <div id="leaderboard-mini" className="text-slate-800">
      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-[40px_1fr_90px] gap-3 px-4 py-2 border-b text-xs text-slate-500">
          <div>#</div>
          <div>Name</div>
          <div className="text-right">Points</div>
        </div>

        <ol className="divide-y">
          {visible.map((r, idx) => {
            const rank = idx + 1;
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
