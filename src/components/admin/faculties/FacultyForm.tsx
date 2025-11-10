import { useState } from "react";

export type Branch = "" | "CSE" | "ISE" | "ECE";

export type FacultyPayload = {
  firstName: string;
  lastName: string;
  collegeEmail: string;
  branch: Branch;
  designation: string;
  /** only used on create; backend requires password on register */
  password?: string;
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<FacultyPayload>;
  onSubmit: (p: FacultyPayload) => void;
  onCancel: () => void;
  busy?: boolean;
};

export default function FacultyForm({ mode, initial, onSubmit, onCancel, busy }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.collegeEmail ?? "");
  const [branch, setBranch] = useState<Branch>(initial?.branch ?? "");
  const [designation, setDesignation] = useState(initial?.designation ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");

  const creating = mode === "create";

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    (creating ? email.trim() : true) &&
    (creating ? password.trim().length >= 8 : true) &&
    (branch === "CSE" || branch === "ISE" || branch === "ECE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: FacultyPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      collegeEmail: (creating ? email : initial?.collegeEmail ?? email).trim(),
      branch,
      designation: designation.trim(),
      ...(creating ? { password: password } : {}),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-slate-600">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
            required
          />
        </div>
        {creating && (
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-600">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as Branch)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
            required
          >
            <option value="">Select branch</option>
            <option value="CSE">CSE</option>
            <option value="ISE">ISE</option>
            <option value="ECE">ECE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-600">Designation</label>
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Assistant Professor, Professor, etc."
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
            required
          />
        </div>
        {creating && (
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
              placeholder="Min 8 chars incl. upper, lower, digit, special"
              required
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Create" : "Save changes"}
        </button>
      </div>
    </form>
  );
}