import IconButton from "../../common/IconButton";

export type Faculty = {
  _id: string;
  firstName: string;
  lastName: string;
  branch: string;
  collegeEmail: string;
  designation?: string;
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
    <tr className="border-b last:border-none hover:bg-red-50/20 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{f.firstName} {f.lastName}</div>
      </td>
      <td className="px-4 py-3">{f.branch}</td>
      <td className="px-4 py-3">{f.designation ?? "-"}</td>
      <td className="px-4 py-3">{f.collegeEmail}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <IconButton title="Edit" onClick={() => onEdit(f)}>✎ Edit</IconButton>
          <IconButton title="Delete" onClick={() => onDelete(f._id)} tone="danger">🗑 Delete</IconButton>
        </div>
      </td>
    </tr>
  );
}
