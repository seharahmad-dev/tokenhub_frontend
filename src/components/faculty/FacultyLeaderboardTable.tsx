// src/components/faculty/FacultyLeaderboardTable.tsx
import React, { useMemo, useState } from "react";

type Row = {
  studentId: string;
  name?: string;
  usn?: string;
  email?: string;
  totalTokens: number;
  redeemedTokens?: number;
  availableTokens?: number;
};

export default function FacultyLeaderboardTable({
  rows,
  procteeIds,
}: {
  rows: Row[];
  procteeIds?: string[]; // list of student ids that belong to this faculty
}) {
  const PER_PAGE = 25;
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const [page, setPage] = useState(1);

  // sort rows by totalTokens desc, stable
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = Number(a.totalTokens ?? 0);
      const tb = Number(b.totalTokens ?? 0);
      if (ta === tb) {
        return (a.name ?? "").localeCompare(b.name ?? "");
      }
      return tb - ta;
    });
  }, [rows]);

  // pinned proctees list (in order of rank)
  const procteeRows = useMemo(() => {
    if (!Array.isArray(procteeIds) || procteeIds.length === 0) return [];
    const set = new Set(procteeIds.map(String));
    return sorted.filter((r) => set.has(String(r.studentId)));
  }, [sorted, procteeIds]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return sorted.slice(start, start + PER_PAGE);
  }, [sorted, page]);

  function goTo(p: number) {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    const el = document.querySelector("#faculty-leaderboard-root");
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="faculty-leaderboard-root" className="space-y-4">
      {/* Pinned proctees */}
      {procteeRows.length > 0 && (
        <div className="rounded-lg border bg-white p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-slate-900">Your Proctees</div>
              <div className="text-xs text-slate-500">Quick view of your students' performance</div>
            </div>
            <div className="text-xs text-slate-500">{procteeRows.length} students</div>
          </div>

          <div className="grid gap-2">
            {procteeRows.map((r, idx) => {
              const absoluteIndex = sorted.findIndex((x) => String(x.studentId) === String(r.studentId));
              const rank = absoluteIndex === -1 ? idx + 1 : absoluteIndex + 1;
              return (
                <div
                  key={r.studentId}
                  className="rounded-md border p-3 bg-emerald-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {rank}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-700">{r.name ?? "Unknown"}</div>
                      <div className="text-xs text-slate-500">{r.usn ?? r.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">{r.totalTokens} pts</div>
                    <div className="text-xs text-slate-500">Tokens</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-[56px_1fr_120px] gap-4 items-center px-4 py-3 border-b">
          <div className="text-xs text-slate-500">#</div>
          <div className="text-xs text-slate-500">Name</div>
          <div className="text-xs text-slate-500 text-right">Points</div>
        </div>

        <ol className="divide-y">
          {pageRows.map((r, i) => {
            const absoluteIndex = sorted.findIndex((x) => String(x.studentId) === String(r.studentId));
            const rank = absoluteIndex === -1 ? (page - 1) * PER_PAGE + i + 1 : absoluteIndex + 1;
            const isProctee = Array.isArray(procteeIds) && procteeIds.includes(String(r.studentId));
            return (
              <li
                key={r.studentId}
                className={`px-4 py-3 ${isProctee ? "bg-emerald-50" : "bg-white"}`}
              >
                <div className="grid grid-cols-[56px_1fr_120px] items-center gap-4">
                  <div className="font-semibold text-slate-700">{rank}</div>
                  <div>
                    <div className={`text-sm ${isProctee ? "text-emerald-700 font-medium" : "text-slate-900"}`}>
                      {r.name ?? "Unknown"}
                      {isProctee && <span className="ml-2 inline-block rounded px-2 py-0.5 text-[11px] bg-emerald-100 text-emerald-700">Proctee</span>}
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

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, rows.length)} of {rows.length}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => goTo(1)} disabled={page === 1} className="rounded px-2 py-1 border text-sm disabled:opacity-60">«</button>
          <button onClick={() => goTo(page - 1)} disabled={page === 1} className="rounded px-2 py-1 border text-sm disabled:opacity-60">‹</button>
          <div className="hidden sm:flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 9) {
                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                  return (
                    <button key={p} onClick={() => goTo(p)} className={`px-2 py-1 rounded text-sm ${p === page ? "bg-emerald-700 text-white" : "border text-slate-700"}`}>{p}</button>
                  );
                }
                if (p === 2 && page > 4) return <span key={p} className="px-2 text-sm text-slate-400">…</span>;
                if (p === totalPages - 1 && page < totalPages - 3) return <span key={p} className="px-2 text-sm text-slate-400">…</span>;
                return null;
              } else {
                return (
                  <button key={p} onClick={() => goTo(p)} className={`px-2 py-1 rounded text-sm ${p === page ? "bg-emerald-700 text-white" : "border text-slate-700"}`}>{p}</button>
                );
              }
            })}
          </div>
          <button onClick={() => goTo(page + 1)} disabled={page === totalPages} className="rounded px-2 py-1 border text-sm disabled:opacity-60">›</button>
          <button onClick={() => goTo(totalPages)} disabled={page === totalPages} className="rounded px-2 py-1 border text-sm disabled:opacity-60">»</button>
        </div>
      </div>
    </div>
  );
}
