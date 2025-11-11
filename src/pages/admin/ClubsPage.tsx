// pages/admin/ClubsPage.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import AdminNavbar from "../../components/AdminNavbar";
import ClubsToolbar from "../../components/admin/clubs/ClubsToolbar";
import ClubForm, {
  ClubCreatePayload,
} from "../../components/admin/clubs/ClubForm";
import ClubRow, { Club } from "../../components/admin/clubs/ClubRow";

/** choose API base by role */
const getApiBase = (role: "Admin" | "Student" | "Faculty" | "HOD" | "Club") => {
  switch (role) {
    case "Admin":
      return import.meta.env.VITE_ADMIN_API;
    case "Student":
      return import.meta.env.VITE_STUDENT_API;
    case "Faculty":
      return import.meta.env.VITE_FACULTY_API;
    case "HOD":
      return import.meta.env.VITE_HOD_API;
    case "Club":
      return import.meta.env.VITE_CLUB_API;
  }
};

/** in-file axios client with token + refresh */
const apiClient = axios.create({ withCredentials: true });
const getAccessToken = () => sessionStorage.getItem("accessToken");
const setAccessToken = (t: string | null) =>
  t
    ? sessionStorage.setItem("accessToken", t)
    : sessionStorage.removeItem("accessToken");

apiClient.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${getApiBase("Admin")}/admin/refresh`,
      {},
      { withCredentials: true }
    );
    const t = res.data?.token ?? null;
    setAccessToken(t);
    return t;
  } catch {
    setAccessToken(null);
    return null;
  }
}
apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    const req: any = err?.config;
    if (!req || err?.response?.status !== 401 || req._retry) throw err;
    req._retry = true;
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    const nt = await refreshPromise!;
    if (!nt) throw err;
    req.headers = req.headers ?? {};
    req.headers.Authorization = `Bearer ${nt}`;
    return apiClient(req);
  }
);

export default function ClubsPage() {
  const [items, setItems] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  // near the top of function ClubsPage()
  const [reloadKey, setReloadKey] = useState(0);

  // replace the existing effect:
  useEffect(() => {
    fetchAll();
  }, []);
  // with this:
  useEffect(() => {
    fetchAll();
  }, [reloadKey]);

  /**
   * fetchAll:
   * - fetch clubs
   * - fetch students (to resolve names when the club member contains only studentId)
   * - compute a studentMap (id -> displayName)
   * - inject member.displayName into each club member (prefer snapshot name/email, then populated object, then lookup)
   */
  async function fetchAll() {
    setLoading(true);
    try {
      const clubsPromise = apiClient.get(`${getApiBase("Club")}/club/all`);
      const studentsPromise = apiClient.get(
        `${getApiBase("Student")}/student/all`
      );

      // run in parallel
      const [clubsRes, studentsRes] = await Promise.allSettled([
        clubsPromise,
        studentsPromise,
      ]);

      const clubsData =
        clubsRes.status === "fulfilled"
          ? clubsRes.value?.data?.data ?? clubsRes.value?.data ?? []
          : [];
      const studentsData =
        studentsRes.status === "fulfilled"
          ? studentsRes.value?.data?.data ?? studentsRes.value?.data ?? []
          : [];

      // build student map: id -> "First Last" (or email/usn fallback)
      const studentMap: Record<string, string> = {};
      if (Array.isArray(studentsData)) {
        for (const s of studentsData) {
          const id = s._id ?? s.id;
          if (!id) continue;
          const name =
            `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ||
            s.fullName ||
            s.name ||
            s.email ||
            s.usn ||
            "";
          studentMap[id] = name;
        }
      }

      // normalize clubs and inject displayName for members
      const mappedClubs = (Array.isArray(clubsData) ? clubsData : []).map(
        (c: any) => {
          const members = Array.isArray(c.members)
            ? c.members.map((m: any) => {
                // prefer snapshot name/email fields that you said you would store on the club member
                let displayName =
                  m.name && String(m.name).trim()
                    ? m.name
                    : m.studentName && String(m.studentName).trim()
                    ? m.studentName
                    : m.email && String(m.email).trim()
                    ? m.email
                    : "";

                // if studentId is populated as an object (mongoose populate), try to extract name
                if (
                  !displayName &&
                  m.studentId &&
                  typeof m.studentId === "object"
                ) {
                  const sidObj = m.studentId;
                  displayName =
                    `${sidObj.firstName ?? ""} ${
                      sidObj.lastName ?? ""
                    }`.trim() ||
                    sidObj.fullName ||
                    sidObj.email ||
                    sidObj.usn ||
                    "";
                }

                // if studentId is a string, lookup from studentMap
                if (
                  !displayName &&
                  m.studentId &&
                  typeof m.studentId === "string"
                ) {
                  displayName = studentMap[m.studentId] ?? "";
                }

                // as last resort fall back to the raw id string (so UI never shows [object Object] or empty)
                if (!displayName) {
                  displayName = String(m.studentId ?? m._id ?? "Unknown");
                }

                return {
                  ...m,
                  displayName,
                };
              })
            : [];

          return {
            ...c,
            members,
          };
        }
      );

      setItems(mappedClubs);
    } catch (e) {
      console.error("Clubs fetch failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => (s ?? "").toLowerCase();
    return items.filter((c) => {
      const head = c.members?.find((m: any) => {
        const role = (m.role ?? "").toString();
        return (
          role === "Club Head" ||
          role === "clubHead" ||
          role.toLowerCase() === "club head"
        );
      });
      console.log(head);

      const headName = head?.name || head?.studentName || "";
      return [c.clubName, headName].some((v) =>
        norm(String(v)).includes(norm(q))
      );
    });
  }, [items, q]);

  // Create club (Admin only)
  // Replace your existing handleCreate with this
  const handleCreate = async (p: ClubCreatePayload) => {
    try {
      // ensure we have an access token — try sessionStorage first
      let token = getAccessToken();

      // if token missing, attempt refresh using your existing doRefresh()
      if (!token) {
        token = await doRefresh();
        if (!token) {
          // not authenticated — show message and stop
          alert("Unable to authenticate. Please login again.");
          return;
        }
      }

      // attach explicit Authorization header as a safety-net (apiClient already does this via interceptor)
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      await apiClient.post(`${getApiBase("Club")}/club/register`, p, {
        headers,
      });
      setCreateOpen(false);
      fetchAll();
    } catch (e) {
      console.error("Create club failed", e);
      // handle 401 specifically (in case interceptor/refresh didn't work)
      if ((e as any)?.response?.status === 401) {
        alert("Authentication error. Please login again.");
      } else {
        alert("Failed to create club");
      }
    }
  };

  // Delete club (Admin only)
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this club?")) return;
    try {
      await apiClient.delete(`${getApiBase("Club")}/club/${id}`);
      fetchAll();
    } catch (e) {
      console.error("Delete club failed", e);
      alert("Failed to delete club");
    }
  };

  // Replace club head (Admin only)
  // Replace existing handleReplaceHead with the following
  // replace your existing handleReplaceHead with this
  const handleReplaceHead = async (id: string, newHeadId: string) => {
    try {
      // find club in local cache to check current head
      const club = items.find((c) => c._id === id);
      if (!club) {
        alert("Club not found locally. Try refreshing the page.");
        return;
      }

      const currentHead = (club.members ?? []).find((m: any) => {
        const role = (m.role ?? "").toString();
        return (
          role === "Club Head" ||
          role === "clubHead" ||
          role.toLowerCase() === "club head"
        );
      });
      const currentHeadId = currentHead ? currentHead.studentId : null;

      if (!newHeadId) {
        alert("Please provide a valid new head id.");
        return;
      }

      if (currentHeadId && String(currentHeadId) === String(newHeadId)) {
        alert(
          "The selected student is already the Club Head — pick a different student."
        );
        return;
      }

      // ensure we have an access token — try sessionStorage first
      let token = getAccessToken();
      if (!token) {
        token = await doRefresh();
        if (!token) {
          alert("Unable to authenticate. Please login again.");
          return;
        }
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // perform replace-head operation
      await apiClient.post(
        `${getApiBase("Club")}/club/${id}/replace-head`,
        { newHeadId },
        { headers }
      );

      // force a fresh refetch of all clubs (safer than partial update when UI logic is complex)
      setReloadKey((k) => k + 1);
    } catch (e) {
      console.error("Replace head failed", e);
      if ((e as any)?.response?.status === 401) {
        alert("Authentication error. Please login again.");
      } else if ((e as any)?.response?.data?.message) {
        alert((e as any).response.data.message);
      } else {
        alert("Failed to replace club head");
      }
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <AdminNavbar />
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Clubs</h1>
          <p className="text-slate-600">
            Create clubs, replace club head, or delete clubs.
          </p>
        </header>

        <ClubsToolbar
          q={q}
          onQChange={setQ}
          onAdd={() => setCreateOpen(true)}
        />

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Club</th>
                  <th className="px-3 py-2 font-medium">Head</th>
                  <th className="px-3 py-2 font-medium">Members</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-8" colSpan={4}>
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6" colSpan={4}>
                      <EmptyState
                        title="No clubs"
                        subtitle="Try searching or create a new club."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <ClubRow
                      key={c._id}
                      c={c}
                      onReplaceHead={handleReplaceHead}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create */}
      <Modal
        open={createOpen}
        title="Create Club"
        onClose={() => setCreateOpen(false)}
      >
        <ClubForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
