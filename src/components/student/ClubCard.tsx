// components/student/ClubCard.tsx
import React, { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

const CLUB_API = import.meta.env.VITE_CLUB_API || "";

// types/club.ts

// primitive alias for Mongo ObjectId in the client
export type ID = string;

export type ClubMember = {
  _id?: ID;                 // member snapshot id (mongoose will add)
  studentId: ID;
  name: string;
  email: string;
  role: string;             // "member" | "Club Head" | etc.
  joiningDate?: string;     // ISO date string
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
  category?: "Technical" | "Cultural" | "Sports" | "Literary" | "Social" | "Other" | string;
  facultyAdvisors?: ID[];     // array of faculty ids
  members: ClubMember[];      // required in schema
  events?: EventRef[];        // array of event refs
  rewardTokens?: number;
  receivedTokens?: number;
  socialLinks?: SocialLinks;
  status?: "active" | "inactive" | "dissolved" | string;
  logoUrl?: string;
  isHiring?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // NOTE: refreshTokens is sensitive — include it only if your API intentionally returns it.
  // If you do return it, type it; otherwise omit it from API responses for security.
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

  // guard: is user already a member / already applied?
  // We check student's `clubs` array (as requested).
  const alreadyInClubs = Boolean(
    Array.isArray(student?.clubs) && student.clubs.some((c: string) => String(c) === String(club._id))
  );

  // Also optionally prevent apply if student has a primary clubId set to this club
  const isPrimaryClub = Boolean(student?.clubId && String(student.clubId) === String(club._id));

  const handleApplyClick = async () => {
    // local check first
    if (!student || !student._id) {
      alert("You must be logged in to apply.");
      return;
    }
    if (alreadyInClubs || isPrimaryClub) {
      alert("You are already a member of this club.");
      return;
    }

    // confirm quick UX
    const ok = confirm(`Apply to join ${club.clubName}?`);
    if (!ok) return;

    setBusy(true);
    try {
      // call backend apply endpoint
      // NOTE: adjust endpoint/path/body if your API differs.
      const auth = {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}` },
        withCredentials: true,
      };

      // prefer POST /club/:id/apply { studentId } — change if your backend expects different
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

      // success
      alert("Application submitted — the club will review your request.");
      // optional callback to parent (e.g. to refresh lists)
      onApply?.(club._id);
    } catch (err) {
      console.error("Apply error:", err);
      alert("Failed to apply. See console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col">
      <div className="flex items-center gap-3">
        {club.logoUrl ? (
          <img
            src={club.logoUrl}
            alt={club.clubName}
            className="h-10 w-10 rounded-lg object-cover border"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg border bg-slate-100 flex items-center justify-center text-sm">
            {club.clubName?.slice(0, 2)?.toUpperCase() || "CL"}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{club.clubName}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-md border px-1.5 py-0.5">
              {club.status ?? "active"}
            </span>
            {hiring && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5">
                Hiring
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 line-clamp-4">
        {club.description || "No description provided."}
      </p>

      <div className="mt-3 text-sm text-slate-600">
        <span className="font-medium">President:</span> {president}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={`/student/clubs/${club._id}`}
          className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm"
        >
          View details
        </a>

        {/* Apply button logic */}
        {hiring ? (
          alreadyInClubs || isPrimaryClub ? (
            <button
              disabled
              className="inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-800 px-3 py-2 text-sm"
              title="You are already a member"
            >
              Already a member
            </button>
          ) : (
            <button
              onClick={handleApplyClick}
              disabled={busy}
              className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm ${
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
