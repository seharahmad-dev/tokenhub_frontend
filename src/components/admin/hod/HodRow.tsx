import IconButton from "../../common/IconButton";

/** Export Hod type so other modules can import it. */
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

type Props = {
  h: Hod;
  onEdit: (row: Hod) => void;
  onDelete: (id: string) => void;
};

export default function HodRow({ h, onEdit, onDelete }: Props) {
  const name = `${h.firstName} ${h.lastName}`.trim();
  const tenure = [h.tenureStart, h.tenureEnd].filter(Boolean).join(" → ");
  return (
    <tr className="border-b last:border-none hover:bg-red-50/20 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{name || "—"}</div>
      </td>
      <td className="px-4 py-3">{h.branch ?? "-"}</td>
      <td className="px-4 py-3">{h.email ?? "-"}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <IconButton title="Delete" onClick={() => onDelete(h._id)} tone="danger">🗑 Delete</IconButton>
        </div>
      </td>
    </tr>
  );
}
