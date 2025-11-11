import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import ClubsGrid from "../../components/student/ClubsGrid";
import ClubCard, { ClubDoc } from "../../components/student/ClubCard";

const CLUB_API = import.meta.env.VITE_CLUB_API as string;

export default function Clubs() {
  const [clubs, setClubs] = useState<ClubDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const auth = {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        };
        const res = await axios.get(`${CLUB_API}/club/all`, auth);
        const data = res.data?.data ?? res.data ?? [];
        if (!mounted) return;

        // Normalize minimal fields
        const normalized: ClubDoc[] = (Array.isArray(data) ? data : []).map((c: any) => ({
          _id: String(c?._id),
          clubName: String(c?.clubName ?? "—"),
          description: c?.description ?? "",
          status: c?.status ?? "active",
          logoUrl: c?.logoUrl ?? "",
          members: Array.isArray(c?.members) ? c.members : [],
        }));
        setClubs(normalized);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to fetch clubs");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [token]);

  // President / head extractor
  const getHeadName = (c: ClubDoc) => {
    const head = c.members?.find(m => {
      const r = (m?.role || "").toString().toLowerCase();
      return r === "club head" || r === "clubhead" || r === "president";
    });
    return head?.name || head?.email || "—";
  };

  // Heuristic “hiring” detector (until a backend flag exists):
  const hiringClubs = useMemo(
    () => clubs.filter(c => /hire|recruit|opening|join our team|recruitment/i.test(c.description || "")),
    [clubs]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8 space-y-8">
          {loading ? (
            <div className="rounded-xl border bg-white p-8 text-center">Loading…</div>
          ) : err ? (
            <div className="rounded-xl border bg-white p-4 text-rose-600">{err}</div>
          ) : clubs.length === 0 ? (
            <EmptyState title="No clubs yet" subtitle="Clubs will appear here once created." />
          ) : (
            <>
              {/* Hiring first */}
              <SectionCard
                title="Clubs Hiring Now"
              >
                {hiringClubs.length === 0 ? (
                  <EmptyState
                    title="No active recruitments"
                    subtitle="When clubs announce hiring, they’ll show up here."
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hiringClubs.map((c) => (
                      <ClubCard
                        key={c._id}
                        club={c}
                        president={getHeadName(c)}
                        hiring
                        onApply={(id) => {
                          // Hook this to your real apply flow
                          // e.g. navigate(`/student/clubs/${id}/apply`)
                          alert(`Apply flow for club: ${id}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* All clubs */}
              <SectionCard
                title="All Clubs"
              >
                <ClubsGrid
                  items={clubs.map((c) => ({
                    ...c,
                    president: getHeadName(c),
                  }))}
                />
              </SectionCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
}