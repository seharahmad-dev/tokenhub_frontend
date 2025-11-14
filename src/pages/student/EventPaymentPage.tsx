import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";

const PAYMENT_API = import.meta.env.VITE_PAYMENT_API;
const REG_API = import.meta.env.VITE_REG_API;

export default function EventPaymentPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [paymentId, setPaymentId] = useState("");
  const [copied, setCopied] = useState(false);

  const createOrder = async () => {
    if (!amount) return alert("Enter amount");
    const res = await axios.post(`${PAYMENT_API}/payment/create`, {
      amount: Number(amount),
      studentId: state?.leader,
      eventId: id,
    });
    setOrder(res.data.data.order ?? res.data.order ?? res.data?.data ?? null);
  };

  const handleCopy = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id ?? order.orderId ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const finalize = async () => {
    if (!paymentId) return alert("Enter payment ID");
    await axios.post(`${REG_API}/registrations/create`, {
      eventId: id,
      teamName: state.teamName,
      participantsId: state.participants,
      teamLeaderId: state.leader,
      paymentId,
    });
    alert("Registration successful!");
    navigate("/student/events");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <SectionCard title="Payment">
          {!order ? (
            <div className="space-y-4">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (₹)"
                className="w-full rounded-xl border border-blue-100 px-3 py-2 bg-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={createOrder}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  Create Payment Order
                </button>
                <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl border border-blue-100 bg-white">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 p-4 bg-white flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Order ID</div>
                  <div className="font-medium">{order.id ?? order.orderId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Amount</div>
                  <div className="font-medium text-blue-700">{order.amount ? Math.round(order.amount / 100) : amount} INR</div>
                  <button onClick={handleCopy} className="mt-2 text-sm text-blue-600 underline">{copied ? "Copied!" : "Copy"}</button>
                </div>
              </div>

              <input
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter Razorpay Payment ID"
                className="w-full rounded-xl border border-blue-100 px-3 py-2 bg-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={finalize}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  Complete Registration
                </button>
                <button onClick={() => setOrder(null)} className="px-4 py-2 rounded-xl border border-blue-100 bg-white">Back</button>
              </div>
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
}
