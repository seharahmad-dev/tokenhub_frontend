import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";
import EmptyState from "../../components/common/EmptyState";
import OrganizeEventModal from "../../components/student/OrganizeEventModal";

type StudentMinimal = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  usn?: string;
  clubId?: string | null;
};

export default function ManageClubPage() {
  const me = useAppSelector(selectStudent) as StudentMinimal | null;
  const [club, setClub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [openOrgModal, setOpenOrgModal] = useState(false);
  const [clubEvents, setClubEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [, setErr] = useState<string | null>(null);

  const CLUB_API = (import.meta.env.VITE_CLUB_API as string) || "";
  const STUDENT_API = (import.meta.env.VITE_STUDENT_API as string) || "";
  const EVENT_API = (import.meta.env.VITE_EVENT_API as string) || "";

  // auth config builder (use memo so it doesn't recreate frequently)
  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}` },
      withCredentials: true,
    }),
    []
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!me?.clubId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        // fetch club snapshot
        const res = await axios.get(`${CLUB_API}/club/${me.clubId}`, authConfig);
        const data = res?.data?.data ?? res?.data ?? null;
        if (mounted) {
          setClub(data);
          setHiring(Boolean(data?.isHiring ?? false));
        }

        // fetch applicants (ids)
        const appsResp = await axios.get(`${CLUB_API}/club/${me.clubId}/applicants`, authConfig);
        const applicantIds: string[] = appsResp?.data?.data ?? appsResp?.data ?? [];

        if (!Array.isArray(applicantIds) || applicantIds.length === 0) {
          if (mounted) setApplicants([]);
        } else {
          if (STUDENT_API) {
            const studentFetches = applicantIds.map((id) =>
              axios
                .get(`${STUDENT_API}/student/${id}`, authConfig)
                .then((r) => {
                  const s = r?.data?.data ?? r?.data ?? null;
                  return Array.isArray(s) ? s[0] : s;
                })
                .catch(() => ({ _id: id }))
            );
            const studentSnapshots = await Promise.all(studentFetches);
            if (mounted) setApplicants(studentSnapshots.filter(Boolean));
          } else {
            if (mounted) setApplicants(applicantIds.map((id) => ({ _id: id })));
          }
        }

        // load events organized by this club
        await refreshClubEvents(mounted);
      } catch (e: any) {
        console.error("Error loading club:", e);
        if (mounted) setErr(e?.response?.data?.message ?? "Failed to load club");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [me?.clubId, CLUB_API, STUDENT_API, authConfig]);

  // helper to fetch events for this club
  async function refreshClubEvents(mounted = true) {
    if (!EVENT_API || !me?.clubId) return;
    setEventsLoading(true);
    try {
      const r = await axios.get(`${EVENT_API}/event/all`, authConfig);
      const raw = r?.data?.data ?? r?.data ?? [];
      const arr = Array.isArray(raw) ? raw : [];
      const filtered = arr.filter((ev: any) => {
        // support multiple shapes
        const oc =
          ev?.organisingClub ??
          ev?.organizingClub ??
          ev?.organisingClubId ??
          ev?.organisingClub?._id ??
          ev?.organisingClub?._id ??
          ev?.organizingClubId;
        return String(oc) === String(me.clubId);
      });
      if (mounted) setClubEvents(filtered);
    } catch (e) {
      console.error("Failed to fetch events:", e);
      if (mounted) setClubEvents([]);
    } finally {
      if (mounted) setEventsLoading(false);
    }
  }

  const toggleHiring = async () => {
    try {
      const res = await axios.patch(`${CLUB_API}/club/${me?.clubId}/toggleHiring`, {}, authConfig);
      setHiring(res?.data?.data?.isHiring ?? !hiring);
      // refresh club
      try {
        const r = await axios.get(`${CLUB_API}/club/${me?.clubId}`, authConfig);
        setClub(r?.data?.data ?? r?.data ?? club);
      } catch (_) {}
    } catch (err) {
      console.error("Failed to toggle hiring:", err);
      alert("Failed to toggle hiring. See console for details.");
    }
  };

  const approveApplicant = async (appId: string) => {
    try {
      await axios.patch(`${CLUB_API}/club/${me?.clubId}/applicants/${appId}/accept`, {}, authConfig);
      setApplicants((prev) => prev.filter((a) => String(a._id) !== String(appId)));
      // refresh club snapshot (members)
      try {
        const r = await axios.get(`${CLUB_API}/club/${me?.clubId}`, authConfig);
        setClub(r?.data?.data ?? r?.data ?? club);
      } catch (err) {
        console.warn("Failed to refresh club after accept:", err);
      }
    } catch (err) {
      console.error("Failed to approve applicant:", err);
      alert("Failed to approve applicant. See console for details.");
    }
  };

  // delete event (club head allowed)
  const deleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event? This action cannot be undone.")) return;
    try {
      await axios.delete(`${EVENT_API}/event/${eventId}`, authConfig);
      await refreshClubEvents();
    } catch (e) {
      console.error("Failed to delete event:", e);
      alert("Failed to delete event. See console for details.");
    }
  };

  // whether current user is the club head — follow your redux rule:
  // if redux student.clubId matches this club._id and the member is the same student, treat them as head
  const isHead = useMemo(() => {
    if (!me || !club) return false;
    return String(me.clubId) === String(club._id);
  }, [me, club]);

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-center">Loading club info…</div>
          ) : !club ? (
            <div className="rounded-xl border bg-white p-6 text-center text-slate-600">Club not found.</div>
          ) : (
            <>
              <SectionCard title={`${club.clubName}`}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-slate-600 text-sm">{club.description || "No description added yet."}</p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleHiring}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                        hiring ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                      }`}
                    >
                      {hiring ? "Hiring Mode: ON" : "Hiring Mode: OFF"}
                    </button>

                    {isHead && (
                      <button
                        onClick={() => setOpenOrgModal(true)}
                        className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        Organize Event
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Members</h3>
                  <ul className="divide-y">
                    {Array.isArray(club.members) && club.members.length ? (
                      club.members.map((m: any) => {
                        // compute role label: if current redux student.clubId === club._id and this member.studentId === me._id => Club Head
                        const memberIsHead =
                          me?.clubId && club._id && String(me.clubId) === String(club._id) && String(m.studentId) === String(me?._id);
                        const roleLabel = memberIsHead ? "Club Head" : m.role ?? "member";
                        return (
                          <li key={m._id ?? String(m.studentId)} className="py-2 flex items-center justify-between text-sm text-slate-700">
                            <div>
                              <div className="font-medium text-slate-900">{m.name}</div>
                              {m.email && <div className="text-xs text-slate-500">{m.email}</div>}
                            </div>
                            <span className="text-xs rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">{roleLabel}</span>
                          </li>
                        );
                      })
                    ) : (
                      <div className="py-2 text-sm text-slate-500">No members yet.</div>
                    )}
                  </ul>
                </div>
              </SectionCard>

              <SectionCard title="Applicants">
                {applicants.length === 0 ? (
                  <p className="text-slate-500 text-sm">No current applicants.</p>
                ) : (
                  <ul className="divide-y">
                    {applicants.map((a: any) => (
                      <li key={a._id} className="py-2 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-slate-800">
                            {a.firstName || a.name || a._id} {a.usn ? `(${a.usn})` : ""}
                          </p>
                          {a.email && <p className="text-slate-500 text-xs">{a.email}</p>}
                        </div>
                        <button onClick={() => approveApplicant(a._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs">
                          Approve
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Events organized by this club"
                action={<a className="text-sm text-blue-600 hover:underline" href="/student/events">View all</a>}
              >
                {eventsLoading ? (
                  <div className="p-4 text-center">Loading events…</div>
                ) : clubEvents.length === 0 ? (
                  <EmptyState title="No events yet" subtitle="This club hasn't organized any events yet." />
                ) : (
                  <ul className="space-y-3">
                    {clubEvents.map((ev) => (
                      <li key={ev._id} className="rounded-lg border bg-white p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium text-slate-900">{ev.title}</div>
                            <div className="text-xs text-slate-500">{ev.venue ?? "—"} • {ev.schedule ? new Date(ev.schedule).toLocaleString() : "—"}</div>
                            <p className="mt-2 text-sm text-slate-700 line-clamp-2">{ev.description}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-slate-500">Permission: {ev.permission ?? "—"}</div>
                            {isHead && (
                              <div className="flex gap-2">
                                <a href={`/student/event/${ev._id}`} className="text-sm text-blue-600 hover:underline">Manage</a>
                                <button onClick={() => deleteEvent(ev._id)} className="text-sm px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700">Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </main>

      {/* Organize Event Modal */}
      {openOrgModal && club && (
        <OrganizeEventModal
          clubId={String(club._id)}
          open={openOrgModal}
          onClose={() => setOpenOrgModal(false)}
          onCreated={async () => {
            setOpenOrgModal(false);
            await refreshClubEvents();
            // refresh club as coordinators or membership might update
            try {
              const r = await axios.get(`${CLUB_API}/club/${me?.clubId}`, authConfig);
              setClub(r?.data?.data ?? r?.data ?? club);
            } catch (err) {
              console.warn("failed to refresh club after event create", err);
            }
          }}
          token={sessionStorage.getItem("accessToken") || undefined}
        />
      )}
    </div>
  );
}
