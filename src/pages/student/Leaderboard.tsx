import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import LeaderboardTable from "../../components/student/LeaderboardTable";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const TOKEN_API = import.meta.env.VITE_TOKEN_API as string || import.meta.env.VITE_TOKEN_SERVICE as string;

type Row = {
  studentId: string;
  name: string;
  usn?: string;
  email?: string;
  totalTokens: number;
  redeemedTokens?: number;
  availableTokens?: number;
};

export default function LeaderboardPage() {
  const me = useAppSelector(selectStudent);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // fetch leaderboard once
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        // token service may return either data wrapped or directly
        const url = `${TOKEN_API}/token/leaderboard/all`;
        const res = await axios.get(url);
        const payload = res?.data?.data ?? res?.data ?? [];
        const list: Row[] = Array.isArray(payload)
          ? payload.map((r: any) => ({
              studentId: r.studentId ?? r._id ?? r.student?._id ?? r.student?._id,
              name: r.name ?? r.firstName ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() : r.name ?? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
              usn: r.usn,
              email: r.email,
              totalTokens: Number(r.totalTokens ?? r.totalTokens ?? r.availableTokens ?? 0),
              redeemedTokens: Number(r.redeemedTokens ?? 0),
              availableTokens: Number(r.availableTokens ?? (Number(r.totalTokens ?? 0) - Number(r.redeemedTokens ?? 0))),
            }))
          : [];

        // Sort descending by totalTokens
        list.sort((a, b) => Number(b.totalTokens) - Number(a.totalTokens));

        if (!mounted) return;
        setRows(list);
      } catch (e: any) {
        setErr(e?.response?.data?.message || e?.message || "Failed to fetch leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // find current user's rank (1-based). If student not logged in, rank is undefined.
  const myRank = useMemo(() => {
    if (!me?._id) return undefined;
    const idx = rows.findIndex((r) => String(r.studentId) === String(me._id));
    return idx === -1 ? undefined : idx + 1;
  }, [me, rows]);

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Leaderboard</h1>
            <p className="text-sm text-slate-600">Top students by total tokens</p>
          </div>

          <SectionCard title="Leaderboard">
            {loading ? (
              <div className="rounded-xl border bg-white p-6 text-center">Loading…</div>
            ) : err ? (
              <div className="rounded-xl border bg-white p-4 text-rose-600">{err}</div>
            ) : rows.length === 0 ? (
              <EmptyState title="No leaderboard data" subtitle="No token records found." />
            ) : (
              <LeaderboardTable rows={rows} myId={me?._id} myRank={myRank} />
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}