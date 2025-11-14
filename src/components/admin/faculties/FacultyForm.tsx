import { useState } from "react";

export type Branch = "" | "CSE" | "ISE" | "ECE";

export type FacultyPayload = {
  firstName: string;
  lastName: string;
  collegeEmail: string;
  branch: Branch;
  designation: string;
  password?: string; // only for create
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<FacultyPayload>;
  onSubmit: (p: FacultyPayload) => void;
  onCancel: () => void;
  busy?: boolean;
};

export default function FacultyForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  busy,
}: Props) {
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

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      collegeEmail: creating ? email.trim() : initial?.collegeEmail ?? email,
      branch,
      designation: designation.trim(),
      ...(creating ? { password } : {}),
    });
  };

   return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl rounded-xl bg-white"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label className="text-sm font-medium text-slate-700">
            First name
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="text-sm font-medium text-slate-700">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
            required
          />
        </div>

        {/* Email */}
        {creating && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
              required
            />
          </div>
        )}

        {/* Branch */}
        <div>
          <label className="text-sm font-medium text-slate-700">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as Branch)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
            required
          >
            <option value="">Select branch</option>
            <option value="CSE">CSE</option>
            <option value="ISE">ISE</option>
            <option value="ECE">ECE</option>
          </select>
        </div>

        {/* Designation */}
        <div>
          <label className="text-sm font-medium text-slate-700">
            Designation
          </label>
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Assistant Professor, Professor, etc."
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
            required
          />
        </div>

        {/* Password */}
        {creating && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200"
              required
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {creating ? "Create" : "Save changes"}
        </button>
      </div>
    </form>
  );
}