export type Faculty = {
  _id: string;
  firstName: string;
  lastName: string;
  branch: string;       // backend returns string
  collegeEmail: string;
  designation?: string; // optional in backend
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  f: Faculty;
  onEdit: (row: Faculty) => void;
  onDelete: (id: string) => void;
};

export default function FacultyRow({ f, onEdit, onDelete }: Props) {
  return (
    <tr className="border-t">
      <td className="px-3 py-2">
        <div className="font-medium">{f.firstName} {f.lastName}</div>
      </td>
      <td className="px-3 py-2">{f.branch}</td>
      <td className="px-3 py-2">{f.designation ?? "-"}</td>
      <td className="px-3 py-2">{f.collegeEmail}</td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(f)}
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(f._id)}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}