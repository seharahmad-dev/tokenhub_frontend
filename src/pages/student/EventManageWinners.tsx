import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";

const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";
const REG_API = (import.meta.env.VITE_REG_API as string) || "";
const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";

type Registration = {
  _id: string;
  teamName?: string;
  participantsId?: string[];
  teamLeaderId?: string;
  verifiedUsers?: string[];
};

export default function EventManageWinners() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ first?: string; second?: string; third?: string }>({});
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` }, withCredentials: true }), [token]);

  useEffect(() => {
    const m = window.location.pathname.match(/\/event\/([^/]+)(\/|$)/);
    if (m) setEventId(decodeURIComponent(m[1]));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const base = REG_API.replace(/\/+$/, "");
        const tryUrls = [
          `${base}/registrations/event/${encodeURIComponent(eventId)}`,
          `${base}/registrations?eventId=${encodeURIComponent(eventId)}`,
          `${base}/registration/${encodeURIComponent(eventId)}/registrations`,
          `${base}/registration/${encodeURIComponent(eventId)}`,
          `${base}/${encodeURIComponent(eventId)}/registrations`,
          `${base}/registrations/${encodeURIComponent(eventId)}`,
          `${base}/registrations?${encodeURIComponent(eventId)}/raw`
        ];

        let res = null;
        for (const url of tryUrls) {
          try {
            res = await axios.get(url, auth);
            const payload = res?.data?.data ?? res?.data ?? null;
            if (Array.isArray(payload) || Array.isArray(res?.data) || Array.isArray(res?.data?.data)) {
              break;
            }
          } catch (e) {}
        }

        if (!res) throw new Error("No registration endpoint responded");

        const payload = res?.data?.data ?? res?.data ?? [];
        if (mounted) setRegistrations(Array.isArray(payload) ? payload : []);
      } catch (err) {
        console.error("Failed to load registrations:", err);
        setRegistrations([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [eventId, REG_API, auth]);

  const filtered = registrations.filter((r) =>
    !filter ? true : (String(r.teamName || "").toLowerCase().includes(filter.toLowerCase()))
  );

  const computeTokens = (participantsCount: number, rank?: number) => {
    const Base = 10;
    const gammaMap = { 1: 20, 2: 10, 3: 5 };
    const bonus = rank ? (gammaMap[rank as keyof typeof gammaMap] || 0) : 0;
    const alpha = 2;
    const tokens = Math.round(Base + alpha * Math.log(participantsCount + 1) + bonus);
    return tokens;
  };

  const buildWinnersPayload = (base = 10, duration = 1) => {
    const winners: { teamName: string; rank: number }[] = [];
    if (selected.first) {
      const r = registrations.find((x) => String(x._id) === selected.first);
      if (r && r.teamName) winners.push({ teamName: String(r.teamName).trim(), rank: 1 });
    }
    if (selected.second) {
      const r = registrations.find((x) => String(x._id) === selected.second);
      if (r && r.teamName) winners.push({ teamName: String(r.teamName).trim(), rank: 2 });
    }
    if (selected.third) {
      const r = registrations.find((x) => String(x._id) === selected.third);
      if (r && r.teamName) winners.push({ teamName: String(r.teamName).trim(), rank: 3 });
    }
    return { winners, base, duration };
  };

  const creditAll = async () => {
    if (!confirm("Award tokens to teams (will call registration service to process token awarding)?")) return;
    if (!eventId) {
      alert("Event ID not found");
      return;
    }
    const payload = buildWinnersPayload(10, 1);
    setProcessing(true);
    setMessage(null);
    try {
      const base = REG_API.replace(/\/+$/, "");
      const candidateUrls = [
        `${base}/registrations/${encodeURIComponent(eventId)}/award-tokens`,
      ];

      let resp = null;
      let lastErr: any = null;
      for (const url of candidateUrls) {
        try {
          resp = await axios.post(url, payload, auth);
          if (resp && (resp.status >= 200 && resp.status < 300 || resp.status === 207)) {
            break;
          }
        } catch (e: any) {
          lastErr = e;
          resp = null;
        }
      }

      if (!resp) {
        console.error("Award tokens failed - no endpoint responded", lastErr);
        setMessage("Failed to call registration service to award tokens. See console for details.");
        alert("Failed to call registration service to award tokens. See console.");
        return;
      }

      if (resp.status === 207) {
        const data = resp?.data ?? {};
        console.warn("Partial success awarding tokens:", data);
        setMessage(`Completed with some failures. Check console for details.`);
        alert("Completed with some failures. See console.");
      } else if (resp.status >= 200 && resp.status < 300) {
        const data = resp?.data ?? {};
        console.log("Award tokens response:", data);
        setMessage("Tokens awarding request completed. Check backend for details.");
        alert("Tokens awarding requested successfully.");
      } else {
        setMessage(`Unexpected response: ${resp.status}`);
        console.warn("Unexpected award-tokens response", resp);
      }
    } catch (err) {
      console.error("Credit all (award-tokens) failed:", err);
      setMessage("Award tokens failed. See console for details.");
      alert("Award tokens failed. See console.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[980px] mx-auto space-y-6">
          <SectionCard title={`Manage winners — Event ${eventId ?? ""}`}>
            <div className="mb-4 flex items-center gap-3">
              <input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Search team name" className="rounded-xl border border-blue-100 px-3 py-2 w-full bg-white" />
              <button onClick={()=>{ setFilter(""); }} className="px-3 py-2 rounded-xl border border-blue-100 bg-white text-sm">Clear</button>
            </div>

            {loading ? (
              <div className="p-6 text-center rounded-xl bg-white border border-blue-100">Loading…</div>
            ) : registrations.length === 0 ? (
              <EmptyState title="No registrations" subtitle="No teams registered for this event." />
            ) : (
              <>
                <div className="grid gap-3 mb-3">
                  {filtered.map((r) => {
                    const id = String(r._id);
                    const participants = Array.isArray(r.participantsId) ? r.participantsId.length : 1;
                    return (
                      <div key={id} className="rounded-xl border border-blue-100 bg-white p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-slate-900">{r.teamName ?? `Team ${id}`}</div>
                          <div className="text-xs text-slate-500">{participants} members</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500 mr-2">Mark</div>
                          <button onClick={()=>setSelected(s=>({...s, first: id}))} className={`px-2 py-1 rounded-xl text-sm border ${selected.first===id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-blue-50"}`}>1st</button>
                          <button onClick={()=>setSelected(s=>({...s, second: id}))} className={`px-2 py-1 rounded-xl text-sm border ${selected.second===id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-blue-50"}`}>2nd</button>
                          <button onClick={()=>setSelected(s=>({...s, third: id}))} className={`px-2 py-1 rounded-xl text-sm border ${selected.third===id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-blue-50"}`}>3rd</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <div className="mb-3 text-sm text-slate-700">Selected winners:</div>
                  <div className="flex gap-4 items-center mb-3">
                    <div className="text-sm">1st: <span className="font-medium">{selected.first ? (registrations.find(r=>String(r._id)===selected.first)?.teamName ?? selected.first) : "—"}</span></div>
                    <div className="text-sm">2nd: <span className="font-medium">{selected.second ? (registrations.find(r=>String(r._id)===selected.second)?.teamName ?? selected.second) : "—"}</span></div>
                    <div className="text-sm">3rd: <span className="font-medium">{selected.third ? (registrations.find(r=>String(r._id)===selected.third)?.teamName ?? selected.third) : "—"}</span></div>
                    <button onClick={()=>setSelected({})} className="ml-auto px-3 py-1 rounded-xl border border-blue-100 text-sm bg-white">Reset</button>
                  </div>

                  <div className="mb-3">
                    <button onClick={creditAll} disabled={processing} className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                      {processing ? "Processing…" : "Award tokens (call backend)"}
                    </button>
                  </div>

                  {message && <div className="text-sm text-slate-700">{message}</div>}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
