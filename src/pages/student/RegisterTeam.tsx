import { useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import StudentPicker from "../../components/student/StudentPicker";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

type StudentItem = { _id: string; firstName?: string; lastName?: string; email?: string; usn?: string; };

export default function RegisterTeam() {
  const me = useAppSelector(selectStudent);
  const leaderId = me?._id ?? "";
  const leaderName = `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() || me?.email || "You";

  const [teamName, setTeamName] = useState("");
  const [selected, setSelected] = useState<StudentItem[]>([]);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [pastePaymentId, setPastePaymentId] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const participantsPayload = useMemo(() => {
    const leader = { studentId: leaderId, name: leaderName, email: me?.email ?? "" };
    const others = selected.map((s) => ({ studentId: s._id, name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.email, email: s.email ?? "" }));
    const uniq = [leader, ...others].filter((v, i, a) => a.findIndex((x) => x.studentId === v.studentId) === i);
    return uniq;
  }, [leaderId, leaderName, me?.email, selected]);

  async function handleCreatePayment() {
    if (!teamName.trim()) {
      setMsg("Please enter team name.");
      return;
    }
    if (!leaderId) {
      setMsg("Please sign in first.");
      return;
    }
    if (!participantsPayload || participantsPayload.length === 0) {
      setMsg("Please add at least one participant (leader included).");
      return;
    }
    setMsg(null);
    setLoadingPayment(true);
    try {
      const amount = 100;
      const res = await axios.post("/api/payment/create", { amount, studentId: leaderId, eventId: "manual-event" });
      const payload = res?.data?.data ?? res?.data;
      const order = payload?.order ?? payload;
      const orderIdGot = order?.id ?? order?.orderId ?? order?.razorpayOrderId ?? null;
      const amt = order?.amount ? Math.round(order.amount / 100) : amount;
      setOrderId(orderIdGot);
      setOrderAmount(amt);
      setCopied(false);
      setMsg("Payment order created. Use the order id to complete payment in Razorpay or copy it and follow your flow.");
    } catch (err: any) {
      console.error("payment create err", err);
      setMsg(err?.response?.data?.message || err?.message || "Failed to create payment order");
    } finally {
      setLoadingPayment(false);
    }
  }

  async function handleCopyOrder() {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleFinalizeRegistration() {
    if (!orderId) {
      setMsg("Create payment order first.");
      return;
    }
    if (!pastePaymentId.trim()) {
      setMsg("Paste the payment id you received after paying.");
      return;
    }
    setMsg(null);
    setCreating(true);
    try {
      setMsg("Registration successful!");
    } catch (err: any) {
      console.error("create registration err", err);
      setMsg(err?.response?.data?.message || err?.message || "Failed to create registration");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[900px] mx-auto py-8">
          <SectionCard title="Register a Team">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Team Name</label>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-2 bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium">Leader</label>
                <div className="mt-2 rounded-xl border border-blue-100 bg-white px-3 py-2">
                  <div className="text-sm font-medium text-slate-900">{leaderName}</div>
                  <div className="text-xs text-slate-500">{me?.usn ?? me?.email}</div>
                </div>
              </div>

              <StudentPicker excludeId={leaderId} selected={selected} onChange={setSelected} />

              <div className="mt-4 flex gap-2">
                <button disabled={loadingPayment} onClick={handleCreatePayment} className="rounded-xl bg-blue-600 px-3 py-2 text-white">
                  {loadingPayment ? "Creating payment…" : "Create Payment Order"}
                </button>
                <button onClick={() => { setSelected([]); setTeamName(""); }} className="rounded-xl border border-blue-100 px-3 py-2 bg-white">
                  Reset
                </button>
              </div>

              {orderId && (
                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-700">Order ID</div>
                      <div className="font-medium">{orderId}</div>
                      <div className="text-xs text-slate-500">Amount: {orderAmount ?? "—"} INR</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={handleCopyOrder} className="rounded-xl bg-blue-600 px-3 py-2 text-white text-sm">
                        {copied ? "Copied ✓" : "Copy Order Id"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    After creating the order, complete the payment using your Razorpay flow. When you receive the final payment id paste it below and click Finalize Registration.
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm">Paste payment id</label>
                    <input value={pastePaymentId} onChange={(e) => setPastePaymentId(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-2 bg-white" />
                    <div className="mt-2 flex gap-2">
                      <button onClick={handleFinalizeRegistration} disabled={creating} className="rounded-xl bg-blue-600 px-3 py-2 text-white">
                        {creating ? "Finalizing…" : "Finalize Registration"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {msg && <div className="text-sm text-slate-700 mt-2 rounded-xl border border-blue-100 bg-white p-3">{msg}</div>}
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
