// src/components/admin/students/StudentForm.tsx
import { useEffect, useState } from "react";
import TextInput from "../../common/TextInput";
import Select from "../../common/Select";

export type StudentPayload = {
  firstName: string;
  lastName: string;
  usn: string;
  branch: "CSE" | "ISE" | "ECE" | "";
  semester: string; // kept as string (you already use string)
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

  // helper to update fields
  const set = (k: keyof StudentPayload, v: any) =>
    setF(s => ({ ...s, [k]: v }));

  // stronger validation: trim values and coerce to boolean
  const valid =
    f.firstName?.trim() !== "" &&
    f.lastName?.trim() !== "" &&
    f.usn?.trim() !== "" &&
    f.branch !== "" &&
    f.semester?.trim() !== "" &&
    f.email?.trim() !== "" &&
    (mode === "edit" ? true : f.password?.trim() !== "");

  // handle submit: sanitize/trim and call parent
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    const payload: StudentPayload = {
      firstName: String(f.firstName ?? "").trim(),
      lastName: String(f.lastName ?? "").trim(),
      usn: String(f.usn ?? "").trim(),
      branch: (f.branch as "CSE" | "ISE" | "ECE" | ""),
      semester: String(f.semester ?? "").trim(),
      email: String(f.email ?? "").trim(),
      personalEmail: String(f.personalEmail ?? "").trim() || undefined,
      password: mode === "create" ? String(f.password ?? "").trim() : undefined
    };
    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      aria-disabled={busy ? "true" : "false"}
    >
      {/* Wrap inputs in a subtle white card with red border + rounded corners */}
      <div className="col-span-full rounded-lg border border-red-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="First name"
            value={f.firstName}
            onChange={e => set("firstName", e.target.value)}
            className="rounded-lg"
          />
          <TextInput
            label="Last name"
            value={f.lastName}
            onChange={e => set("lastName", e.target.value)}
            className="rounded-lg"
          />
          <TextInput
            label="USN"
            value={f.usn}
            onChange={e => set("usn", e.target.value)}
            className="rounded-lg"
          />
          <Select
            label="Branch"
            value={f.branch}
            onChange={v => set("branch", v)}
            options={[
              { label: "CSE", value: "CSE" },
              { label: "ISE", value: "ISE" },
              { label: "ECE", value: "ECE" }
            ]}
            placeholder="Choose branch"
          />
          <TextInput
            label="Semester"
            type="text"
            value={f.semester}
            onChange={e => set("semester", e.target.value)}
            className="rounded-lg"
          />
          <TextInput
            label="Institute Email"
            type="email"
            value={f.email}
            onChange={e => set("email", e.target.value)}
            className="rounded-lg"
          />
          <TextInput
            label="Personal Email (optional)"
            type="email"
            value={f.personalEmail ?? ""}
            onChange={e => set("personalEmail", e.target.value)}
            className="rounded-lg"
          />
          {mode === "create" ? (
            <TextInput
              label="Password"
              type="password"
              value={f.password ?? ""}
              onChange={e => set("password", e.target.value)}
              className="rounded-lg"
            />
          ) : null}
        </div>
      </div>

      <div className="col-span-full mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 bg-white hover:bg-red-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!valid || busy}
          aria-disabled={!valid || busy}
          className={
            "rounded-lg px-4 py-2 text-sm text-white shadow-sm transition " +
            ( (!valid || busy)
                ? "bg-red-400/60 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            )
          }
        >
          {mode === "create" ? (busy ? "Creating…" : "Create") : (busy ? "Saving…" : "Save changes")}
        </button>
      </div>
    </form>
  );
}
