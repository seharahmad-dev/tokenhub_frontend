export type Hod = {
  _id: string;
  firstName: string;
  lastName: string;
  branch: "CSE" | "ISE" | "ECE" | string;
  email: string;
  phone?: string;
  tenureStart?: string;
  tenureEnd?: string;
};

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

import { useEffect, useState } from "react";

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
      firstName, lastName, branch,
      ...(mode === "create" ? { email, password } : {}),
      phone: phone || undefined,
      tenureStart: tenureStart || undefined,
      tenureEnd: tenureEnd || undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600">First name</label>
          <input value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="text-xs text-slate-600">Last name</label>
          <input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs text-slate-600">Branch</label>
          <select value={branch} onChange={e=>setBranch(e.target.value as any)} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">Select</option>
            <option value="CSE">CSE</option>
            <option value="ISE">ISE</option>
            <option value="ECE">ECE</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Phone</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-600">Email {mode==="create" && <span className="text-rose-600">*</span>}</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} disabled={mode==="edit"} className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"/>
        </div>
      </div>

      {mode === "create" && (
        <div>
          <label className="text-xs text-slate-600">Password <span className="text-rose-600">*</span></label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600">Tenure start</label>
          <input type="date" value={tenureStart} onChange={e=>setTenureStart(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        </div>
        <div>
          <label className="text-xs text-slate-600">Tenure end</label>
          <input type="date" value={tenureEnd} onChange={e=>setTenureEnd(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
        <button disabled={busy} type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{mode==="create"?"Create":"Save"}</button>
      </div>
    </form>
  );
}