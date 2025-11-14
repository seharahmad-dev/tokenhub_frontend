// src/pages/student/QuizPage.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import QuizCard from "../../components/student/QuizCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const QUIZ_API = (import.meta.env.VITE_QUIZ_API as string) || ""; // e.g. http://localhost:4011/api/quiz
const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";

export default function QuizPage() {
  const student = useAppSelector(selectStudent);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [eligible, setEligible] = useState<boolean>(true);
  const [result, setResult] = useState<any | null>(null);
  const timerRef = useRef<number | null>(null);

  const auth = useMemo(() => ({ withCredentials: true, headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}` } }), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await axios.get(`${QUIZ_API.replace(/\/+$/, "")}/question/current`, auth);
        const data = resp?.data?.data ?? null;
        if (!data) {
          setCurrent(null);
        } else {
          setCurrent(data);
          // reset state
          setSelected(null);
          setResult(null);
          setTimeLeft(30);
          setEligible(true);
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setCurrent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [QUIZ_API, auth]);

  // start countdown when a question is available
  useEffect(() => {
    if (!current) return;
    setTimeLeft(30);
    setEligible(true);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // time up
          window.clearInterval(timerRef.current!);
          timerRef.current = null;
          setEligible(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [current]);

  const handleSelect = (choice: string) => {
    if (!eligible) return;
    setSelected(choice);
  };

  const handleSubmit = async () => {
    if (!current || !selected || !student?._id) {
      alert("Select an answer and ensure you are signed in.");
      return;
    }
    // disable further input
    setEligible(false);
    setLoading(true);
    try {
      const resp = await axios.post(
        `${QUIZ_API.replace(/\/+$/, "")}/question/${encodeURIComponent(current.id)}/answer`,
        { choice: selected, studentId: student._id },
        { withCredentials: true }
      );

      const data = resp?.data?.data ?? null;
      setResult(data);
      // optionally refresh token counts in navbar by fetching tokens — omitted here
    } catch (err:any) {
      console.error("Submit answer failed:", err);
      alert("Failed to submit answer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const preventCopy = (e: any) => {
    e.preventDefault();
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[980px] mx-auto space-y-6">
          <SectionCard title="Daily Quiz (1 question every 24h)">
            {loading ? (
              <div className="p-4 text-center">Loading…</div>
            ) : !current ? (
              <EmptyState title="No quiz today" subtitle="Check back tomorrow for a new question." />
            ) : (
              <>
                <div className="mb-3 text-sm text-slate-600">You have <strong>{timeLeft}</strong> seconds to answer this question. Answering after 30s will not award a token.</div>

                <QuizCard
                  questionId={current.id}
                  question={current.question}
                  choices={current.choices}
                  onSelect={handleSelect}
                  disabled={!eligible || !!result}
                  selected={selected}
                  onCopyPrevent={preventCopy}
                />

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!eligible || !selected || !!result || loading}
                    className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {loading ? "Submitting…" : "Submit Answer"}
                  </button>

                  {!eligible && !result && <div className="text-sm text-rose-600">Time's up — answer not eligible for token.</div>}
                </div>

                {/* After submission show result */}
                {result && (
                  <div className="mt-4 rounded border bg-white p-4">
                    <div className="font-medium mb-2">{result.correct ? "Correct! 🎉" : "Incorrect"}</div>
                    <div className="text-sm mb-2">Correct answer: <strong>{result.correctAnswer}</strong></div>
                    <div className="text-sm text-slate-700">{result.explanation}</div>
                    {!result.awarded && result.withinWindow && result.correct && (
                      <div className="text-sm text-rose-600 mt-2">Token awarding failed or not configured. Check admin.</div>
                    )}
                    {!result.withinWindow && (
                      <div className="text-sm text-rose-600 mt-2">You answered after the 30s window; token not awarded.</div>
                    )}
                    {result.awarded && <div className="text-sm text-emerald-600 mt-2">1 token added to your account.</div>}
                  </div>
                )}
              </>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
