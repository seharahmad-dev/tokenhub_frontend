// src/components/faculty/FacultyEventsList.tsx
import EventCard from "../../components/student/EventCard";
import EventsMini from "../../components/student/EventsMini";
import EmptyState from "../common/EmptyState";

type EventRow = {
  _id: string;
  title: string;
  description?: string;
  schedule?: string;
  venue?: string;
  capacity?: number;
};

export default function FacultyEventsList({
  events,
  loading,
  compact = false,
  onViewAll,
}: {
  events: EventRow[];
  loading?: boolean;
  compact?: boolean;
  onViewAll?: () => void;
}) {
  if (loading) {
    return <div className="p-4 text-center">Loading…</div>;
  }

  if (!events || events.length === 0) {
    if (compact) {
      return <EmptyState title="No events" subtitle="No events organised yet." />;
    }
    return (
      <div className="p-4 text-sm text-slate-600">No events organised yet.</div>
    );
  }

  if (compact) {
    const rows = events.map(e => ({ _id: e._id, title: e.title, schedule: e.schedule, venue: e.venue }));
    return <EventsMini rows={rows} loading={loading} onViewAll={onViewAll} />;
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <EventCard key={ev._id} e={ev as any} participated={false} />
      ))}
    </div>
  );
}
