import IconButton from "../../common/IconButton";

export type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  usn: string;
  branch: string;
  semester: number;
  email: string;
  personalEmail?: string;
};

export default function StudentRow({
  s,
  onEdit,
  onDelete,
}: {
  s: Student;
  onEdit: (s: Student) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b last:border-none hover:bg-red-50/20 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{s.firstName} {s.lastName}</div>
      </td>
      <td className="px-4 py-3">{s.usn}</td>
      <td className="px-4 py-3">{s.branch ?? "-"}</td>
      <td className="px-4 py-3">{s.semester ?? "-"}</td>
      <td className="px-4 py-3">{s.email}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <IconButton title="Edit" onClick={() => onEdit(s)}>✎ Edit</IconButton>
          <IconButton title="Delete" onClick={() => onDelete(s._id)} tone="danger">🗑 Delete</IconButton>
        </div>
      </td>
    </tr>
  );
}
