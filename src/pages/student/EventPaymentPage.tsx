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
      studentId: state.leader,
      eventId: id,
    });
    setOrder(res.data.data.order);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const finalize = async () => {
    if (!paymentId) return alert("Enter payment ID");

    // ensure participants are IDs (IDs were passed from EventRegisterPage)
    await axios.post(`${REG_API}/registrations/create`, {
      eventId: id,
      teamName: state.teamName,
      participantsId: state.participants, // <-- array of student IDs (not emails)
      teamLeaderId: state.leader,        // <-- leader ID
      paymentId,
    });

    alert("Registration successful!");
    navigate("/student/events");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <SectionCard title="Payment">
          {!order ? (
            <div className="space-y-3">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (₹)"
                className="w-full border rounded-lg px-3 py-2"
              />
              <button
                onClick={createOrder}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Create Payment Order
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border p-3 rounded-lg bg-white">
                Order ID: <b>{order.id}</b>{" "}
                <button
                  onClick={handleCopy}
                  className="text-xs ml-2 underline text-blue-600"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <input
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter Razorpay Payment ID"
                className="w-full border rounded-lg px-3 py-2"
              />
              <button
                onClick={finalize}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Complete Registration
              </button>
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
}
