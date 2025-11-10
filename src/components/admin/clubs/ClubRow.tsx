export type ClubMember = {
  _id?: string;
  studentId: string;
  role: string;          // "Club Head" | "member" | etc.
  joiningDate?: string;
  name?: string;         // if your API populates
  studentName?: string;  // alternate
};

export type Club = {
  _id: string;
  clubName: string;
  members: ClubMember[];
};

type Props = {
  c: Club;
  onReplaceHead: (id: string, newHeadId: string) => void;
  onDelete: (id: string) => void;
};

import { useState } from "react";

export default function ClubRow({ c, onReplaceHead, onDelete }: Props) {
  const head = c.members?.find(m => m.role === "Club Head" || m.role === "clubHead");
  const headLabel = head?.name || head?.studentName || head?.studentId || "-";
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [newHeadId, setNewHeadId] = useState("");

  return (
    <>
      <tr className="border-t">
        <td className="px-3 py-2">{c.clubName}</td>
        <td className="px-3 py-2">{headLabel}</td>
        <td className="px-3 py-2">{c.members?.length ?? 0}</td>
        <td className="px-3 py-2 text-right">
          <div className="inline-flex gap-2">
            <button onClick={()=>setReplaceOpen(true)} className="rounded-lg border px-3 py-1 text-xs">Replace Head</button>
            <button onClick={()=>onDelete(c._id)} className="rounded-lg bg-rose-600 px-3 py-1 text-xs text-white">Delete</button>
          </div>
        </td>
      </tr>

      {replaceOpen && (
        <tr className="bg-slate-50">
          <td colSpan={4} className="px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={newHeadId}
                onChange={(e)=>setNewHeadId(e.target.value)}
                placeholder="New Head StudentId (ObjectId)"
                className="w-full sm:w-96 rounded-lg border px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReplaceHead(c._id, newHeadId); setReplaceOpen(false); setNewHeadId(""); }}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button onClick={()=>{ setReplaceOpen(false); setNewHeadId(""); }} className="rounded-lg border px-3 py-2 text-xs">
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
