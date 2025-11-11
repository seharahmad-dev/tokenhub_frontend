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
      <div>
        <label className="text-sm font-medium">First Name</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Last Name</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        onClick={() => onSubmit({ firstName, lastName })}
        disabled={loading}
        className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}