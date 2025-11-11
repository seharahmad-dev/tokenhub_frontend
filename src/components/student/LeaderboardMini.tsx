type Row = { _id: string; name: string; points: number };

export default function LeaderboardMini({ rows }: { rows: Row[] }) {
  return (
    <ol className="space-y-2">
      {rows.slice(0, 10).map((r, i) => (
        <li key={r._id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-6 justify-center font-semibold">{i + 1}</span>
            <span className="text-slate-800">{r.name}</span>
          </div>
          <span className="text-slate-600">{r.points} pts</span>
        </li>
      ))}
      {rows.length === 0 && <p className="text-sm text-slate-500">No leaderboard data.</p>}
    </ol>
  );
}
