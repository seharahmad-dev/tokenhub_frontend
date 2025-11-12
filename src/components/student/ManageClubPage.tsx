import { useEffect, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

export default function ManageClubPage() {
  const me = useAppSelector(selectStudent);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const CLUB_API = import.meta.env.VITE_CLUB_API || "";

  useEffect(() => {
    const load = async () => {
      if (!me?.clubId) return;
      try {
        setLoading(true);
        const res = await axios.get(`${CLUB_API}/club/${me.clubId}`);
        const data = res?.data?.data ?? res?.data ?? null;
        if (data) {
          setClub(data);
          setHiring(data.isHiring ?? false);
        }
      } catch (err) {
        console.error("Error fetching club:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [me?.clubId]);

  const toggleHiring = async () => {
    try {
      const res = await axios.patch(`${CLUB_API}/club/${me?.clubId}/toggleHiring`);
      setHiring(res?.data?.data?.isHiring ?? !hiring);
    } catch (err) {
      console.error("Failed to toggle hiring:", err);
    }
  };

  const approveApplicant = async (appId: string) => {
    try {
      await axios.post(`${CLUB_API}/club/${me?.clubId}/approve`, { studentId: appId });
      setApplicants((prev) => prev.filter((a) => a._id !== appId));
    } catch (err) {
      console.error("Failed to approve applicant:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-center">Loading club info…</div>
          ) : !club ? (
            <div className="rounded-xl border bg-white p-6 text-center text-slate-600">
              Club not found.
            </div>
          ) : (
            <>
              <SectionCard title={`${club.clubName}`}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-slate-600 text-sm">
                    {club.description || "No description added yet."}
                  </p>
                  <button
                    onClick={toggleHiring}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                      hiring
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                    }`}
                  >
                    {hiring ? "Hiring Mode: ON" : "Hiring Mode: OFF"}
                  </button>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Members</h3>
                  <ul className="divide-y">
                    {club.members?.map((m: any) => (
                      <li
                        key={m._id}
                        className="py-2 flex items-center justify-between text-sm text-slate-700"
                      >
                        <span>{m.name}</span>
                        <span className="text-slate-500">{m.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionCard>

              <SectionCard title="Applicants">
                {applicants.length === 0 ? (
                  <p className="text-slate-500 text-sm">No current applicants.</p>
                ) : (
                  <ul className="divide-y">
                    {applicants.map((a) => (
                      <li key={a._id} className="py-2 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-slate-800">
                            {a.name} ({a.usn})
                          </p>
                          <p className="text-slate-500 text-xs">{a.email}</p>
                        </div>
                        <button
                          onClick={() => approveApplicant(a._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs"
                        >
                          Approve
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
