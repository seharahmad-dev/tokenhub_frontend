// src/pages/faculty/LeaderboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";
import FacultyLeaderboardTable from "../../components/faculty/FacultyLeaderboardTable";
import { useAppSelector } from "../../app/hooks";
import { selectFaculty } from "../../app/facultySlice";

type Row = {
  studentId: string;
  name?: string;
  usn?: string;
  email?: string;
  totalTokens: number;
  redeemedTokens?: number;
  availableTokens?: number;
};

export default function FacultyLeaderboardPage() {
  const faculty = useAppSelector(selectFaculty);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [procteeIds, setProcteeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";
  const FACULTY_API = (import.meta.env.VITE_FACULTY_API as string) || "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Fetch global leaderboard from token service
        const tbase = TOKEN_API.replace(/\/+$/, "");
        const tokenResp = await axios.get(`${tbase}/token/leaderboard/all`, { withCredentials: true, timeout: 7000 });
        const tokenData = tokenResp?.data ?? tokenResp?.data?.data ?? tokenResp?.data?.results ?? [];
        // tokenData expected to be array of items with studentId, name, usn, email, totalTokens

        // Normalize rows
        const normRows: Row[] = Array.isArray(tokenData)
          ? tokenData.map((r: any) => ({
              studentId: r.studentId ?? r._id ?? r.id ?? r.student?._id,
              name: r.name ?? (r.firstName || "") + (r.lastName ? ` ${r.lastName}` : ""),
              usn: r.usn ?? r.usn,
              email: r.email ?? r.email,
              totalTokens: Number(r.totalTokens ?? r.total ?? 0),
              redeemedTokens: Number(r.redeemedTokens ?? 0),
              availableTokens: Number((r.totalTokens ?? r.total ?? 0) - (r.redeemedTokens ?? 0))
            }))
          : [];

        // 2) Fetch proctees for this faculty
        const facBase = FACULTY_API.replace(/\/+$/, "");
        let fetchedProctees: any[] = [];
        if (faculty && faculty._id && facBase) {
          try {
            const profResp = await axios.get(`${facBase}/faculty/${encodeURIComponent(faculty._id)}/proctees`, { withCredentials: true, timeout: 7000 });
            const payload = profResp?.data?.data ?? profResp?.data ?? [];
            // payload might be array of snapshots or array of ids
            if (Array.isArray(payload) && payload.length > 0 && (typeof payload[0] === "string" || typeof payload[0]._id === "string")) {
              fetchedProctees = payload.map((p: any) => (typeof p === "string" ? p : p._id ?? p.studentId ?? p.id));
            }
          } catch (err) {
            console.warn("Failed to fetch proctees:", err);
          }
        }

        setRows(normRows);
        setProcteeIds(Array.from(new Set(fetchedProctees.map(String))));
      } catch (err: any) {
        console.error("Failed to load leaderboard:", err);
        setError("Failed to fetch leaderboard. Check console.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [TOKEN_API, FACULTY_API, faculty]);

  // compute myRank if needed
  const myRank = useMemo(() => {
    if (!faculty || !faculty._id || rows.length === 0) return undefined;
    const sorted = [...rows].sort((a, b) => (b.totalTokens - a.totalTokens));
    const idx = sorted.findIndex(r => String(r.studentId) === String(faculty._id));
    return idx === -1 ? undefined : idx + 1;
  }, [rows, faculty]);

  return (
    <div className="min-h-screen bg-slate-50">
      <FacultyNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[1100px] mx-auto space-y-6">
          <SectionCard title="Leaderboard : College-wide">
            {loading ? (
              <div className="p-4 text-center">Loading…</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-600">{error}</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center text-slate-600">No leaderboard data available.</div>
            ) : (
              <>
                <div className="mb-4 text-sm text-slate-600">Green highlighted entries are your proctees. The list above shows your proctees pinned for quick access.</div>

                <FacultyLeaderboardTable rows={rows} procteeIds={procteeIds} />
              </>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
