import { useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";

const DISCUSS_API = import.meta.env.VITE_DISCUSS_API as string;

export default function DiscussCreate() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const token = useMemo(() => sessionStorage.getItem("accessToken") || "", []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      const body = {
        title: title.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        content: content.trim(),
      };
      await axios.post(`${DISCUSS_API}/discuss/create`, body, auth);
      window.location.href = "/student/discuss";
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[800px] mx-auto py-8">
          <h1 className="text-xl font-semibold">Create Discussion</h1>

          <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border bg-white p-5">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Best resources to learn DSA?"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dsa, placements, webdev"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea
                rows={8}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your question / discussion details…"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={loading || !title.trim() || !content.trim()}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
              >
                {loading ? "Publishing…" : "Publish"}
              </button>
              <a href="/student/discuss" className="rounded-lg border px-4 py-2">
                Cancel
              </a>
            </div>

            {msg && <p className="text-sm text-rose-600">{msg}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
