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
    });
  }, []);

  const filtered = students.filter(
    (s) =>
      s.email !== me?.email &&
      (s.firstName + " " + s.lastName)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const handleNext = () => {
    if (!teamName) return alert("Enter team name");
    if (!me || !me.email) return alert("Student information not found.");
    navigate(`/student/events/${id}/payment`, {
      state: { teamName, participants: [me.email, ...selected], leader: me.email, eventId: id },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <SectionCard title="Register Your Team">
          <div className="space-y-4">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team Name"
              className="w-full border rounded-lg px-3 py-2"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Participants"
              className="w-full border rounded-lg px-3 py-2"
            />
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {filtered.map((s) => (
                <label key={s.email} className="flex items-center px-3 py-2 border-b">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.email)}
                    onChange={() =>
                      setSelected((prev) =>
                        prev.includes(s.email)
                          ? prev.filter((x) => x !== s.email)
                          : [...prev, s.email]
                      )
                    }
                    className="mr-2"
                  />
                  {s.firstName} {s.lastName} ({s.email})
                </label>
              ))}
            </div>
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Proceed to Payment
            </button>
          </div>
        </SectionCard>
      </main>
    </div>
  );
}
