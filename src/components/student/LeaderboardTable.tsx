// src/components/student/LeaderboardTable.tsx
import { useMemo, useState } from "react";

type Row = {
  studentId: string;
  name: string;
  usn?: string;
  email?: string;
  totalTokens: number;
  redeemedTokens?: number;
  availableTokens?: number;
};

export default function LeaderboardTable({
  rows,
  myId,
  myRank,
}: {
  rows: Row[];
  myId?: string | null;
  myRank?: number | undefined;
}) {
  const PER_PAGE = 25;
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const [page, setPage] = useState(1);

  const currentPage = Math.max(1, Math.min(page, totalPages));

  const myRow = useMemo(() => {
    if (!myId) return null;
    return rows.find((r) => String(r.studentId) === String(myId)) ?? null;
  }, [rows, myId]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return rows.slice(start, start + PER_PAGE);
  }, [rows, currentPage]);

  function goTo(p: number) {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    const el = document.querySelector("#leaderboard-root");
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="leaderboard-root">
      {myRow && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-semibold">
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

      <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
        <div className="grid grid-cols-[48px_1fr_120px] gap-4 items-center px-4 py-3 border-b">
          <div className="text-xs text-slate-500">#</div>
          <div className="text-xs text-slate-500">Name</div>
          <div className="text-xs text-slate-500 text-right">Points</div>
        </div>

        <ol className="divide-y">
          {pageRows.map((r, i) => {
            const absoluteIndex = rows.findIndex((x) => String(x.studentId) === String(r.studentId));
            const rank = absoluteIndex === -1 ? (currentPage - 1) * PER_PAGE + i + 1 : absoluteIndex + 1;
            const isMe = myId && String(r.studentId) === String(myId);

            return (
              <li key={r.studentId} className={`px-4 py-3 ${isMe ? "bg-blue-50" : "bg-white"}`}>
                <div className="grid grid-cols-[48px_1fr_120px] items-center gap-4">
                  <div className="font-semibold text-slate-700">{rank}</div>
                  <div>
                    <div className={`text-sm ${isMe ? "text-blue-700 font-medium" : "text-slate-900"}`}>
                      {r.name}
                    </div>
                    <div className="text-xs text-slate-500">{r.usn ?? r.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700">{r.totalTokens} pts</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, rows.length)} of {rows.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(1)}
            disabled={currentPage === 1}
            className="rounded-xl px-2 py-1 border border-blue-100 text-sm disabled:opacity-60"
            title="First page"
          >
            «
          </button>
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-xl px-2 py-1 border border-blue-100 text-sm disabled:opacity-60"
            title="Previous"
          >
            ‹
          </button>

          <div className="hidden sm:flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 9) {
                if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                  return (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      className={`px-2 py-1 rounded-xl text-sm ${p === currentPage ? "bg-blue-600 text-white" : "border border-blue-100 text-slate-700"}`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === 2 && currentPage > 4) return <span key={p} className="px-2 text-sm text-slate-400">…</span>;
                if (p === totalPages - 1 && currentPage < totalPages - 3) return <span key={p} className="px-2 text-sm text-slate-400">…</span>;
                return null;
              } else {
                return (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    className={`px-2 py-1 rounded-xl text-sm ${p === currentPage ? "bg-blue-600 text-white" : "border border-blue-100 text-slate-700"}`}
                  >
                    {p}
                  </button>
                );
              }
            })}
          </div>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-xl px-2 py-1 border border-blue-100 text-sm disabled:opacity-60"
            title="Next"
          >
            ›
          </button>
          <button
            onClick={() => goTo(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded-xl px-2 py-1 border border-blue-100 text-sm disabled:opacity-60"
            title="Last"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
