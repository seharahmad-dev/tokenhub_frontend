export type Hod = {
  _id: string;
  firstName: string;
  lastName: string;
  branch: string;
  email: string;
  phone?: string;
  tenureStart?: string;
  tenureEnd?: string;
};

type Props = {
  h: Hod;
  onEdit: (row: Hod) => void;
  onDelete: (id: string) => void;
};

export default function HodRow({ h, onEdit, onDelete }: Props) {
  const name = `${h.firstName} ${h.lastName}`.trim();
  const tenure = [h.tenureStart, h.tenureEnd].filter(Boolean).join(" → ");
  return (
    <tr className="border-t">
      <td className="px-3 py-2">{name}</td>
      <td className="px-3 py-2">{h.branch}</td>
      <td className="px-3 py-2">{h.phone ?? "-"}</td>
      <td className="px-3 py-2">{tenure || "-"}</td>
      <td className="px-3 py-2">{h.email}</td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex gap-2">
          <button onClick={()=>onEdit(h)} className="rounded-lg border px-3 py-1 text-xs">Edit</button>
          <button onClick={()=>onDelete(h._id)} className="rounded-lg bg-rose-600 px-3 py-1 text-xs text-white">Delete</button>
        </div>
      </td>
    </tr>
  );
}