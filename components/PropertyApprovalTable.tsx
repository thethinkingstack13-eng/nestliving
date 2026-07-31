'use client';

import { useState } from 'react';
import { Check, X, MapPin } from 'lucide-react';
import { StatusBadge, type BookingStatus } from '@/components/BookingRequestTable';

// Property approval only ever needs PENDING / APPROVED / REJECTED (no
// CANCELLED state, unlike bookings) — but that's a subset of BookingStatus,
// so we can reuse the same <StatusBadge /> without duplicating its styles.
export type PropertyApprovalStatus = Extract<BookingStatus, 'PENDING' | 'APPROVED' | 'REJECTED'>;

export interface PropertyApprovalRow {
  id: string;
  propertyTitle: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  roomCount: number;
  submittedDate: string; // ISO date string
  status: PropertyApprovalStatus;
}

export interface PropertyApprovalTableProps {
  properties: PropertyApprovalRow[];
  onStatusChange?: (id: string, status: PropertyApprovalStatus) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PropertyApprovalTable({
  properties,
  onStatusChange,
}: PropertyApprovalTableProps) {
  // Local copy so Approve/Reject reflect instantly — same pattern as
  // BookingRequestTable. Wire onStatusChange to a real PATCH call
  // (e.g. /api/properties/[id]/approve) once the API layer exists.
  const [rows, setRows] = useState(properties);

  const updateStatus = (id: string, status: PropertyApprovalStatus) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    onStatusChange?.(id, status);
  };

  if (rows.length === 0) {
    return (
      <div className="border border-black bg-white p-10 text-center">
        <p className="font-display text-lg font-bold">No properties awaiting review</p>
        <p className="mt-1 text-sm text-neutral-600">
          New owner submissions will show up here for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-black bg-white">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black bg-neutral-50">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide">Property</th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Owner
              </th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Rooms
              </th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Submitted
              </th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Status
              </th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-black last:border-b-0">
                <td className="px-5 py-4">
                  <p className="font-semibold leading-tight">{row.propertyTitle}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                    <MapPin size={12} strokeWidth={2} />
                    <span>{row.location}</span>
                  </div>
                </td>

                <td className="border-l border-black px-5 py-4">
                  <p className="text-sm font-medium leading-tight">{row.ownerName}</p>
                  <p className="text-xs text-neutral-500">{row.ownerEmail}</p>
                </td>

                <td className="border-l border-black px-5 py-4 text-sm">{row.roomCount}</td>

                <td className="border-l border-black px-5 py-4 text-sm">
                  {formatDate(row.submittedDate)}
                </td>

                <td className="border-l border-black px-5 py-4">
                  <StatusBadge status={row.status} />
                </td>

                <td className="border-l border-black px-5 py-4">
                  {row.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(row.id, 'APPROVED')}
                        className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800"
                      >
                        <Check size={13} strokeWidth={3} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(row.id, 'REJECTED')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-black bg-white px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-neutral-100"
                      >
                        <X size={13} strokeWidth={3} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400">No action needed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="divide-y divide-black md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold leading-tight">{row.propertyTitle}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin size={12} strokeWidth={2} />
                  <span>{row.location}</span>
                </div>
              </div>
              <StatusBadge status={row.status} />
            </div>

            <p className="mt-3 text-xs text-neutral-600">
              Owner: {row.ownerName} ({row.ownerEmail})
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {row.roomCount} rooms &middot; submitted {formatDate(row.submittedDate)}
            </p>

            {row.status === 'PENDING' && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(row.id, 'APPROVED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
                >
                  <Check size={13} strokeWidth={3} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(row.id, 'REJECTED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black bg-white px-4 py-2 text-xs font-bold text-black"
                >
                  <X size={13} strokeWidth={3} />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
