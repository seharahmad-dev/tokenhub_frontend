import { useState } from "react";

export type DiscussComment = {
  _id: string;
  author?: string | { _id?: string; name?: string; email?: string };
  authorName?: string;
  content?: string;   // backend field
  text?: string;      // UI field
  createdAt?: string;
};

export default function DiscussComments({
  comments,
}: {
  comments: DiscussComment[];
}) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return <p className="text-sm text-slate-600">No comments yet.</p>;
  }
  return (
    <ul className="space-y-4">
      {comments.map((c) => {
        const authorFromObj =
          typeof c.author === "string"
            ? c.author
            : c.author?.name ?? c.authorName ?? "Anonymous";
        const authorName = c.authorName ?? authorFromObj ?? "Anonymous";
        const when = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";
        const text = c.text ?? c.content ?? "";
        return (
          <li key={c._id} className="rounded-lg border bg-slate-50 p-3">
            <div className="text-xs text-slate-600">
              {authorName} {when ? `• ${when}` : ""}
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{text}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function CommentForm({
  onSubmit,
  loading = false,
}: {
  onSubmit: (text: string) => Promise<void> | void;
  loading?: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await onSubmit(text.trim());
        setText("");
      }}
      className="mt-3"
    >
      <textarea
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
        rows={3}
        placeholder="Write a comment…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2">
        <button
          disabled={loading || !text.trim()}
          className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {loading ? "Posting…" : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
