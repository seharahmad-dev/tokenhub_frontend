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
  onDelete
}: {
  s: Student;
  onEdit: (s: Student) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b">
      <td className="px-3 py-2">{s.firstName} {s.lastName}</td>
      <td className="px-3 py-2">{s.usn}</td>
      <td className="px-3 py-2">{s.branch}</td>
      <td className="px-3 py-2">{s.semester}</td>
      <td className="px-3 py-2">{s.email}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-2">
          <IconButton title="Edit" onClick={() => onEdit(s)}>✎ Edit</IconButton>
          <IconButton title="Delete" onClick={() => onDelete(s._id)} tone="danger">🗑 Delete</IconButton>
        </div>
      </td>
    </tr>
  );
}