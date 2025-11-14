import { useState } from "react";

export interface ProfilePayload {
  firstName: string;
  lastName: string;
}

export default function EditProfileForm({
  initial,
  onSubmit,
  loading,
}: {
  initial: ProfilePayload;
  onSubmit: (p: ProfilePayload) => void;
  loading: boolean;
}) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">First Name</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-300 outline-none"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Last Name</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-300 outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onSubmit({ firstName, lastName })}
          disabled={loading}
          className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-medium shadow disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
