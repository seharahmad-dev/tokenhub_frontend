import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const DISCUSS_API = import.meta.env.VITE_DISCUSS_API as string;

export default function DiscussCreate() {
  const navigate = useNavigate();
  const student = useAppSelector(selectStudent);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);
  const authorId = student?._id ?? "";
  const authorName = useMemo(() => {
    const f = (student?.firstName || "").trim();
    const l = (student?.lastName || "").trim();
    const fallback = student?.email || student?.personalEmail || "Anonymous";
    return (f || l) ? `${f} ${l}`.trim() : fallback;
  }, [student]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState<string>(""); // comma/space separated
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tags = useMemo(() => {
    // split on comma or whitespace, filter empties, unique, lowercase
    const raw = tagsInput
      .split(/[,\s]+/)
      .map(t => t.trim())
      .filter(Boolean);
    return Array.from(new Set(raw.map(t => t.toLowerCase())));
  }, [tagsInput]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!authorId || !authorName || !title.trim() || !content.trim()) {
      setErr("Missing required fields (authorId, authorName, title, content).");
      return;
    }

    try {
      setSubmitting(true);
      const auth = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      };

      const payload = {
        authorId,
        authorName,
        title: title.trim(),
        content: content.trim(),
        tags, // array of strings
      };

      await axios.post(`${DISCUSS_API}/discuss/create`, payload, auth);
      navigate("/student/discuss");
    } catch (e: any) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to create discussion";
      setErr(m);
    } finally {
      setSubmitting(false);
    }
  }

  const disabled =
    submitting ||
    !authorId ||
    !authorName ||
    title.trim().length === 0 ||
    content.trim().length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[860px] mx-auto py-8">
          <SectionCard title="Create Discussion">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="text-sm text-slate-600">
                Posting as <b>{authorName || "—"}</b>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="What would you like to discuss?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. hackathon webdev react (comma or space separated)"
                />
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-slate-700 bg-slate-50"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Content <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Write the details of your question/topic…"
                />
              </div>

              {err && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {err}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={disabled}
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? "Publishing…" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
