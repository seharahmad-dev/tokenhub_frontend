import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import EmptyState from "../../components/common/EmptyState";
import QuizCard from "../../components/student/QuizCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const QUIZ_API = (import.meta.env.VITE_QUIZ_API as string);

export default function QuizPage() {
  const student = useAppSelector(selectStudent);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  const auth = useMemo(
    () => ({ withCredentials: true, headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}` } }),
    []
  );

  // helper: convert backend choices into a cleaned array and keep mapping letter -> text
  const normalizeChoices = (choices: string[] | undefined) => {
    const clean = (raw: string) => {
      if (!raw) return "";
      return raw.replace(/^\s*[A-Da-d]\s*[\.\)\-:]\s*/, "").trim();
    };
    if (!Array.isArray(choices)) return ["", "", "", ""];
    // ensure 4 choices
    const arr = choices.slice(0, 4);
    while (arr.length < 4) arr.push("");
    return arr.map(clean);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setAlreadyAttempted(false);
      try {
        const resp = await axios.get(`${QUIZ_API.replace(/\/+$/, "")}/question/current`, auth);
        const data = resp?.data?.data ?? null;
        console.log("quiz current:", data);

        if (!data) {
          setCurrent(null);
          setResult(null);
          setSelected(null);
          return;
        }

        // normalize choices (strip letter prefixes if present)
        const choices = normalizeChoices(data.choices);
        const id = data.id ?? data._id ?? data._id;
        setCurrent({ id, question: data.question, choices, createdAt: data.createdAt, expireAt: data.expireAt });

        // reset UI selection/result for fresh question
        setSelected(null);
        setResult(null);

        // Check solvers: if server returned solvers array and it contains current student -> mark attempted
        const sid = student?._id ? String(student._id).trim() : null;
        const solversArr = Array.isArray(data.solvers) ? data.solvers.map(String) : [];

        if (sid && solversArr.includes(sid)) {
          // Only show a green notice and disable interactions. Do NOT reveal correct answer.
          setAlreadyAttempted(true);
        } else {
          setAlreadyAttempted(false);
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setCurrent(null);
        setResult(null);
        setSelected(null);
        setAlreadyAttempted(false);
      } finally {
        setLoading(false);
      }
    };
    load();
    // re-run when student changes (so we can detect if this user already solved),
    // and when QUIZ_API/auth changes.
  }, [QUIZ_API, auth, student]);

  const handleSelect = (choiceLetter: string) => {
    // selecting only allowed before submission; once result exists or if already attempted, disable
    if (result || alreadyAttempted) return;
    setSelected(choiceLetter);
  };

  const handleSubmit = async () => {
    if (!current || !selected || !student?._id) {
      alert("Select an answer and ensure you are signed in.");
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post(
        `${QUIZ_API.replace(/\/+$/, "")}/question/${encodeURIComponent(current.id)}/answer`,
        { choice: selected, studentId: student._id },
        { withCredentials: true }
      );
      const data = resp?.data?.data ?? null;
      // backend returns: { correct: boolean, withinWindow, correctAnswer: 'A'|'B'..., explanation, awarded }
      // Map correctAnswer letter to the actual choice text for display
      const correctLetter = data?.correctAnswer ? String(data.correctAnswer).toUpperCase() : null;
      const letterToText = (letter: string | null) => {
        if (!letter || !current?.choices) return "";
        const idx = ["A", "B", "C", "D"].indexOf(letter);
        if (idx === -1) return "";
        return current.choices[idx] ?? "";
      };

      const enriched = {
        ...data,
        correctAnswerText: letterToText(correctLetter),
        correctAnswerLetter: correctLetter,
      };

      // After a successful submission, prevent further attempts for this user
      if (student?._id) setAlreadyAttempted(true);

      setResult(enriched);
    } catch (err: any) {
      console.error("Submit answer failed:", err);
      // handle known server 400 "already solved" message gracefully
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 400 && typeof serverMsg === "string" && serverMsg.toLowerCase().includes("already")) {
        // reflect server state: mark already attempted but do NOT show correct answer
        setAlreadyAttempted(true);
        setResult(null);
      } else {
        alert("Failed to submit answer. Try again.");
      }
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
                {/* Green notice shown high up when user already attempted. No answers revealed. */}
                {alreadyAttempted && (
                  <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-white-800">
                    You have already attempted this quiz.
                  </div>
                )}

                <div className="mb-3 text-sm text-slate-600">
                  Answer the question below. Submissions are handled by the server (awarding is decided server-side).
                </div>

                <QuizCard
                  questionId={current.id}
                  question={current.question}
                  choices={current.choices}
                  onSelect={handleSelect}
                  disabled={!!result || alreadyAttempted}
                  selected={selected}
                  onCopyPrevent={preventCopy}
                />

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!selected || !!result || loading || alreadyAttempted}
                    className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {loading ? "Submitting…" : "Submit Answer"}
                  </button>
                </div>

                {/* After submission show result (normal flow). If alreadyAttempted we intentionally do NOT show any correct answer */}
                {result && (
                  <div className="mt-4 rounded border bg-white p-4">
                    <div className="font-medium mb-2">{result.correct ? "Correct! 🎉" : "Incorrect"}</div>
                    <div className="text-sm mb-2">
                      Correct answer: <strong>{result.correctAnswerLetter ?? ""} — {result.correctAnswerText ?? ""}</strong>
                    </div>
                    {result.explanation && <div className="text-sm text-slate-700 mb-2">{result.explanation}</div>}
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
