import React, { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const CLUB_API = import.meta.env.VITE_CLUB_API || "";

export type ID = string;

export type ClubMember = {
  _id?: ID;
  studentId: ID;
  name: string;
  email: string;
  role: string;
  joiningDate?: string;
};

export type SocialLinks = {
  instagram?: string;
  linkedin?: string;
  discord?: string;
  github?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
};

export type EventRef = {
  eventId?: ID;
};

export type RefreshTokenRef = {
  tokenHash: string;
  device?: string;
  createdAt?: string;
};

export type ClubDoc = {
  _id: ID;
  clubName: string;
  description?: string;
  category?: string;
  facultyAdvisors?: ID[];
  members: ClubMember[];
  events?: EventRef[];
  rewardTokens?: number;
  receivedTokens?: number;
  socialLinks?: SocialLinks;
  status?: string;
  logoUrl?: string;
  isHiring?: boolean;
  createdAt?: string;
  updatedAt?: string;
  refreshTokens?: RefreshTokenRef[];
};

export default function ClubCard({
  club,
  president = "—",
  hiring = false,
  onApply,
}: {
  club: ClubDoc;
  president?: string;
  hiring?: boolean;
  onApply?: (id: string) => void;
}) {
  const student = useAppSelector(selectStudent);
  const [busy, setBusy] = useState(false);

  const alreadyInClubs = Boolean(
    Array.isArray(student?.clubs) && student.clubs.some((c: string) => String(c) === String(club._id))
  );

  const isPrimaryClub = Boolean(student?.clubId && String(student.clubId) === String(club._id));

  const handleApplyClick = async () => {
    if (!student || !student._id) {
      alert("You must be logged in to apply.");
      return;
    }
    if (alreadyInClubs || isPrimaryClub) {
      alert("You are already a member of this club.");
      return;
    }
    const ok = confirm(`Apply to join ${club.clubName}?`);
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`${CLUB_API}/club/${club._id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
        },
        credentials: "include",
        body: JSON.stringify({ studentId: student._id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message || body?.data || `Apply failed (${res.status})`;
        alert(msg);
        return;
      }
      alert("Application submitted — the club will review your request.");
      onApply?.(club._id);
    } catch (err) {
      console.error("Apply error:", err);
      alert("Failed to apply. See console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 flex flex-col shadow-sm">
      <div className="flex items-center gap-4">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt={club.clubName} className="h-12 w-12 rounded-xl object-cover border" />
        ) : (
          <div className="h-12 w-12 rounded-xl border bg-blue-50 flex items-center justify-center text-sm font-semibold text-blue-700">
            {club.clubName?.slice(0, 2)?.toUpperCase() || "CL"}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{club.clubName}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-slate-700 bg-white">
              {club.status ?? "active"}
            </span>
            {hiring && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5">
                Hiring
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 line-clamp-4">{club.description || "No description provided."}</p>

      <div className="mt-3 text-sm text-slate-600">
        <span className="font-medium">President:</span> {president}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <a
          href={`/student/clubs/${club._id}`}
          className="inline-flex items-center justify-center rounded-xl border border-blue-100 px-3 py-2 text-sm text-blue-700 bg-white shadow-sm"
        >
          View details
        </a>

        {hiring ? (
          alreadyInClubs || isPrimaryClub ? (
            <button
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-sm"
              title="You are already a member"
            >
              Already a member
            </button>
          ) : (
            <button
              onClick={handleApplyClick}
              disabled={busy}
              className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm ${
                busy ? "bg-blue-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {busy ? "Applying…" : "Apply"}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
