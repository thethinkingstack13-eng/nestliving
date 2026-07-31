'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BookingRequestRow {
  id: string;
  tenantName: string;
  tenantEmail: string;
  roomTitle: string;
  moveInDate: string; // ISO date string
  compatibilityScore: number;
  status: BookingStatus;
  message?: string;
}

export interface BookingRequestTableProps {
  requests: BookingRequestRow[];
  /** Called whenever a row's status changes via Approve/Reject. */
  onStatusChange?: (id: string, status: BookingStatus) => void;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: 'border-amber-500 bg-amber-100 text-amber-800',
  APPROVED: 'border-emerald-500 bg-emerald-100 text-emerald-800',
  REJECTED: 'border-red-500 bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BookingRequestTable({ requests, onStatusChange }: BookingRequestTableProps) {
  // Local copy so Approve/Reject reflect instantly in the UI even before
  // a parent-owned API call resolves. Parent can still drive updates by
  // re-rendering with new `requests` (e.g. after a refetch).
  const [rows, setRows] = useState(requests);

  const updateStatus = (id: string, status: BookingStatus) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    onStatusChange?.(id, status);
  };

  if (rows.length === 0) {
    return (
      <div className="border border-black bg-white p-10 text-center">
        <p className="font-display text-lg font-bold">No booking requests yet</p>
        <p className="mt-1 text-sm text-neutral-600">
          Requests from interested tenants will show up here.
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
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide">Tenant</th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Property / Room
              </th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Move-in Date
              </th>
              <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                Match %
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
                {/* Tenant */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black bg-neutral-200 text-xs font-bold">
                      {initials(row.tenantName)}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{row.tenantName}</p>
                      <p className="text-xs text-neutral-500">{row.tenantEmail}</p>
                    </div>
                  </div>
                </td>

                {/* Room */}
                <td className="border-l border-black px-5 py-4 text-sm">{row.roomTitle}</td>

                {/* Move-in date */}
                <td className="border-l border-black px-5 py-4 text-sm">
                  {formatDate(row.moveInDate)}
                </td>

                {/* Match % */}
                <td className="border-l border-black px-5 py-4">
                  <span className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-[0_0_8px_1px_rgba(16,185,129,0.45)]">
                    {row.compatibilityScore}% Match
                  </span>
                </td>

                {/* Status */}
                <td className="border-l border-black px-5 py-4">
                  <StatusBadge status={row.status} />
                </td>

                {/* Actions */}
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
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black bg-neutral-200 text-xs font-bold">
                  {initials(row.tenantName)}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{row.tenantName}</p>
                  <p className="text-xs text-neutral-500">{row.tenantEmail}</p>
                </div>
              </div>
              <StatusBadge status={row.status} />
            </div>

            <p className="mt-3 text-sm">{row.roomTitle}</p>
            <p className="mt-1 text-xs text-neutral-500">Move-in: {formatDate(row.moveInDate)}</p>

            <span className="mt-2 inline-flex items-center rounded-full border border-emerald-500 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {row.compatibilityScore}% Match
            </span>

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
