import { useState, useMemo } from "react";
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

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string>(""); // comma-separated
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit =
    !!student?._id &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student?._id) {
      setErr("You must be logged in as a student to create a discussion.");
      return;
    }

    try {
      setLoading(true);
      setErr(null);

      const payload = {
        title: title.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        content: content.trim(),
        authorId: student._id,
      };

      const auth = {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      };

      const res = await axios.post(`${DISCUSS_API}/discuss`, payload, auth);
      const created =
        res?.data?.data ??
        res?.data?.payload ??
        res?.data?.post ??
        res?.data ??
        null;

      // Navigate to detail page if we have an id
      if (created && (created._id || created.id)) {
        navigate(`/student/discuss/${created._id ?? created.id}`);
      } else {
        navigate(`/student/discuss`);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to create discussion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[900px] mx-auto py-8">
          <SectionCard title="Create Discussion">
            {!student?._id && (
              <p className="mb-4 rounded-lg border bg-amber-50 p-3 text-sm text-amber-700">
                You are not logged in as a student. Please sign in to continue.
              </p>
            )}

            {err && (
              <div className="mb-4 rounded-lg border bg-white p-3 text-rose-600">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter a clear, concise title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. react, mongodb, events"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Use 2–5 tags to help others find your post.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Content
                </label>
                <textarea
                  className="mt-2 min-h-[180px] w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Write your question or discussion content…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {loading ? "Publishing…" : "Publish"}
                </button>
                <a
                  href="/student/discuss"
                  className="text-sm text-slate-600 hover:underline"
                >
                  Cancel
                </a>
              </div>
            </form>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
