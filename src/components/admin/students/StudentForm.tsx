import { useEffect, useState } from "react";
import TextInput from "../../common/TextInput";
import Select from "../../common/Select";

export type StudentPayload = {
  firstName: string;
  lastName: string;
  usn: string;
  branch: "CSE" | "ISE" | "ECE" | "";
  semester: number | "";
  email: string;
  personalEmail?: string;
  password?: string; // only for create
};

export default function StudentForm({
  initial,
  mode,
  onSubmit,
  onCancel,
  busy
}: {
  initial?: Partial<StudentPayload>;
  mode: "create" | "edit";
  onSubmit: (p: StudentPayload) => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const [f, setF] = useState<StudentPayload>({
    firstName: "",
    lastName: "",
    usn: "",
    branch: "",
    semester: "",
    email: "",
    personalEmail: "",
    password: ""
  });

  useEffect(() => {
    if (initial) setF(prev => ({ ...prev, ...initial }));
  }, [initial]);

  const set = (k: keyof StudentPayload, v: any) =>
    setF(s => ({ ...s, [k]: v }));

  const valid =
    f.firstName && f.lastName && f.usn && f.branch && f.semester && f.email &&
    (mode === "edit" || (mode === "create" && f.password));

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (valid) onSubmit({
          ...f,
          semester: Number(f.semester)
        });
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <TextInput label="First name" value={f.firstName} onChange={e => set("firstName", e.target.value)} />
      <TextInput label="Last name" value={f.lastName} onChange={e => set("lastName", e.target.value)} />
      <TextInput label="USN" value={f.usn} onChange={e => set("usn", e.target.value)} />
      <Select
        label="Branch"
        value={f.branch}
        onChange={v => set("branch", v)}
        options={[{label:"CSE",value:"CSE"},{label:"ISE",value:"ISE"},{label:"ECE",value:"ECE"}]}
        placeholder="Choose branch"
      />
      <TextInput label="Semester" type="number" min={1} max={8}
                 value={f.semester} onChange={e => set("semester", e.target.value)} />
      <TextInput label="Institute Email" type="email" value={f.email} onChange={e => set("email", e.target.value)} />
      <TextInput label="Personal Email (optional)" type="email"
                 value={f.personalEmail ?? ""} onChange={e => set("personalEmail", e.target.value)} />
      {mode === "create" ? (
        <TextInput label="Password" type="password" value={f.password ?? ""} onChange={e => set("password", e.target.value)} />
      ) : null}

      <div className="col-span-full mt-2 flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
        <button
          type="submit"
          disabled={!valid || busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {mode === "create" ? "Create" : "Save changes"}
        </button>
      </div>
    </form>
  );
}