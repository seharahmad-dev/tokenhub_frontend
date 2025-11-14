import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import EventCard, { EventRow } from "./EventCard";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectStudent, setStudent } from "../../app/studentSlice";

const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";

export default function SuggestedEvents() {
  const dispatch = useAppDispatch();
  const student = useAppSelector(selectStudent);

  const stored = useMemo(() => {
    try {
      const s = sessionStorage.getItem("suggestedEvents");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }, []);

  const initialSuggested: EventRow[] =
    (student && Array.isArray((student as any).suggestedEvents) ? (student as any).suggestedEvents : null) ??
    (Array.isArray(stored) ? stored : []);

  const [suggestedEvents, setSuggestedEvents] = useState<EventRow[]>(initialSuggested);
  const [findModalOpen, setFindModalOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [findSubmitting, setFindSubmitting] = useState(false);
  const [findErr, setFindErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!suggestedEvents || suggestedEvents.length === 0) {
        sessionStorage.removeItem("suggestedEvents");
      } else {
        sessionStorage.setItem("suggestedEvents", JSON.stringify(suggestedEvents));
      }
    } catch {}
  }, [suggestedEvents]);

  useEffect(() => {
    if (!student) return;
    const se = (student as any).suggestedEvents;
    if (Array.isArray(se) && se.length > 0 && suggestedEvents.length === 0) {
      setSuggestedEvents(se);
    }
  }, [student]);

  const wordCount = useMemo(() => {
    if (!findText) return 0;
    const words = findText.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [findText]);

  async function submitFind() {
    setFindErr(null);
    if (wordCount === 0) {
      setFindErr("Please enter your interests.");
      return;
    }
    if (wordCount > 1000) {
      setFindErr("Exceeded 1000 words limit.");
      return;
    }

    setFindSubmitting(true);
    try {
      const token = sessionStorage.getItem("accessToken") || "";
      const auth = { headers: { Authorization: token ? `Bearer ${token}` : "" }, withCredentials: true };
      const url = `${EVENT_API.replace(/\/+$/, "")}/rag-ai`;
      const res = await axios.post(
        url,
        { prompt: findText },
        auth
      );

      const payload = res?.data?.data ?? res?.data ?? res;
      const eventsArr: any[] = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : [];

      const normalized: EventRow[] = eventsArr.map((ev: any) => ({
        _id: String(ev._id ?? ev.id ?? ev.eventId ?? Math.random().toString(36).slice(2)),
        title: String(ev.title ?? ev.name ?? ev.eventTitle ?? "Untitled Event"),
        schedule: ev.schedule ? String(ev.schedule) : ev.date ? String(ev.date) : undefined,
        venue: ev.venue ?? ev.location ?? undefined,
      }));

      setSuggestedEvents(normalized);
      if (student) {
        const updated = { ...(student as any), suggestedEvents: normalized };
        dispatch(setStudent(updated));
      }
      setFindModalOpen(false);
      setFindText("");
      setFindErr(null);
    } catch (err: any) {
      setFindErr(err?.response?.data?.message || "Failed to find suggestions. Try again.");
    } finally {
      setFindSubmitting(false);
    }
  }

  function handleClearSuggested() {
    setSuggestedEvents([]);
    sessionStorage.removeItem("suggestedEvents");
    if (student) {
      const updated = { ...(student as any) };
      if (updated.suggestedEvents) delete updated.suggestedEvents;
      dispatch(setStudent(updated));
    }
  }

  return (
    <div>
      <div className="rounded-xl border border-dashed border-blue-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-800 font-medium">Suggested for you</div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFindModalOpen(true);
                setFindErr(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium shadow"
            >
              Find
            </button>

            <button
              onClick={handleClearSuggested}
              disabled={!suggestedEvents || suggestedEvents.length === 0}
              className={`text-sm px-3 py-1.5 rounded-xl ${
                suggestedEvents && suggestedEvents.length > 0
                  ? "bg-white border border-blue-100 text-blue-700 hover:bg-blue-50 shadow-sm"
                  : "bg-white border border-blue-50 text-slate-400 cursor-not-allowed"
              }`}
              title={suggestedEvents && suggestedEvents.length > 0 ? "Clear suggestions" : "No suggestions to clear"}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-blue-50 bg-white p-3 text-sm text-slate-600">
          {suggestedEvents && suggestedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedEvents.map((ev) => (
                <EventCard key={ev._id} e={ev as any} participated={false} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-slate-700">No suggestions yet</div>
              <div className="text-xs text-slate-500">
                Click <span className="font-medium">Find</span> to describe your interests (up to 1000 words) and get recommended events.
              </div>
            </div>
          )}
        </div>
      </div>

      {findModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!findSubmitting) {
                setFindModalOpen(false);
                setFindText("");
                setFindErr(null);
              }
            }}
          />

          <div className="relative w-full max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white p-6 shadow-2xl border border-blue-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Find events - tell us about your interests</h2>
                  <p className="text-xs text-slate-500 mt-1">Describe your interests, experience, or what you're looking for (up to 1000 words).</p>
                </div>

                <button
                  onClick={() => {
                    if (!findSubmitting) {
                      setFindModalOpen(false);
                      setFindText("");
                      setFindErr(null);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 rounded-full p-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <textarea
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-blue-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="E.g. I'm interested in robotics competitions, hackathons for beginners, workshops on embedded systems, and networking events..."
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <div>Words: {wordCount}/1000</div>
                  <div>{findErr && <span className="text-rose-600">{findErr}</span>}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setFindModalOpen(false);
                    setFindText("");
                    setFindErr(null);
                  }}
                  disabled={findSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-sm text-blue-700 hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  onClick={submitFind}
                  disabled={findSubmitting || wordCount === 0 || wordCount > 1000}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {findSubmitting ? "Finding…" : "Find"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
