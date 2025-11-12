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

  // clamp page
  const currentPage = Math.max(1, Math.min(page, totalPages));

  // find logged-in user's row (we'll now show it at both top and their rank position)
  const myRow = useMemo(() => {
    if (!myId) return null;
    return rows.find((r) => String(r.studentId) === String(myId)) ?? null;
  }, [rows, myId]);

  // 🟩 Previously excluded myRow from pageRows, now we keep it.
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return rows.slice(start, start + PER_PAGE);
  }, [rows, currentPage]);

  function goTo(p: number) {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    // scroll to top of leaderboard container (optional UX)
    const el = document.querySelector("#leaderboard-root");
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="leaderboard-root">
      {/* pinned logged-in user */}
      {myRow && (
        <div className="mb-4 rounded-lg border bg-white p-3">
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

      {/* table header */}
      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-[40px_1fr_120px] gap-4 items-center px-4 py-3 border-b">
          <div className="text-xs text-slate-500">#</div>
          <div className="text-xs text-slate-500">Name</div>
          <div className="text-xs text-slate-500 text-right">Points</div>
        </div>

        {/* rows */}
        <ol className="divide-y">
          {pageRows.map((r, i) => {
            const absoluteIndex = rows.findIndex((x) => String(x.studentId) === String(r.studentId));
            const rank = absoluteIndex === -1 ? (currentPage - 1) * PER_PAGE + i + 1 : absoluteIndex + 1;
            const isMe = myId && String(r.studentId) === String(myId);

            return (
              <li
                key={r.studentId}
                className={`px-4 py-3 ${isMe ? "bg-emerald-50" : "bg-white"}`}
              >
                <div className="grid grid-cols-[40px_1fr_120px] items-center gap-4">
                  <div className="font-semibold text-slate-700">{rank}</div>
                  <div>
                    <div className={`text-sm ${isMe ? "text-emerald-700 font-medium" : "text-slate-900"}`}>
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

      {/* pagination controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * PER_PAGE + 1}–
          {Math.min(currentPage * PER_PAGE, rows.length)} of {rows.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(1)}
            disabled={currentPage === 1}
            className="rounded px-2 py-1 border text-sm disabled:opacity-60"
            title="First page"
          >
            «
          </button>
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded px-2 py-1 border text-sm disabled:opacity-60"
            title="Previous"
          >
            ‹
          </button>

          {/* small page number selector — show nearby pages */}
          <div className="hidden sm:flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 9) {
                if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                  return (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      className={`px-2 py-1 rounded text-sm ${
                        p === currentPage ? "bg-blue-600 text-white" : "border text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === 2 && currentPage > 4)
                  return <span key={p} className="px-2 text-sm text-slate-400">…</span>;
                if (p === totalPages - 1 && currentPage < totalPages - 3)
                  return <span key={p} className="px-2 text-sm text-slate-400">…</span>;
                return null;
              } else {
                return (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    className={`px-2 py-1 rounded text-sm ${
                      p === currentPage ? "bg-blue-600 text-white" : "border text-slate-700"
                    }`}
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
            className="rounded px-2 py-1 border text-sm disabled:opacity-60"
            title="Next"
          >
            ›
          </button>
          <button
            onClick={() => goTo(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded px-2 py-1 border text-sm disabled:opacity-60"
            title="Last"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
