import React, { useMemo } from "react";

type Row = {
  studentId: string;
  name: string;
  usn?: string;
  email?: string;
  totalTokens: number;
  redeemedTokens?: number;
  availableTokens?: number;
};

export default function FacultyProcteeLeaderboard({
  rows,
  myId,
  maxShown = 10,
}: {
  rows: Row[];
  myId?: string | null;
  maxShown?: number;
}) {
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => Number(b.totalTokens || 0) - Number(a.totalTokens || 0));
  }, [rows]);

  const myRow = useMemo(() => {
    if (!myId) return null;
    return sorted.find((r) => String(r.studentId) === String(myId)) ?? null;
  }, [sorted, myId]);

  const visible = sorted.slice(0, maxShown);

  return (
    <div className="text-slate-800">
      {/* pinned current faculty's row not relevant here; but we keep consistent header */}
      {myRow && (
        <div className="mb-3 rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {sorted.findIndex((r) => r.studentId === myRow.studentId) + 1}
              </div>
              <div>
                <div className="text-sm font-medium text-emerald-700">{myRow.name || "You"}</div>
                <div className="text-xs text-slate-500">{myRow.usn ?? myRow.email}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-700 font-semibold">{myRow.totalTokens} pts</div>
              <div className="text-xs text-slate-500">Your rank</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-[40px_1fr_90px] gap-3 px-4 py-2 border-b text-xs text-slate-500">
          <div>#</div>
          <div>Name</div>
          <div className="text-right">Points</div>
        </div>

        <ol className="divide-y">
          {visible.map((r, idx) => {
            const rank = sorted.findIndex((x) => x.studentId === r.studentId) + 1;
            const isMe = myId && String(r.studentId) === String(myId);

            return (
              <li key={r.studentId} className="px-4 py-2 bg-white">
                <div className="grid grid-cols-[40px_1fr_90px] items-center gap-3">
                  <div className="font-semibold text-slate-700">{rank}</div>
                  <div>
                    <div className={`text-sm ${isMe ? "text-emerald-700 font-medium" : "text-slate-900"}`}>
                      {/* proctee names highlighted in green */}
                      <span className="text-emerald-700 font-medium">{r.name}</span>
                    </div>
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
