// frontend: src/components/student/StudentPicker.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type StudentItem = {
  _id: string;
  firstName?: string;
  lastName?: string;
  usn?: string;
  email?: string;
};

export default function StudentPicker({
  excludeId,
  selected,
  onChange,
}: {
  excludeId?: string | null;
  selected: StudentItem[];
  onChange: (next: StudentItem[]) => void;
}) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      try {
        const res = await axios.get("/api/student"); // adjust base if needed
        const data = res?.data?.data ?? res?.data ?? [];
        if (!mounted) return;
        setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setList([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return list
      .filter((s) => (excludeId ? s._id !== excludeId : true))
      .filter((s) => {
        if (!ql) return true;
        const full = `${s.firstName ?? ""} ${s.lastName ?? ""} ${s.usn ?? ""} ${s.email ?? ""}`.toLowerCase();
        return full.includes(ql);
      })
      .slice(0, 200);
  }, [list, q, excludeId]);

  function toggle(s: StudentItem) {
    const exists = selected.some((x) => x._id === s._id);
    if (exists) onChange(selected.filter((x) => x._id !== s._id));
    else onChange([...selected, s]);
  }

  return (
    <div>
      <label className="block text-sm text-slate-700">Add Teammates</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, usn or email"
        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
      />
      <div className="mt-2 max-h-60 overflow-auto rounded border bg-white p-2">
        {loading ? (
          <div className="text-sm text-slate-500">Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">No students</div>
        ) : (
          filtered.map((s) => {
            const isSel = selected.some((x) => x._id === s._id);
            return (
              <div key={s._id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 rounded">
                <div>
                  <div className="text-sm font-medium">{(s.firstName || s.lastName) ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : s.email}</div>
                  <div className="text-xs text-slate-500">{s.usn ?? s.email}</div>
                </div>
                <div>
                  <button
                    onClick={() => toggle(s)}
                    className={`rounded px-2 py-1 text-sm ${isSel ? "bg-rose-600 text-white" : "border text-slate-700"}`}
                  >
                    {isSel ? "Remove" : "Add"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-2">
        <div className="text-xs text-slate-500">Selected:</div>
        <div className="mt-1 flex gap-2 flex-wrap">
          {selected.map((s) => (
            <div key={s._id} className="rounded-full border px-3 py-1 text-sm bg-slate-50">
              {s.firstName || s.lastName ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : s.email}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}