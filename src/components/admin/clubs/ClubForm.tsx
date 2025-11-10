export type ClubCreatePayload = {
  clubName: string;
  password: string;
  /** Backend expects exactly one member with role "Club Head" */
  members: Array<{ studentId: string; role: "Club Head"; joiningDate?: string }>;
};

type Props = {
  onSubmit: (p: ClubCreatePayload) => void;
  onCancel: () => void;
  busy?: boolean;
};

import { useState } from "react";

export default function ClubForm({ onSubmit, onCancel, busy }: Props) {
  const [clubName, setClubName] = useState("");
  const [password, setPassword] = useState("");
  const [headStudentId, setHeadStudentId] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ClubCreatePayload = {
      clubName,
      password,
      members: [{ studentId: headStudentId, role: "Club Head" }],
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-600">Club name</label>
        <input value={clubName} onChange={e=>setClubName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
      </div>
      <div>
        <label className="text-xs text-slate-600">Club Head Student ID</label>
        <input value={headStudentId} onChange={e=>setHeadStudentId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        <p className="mt-1 text-xs text-slate-500">Provide the Mongo ObjectId of the student to make them Club Head.</p>
      </div>
      <div>
        <label className="text-xs text-slate-600">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
        <button disabled={busy} type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create</button>
      </div>
    </form>
  );
}
