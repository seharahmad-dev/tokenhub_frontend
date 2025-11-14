import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const STUDENT_API = import.meta.env.VITE_STUDENT_API;

export default function EventRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useAppSelector(selectStudent);

  const [teamName, setTeamName] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(`${STUDENT_API}/student/all`).then((res) => {
      setStudents(res.data.data || []);
    }).catch(()=>setStudents([]));
  }, []);

  const filtered = students.filter(
    (s) =>
      s._id !== me?._id &&
      (((s.firstName ?? "") + " " + (s.lastName ?? "")).toLowerCase().includes(search.toLowerCase()) || (s.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleNext = () => {
    if (!teamName) return alert("Enter team name");
    if (!me || !me._id) return alert("Student information not found.");
    navigate(`/student/events/${id}/payment`, {
      state: { teamName, participants: [me._id, ...selected], leader: me._id, eventId: id },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <SectionCard title="Register Your Team">
          <div className="space-y-4">
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team Name" className="w-full rounded-xl border border-blue-100 px-3 py-2 bg-white" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Participants" className="w-full rounded-xl border border-blue-100 px-3 py-2 bg-white" />
            <div className="max-h-60 overflow-y-auto rounded-xl border border-blue-100 bg-white">
              {filtered.map((s) => (
                <label key={s._id} className="flex items-center px-4 py-3 border-b last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selected.includes(s._id)}
                    onChange={() =>
                      setSelected((prev) =>
                        prev.includes(s._id) ? prev.filter((x) => x !== s._id) : [...prev, s._id]
                      )
                    }
                    className="mr-3"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Proceed to Payment</button>
              <button onClick={() => { setSelected([]); setTeamName(""); }} className="px-4 py-2 rounded-xl border border-blue-100 bg-white">Reset</button>
            </div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
}
