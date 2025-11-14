import { useEffect, useState } from "react";

/**
 * Exported payload type so pages can import HodPayload from this module.
 * Matches the shape expected by the page and API.
 */
export type HodPayload = {
  firstName: string;
  lastName: string;
  branch: "CSE" | "ISE" | "ECE" | "";
  email?: string;        // required at register
  password?: string;     // required at register
  phone?: string;
  tenureStart?: string;  // ISO yyyy-mm-dd
  tenureEnd?: string;    // ISO yyyy-mm-dd
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<HodPayload>;
  onSubmit: (p: HodPayload) => void;
  onCancel: () => void;
  busy?: boolean;
};

export default function HodForm({ mode, initial, onSubmit, onCancel, busy }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [branch, setBranch] = useState<"CSE" | "ISE" | "ECE" | "">(initial?.branch as any ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [tenureStart, setTenureStart] = useState(initial?.tenureStart ?? "");
  const [tenureEnd, setTenureEnd] = useState(initial?.tenureEnd ?? "");

  useEffect(() => {
    setFirstName(initial?.firstName ?? "");
    setLastName(initial?.lastName ?? "");
    setBranch((initial?.branch as any) ?? "");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
    setTenureStart(initial?.tenureStart ?? "");
    setTenureEnd(initial?.tenureEnd ?? "");
  }, [initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: HodPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      branch,
      ...(mode === "create" ? { email: email.trim(), password: password } : {}),
      phone: phone.trim() || undefined,
      tenureStart: tenureStart || undefined,
      tenureEnd: tenureEnd || undefined,
    };
    onSubmit(payload);
  };

  const valid =
    Boolean(firstName.trim()) &&
    Boolean(lastName.trim()) &&
    Boolean(branch) &&
    (mode === "edit" ? true : Boolean(email.trim()) && Boolean(password));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600 block">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 block">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs text-slate-600 block">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as any)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none bg-white"
          >
            <option value="">Select</option>
            <option value="CSE">CSE</option>
            <option value="ISE">ISE</option>
            <option value="ECE">ECE</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600 block">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 block">
            Email {mode === "create" && <span className="text-rose-600">*</span>}
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mode === "edit"}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
      </div>

      {mode === "create" && (
        <div>
          <label className="text-xs text-slate-600 block">
            Password <span className="text-rose-600">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600 block">Tenure start</label>
          <input
            type="date"
            value={tenureStart}
            onChange={(e) => setTenureStart(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 block">Tenure end</label>
          <input
            type="date"
            value={tenureEnd}
            onChange={(e) => setTenureEnd(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
          Cancel
        </button>
        <button
          disabled={busy || !valid}
          type="submit"
          className={
            "rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm " +
            (busy || !valid ? "bg-red-400/60 cursor-not-allowed" : "bg-red-600 hover:bg-red-700")
          }
        >
          {busy ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
