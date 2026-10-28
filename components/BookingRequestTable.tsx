'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ChevronDown } from 'lucide-react';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface BookingRequestRow {
  id: string;
  tenantName: string;
  tenantEmail: string;
  roomTitle: string;
  moveInDate: string; // ISO date string
  tenantPhone?: string;
  occupation?: string;
  budget?: string;
  preferredLocation?: string;
  bio?: string;
  requestedAt: string; // when the tenant sent the request (ISO)
  decidedAt?: string; // when the owner approved/rejected (ISO)
  compatibilityScore?: number;
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
  CANCELLED: 'border-neutral-400 bg-neutral-100 text-neutral-700',
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// One labelled value in the details panel. Renders nothing if the value is empty.
function Detail({ label, children }: { label: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{children}</div>
    </div>
  );
}

// Everything the owner needs BEFORE approving: who sent it, what, and when.
function RequestDetails({ row }: { row: BookingRequestRow }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Detail label="Name">{row.tenantName}</Detail>
      <Detail label="Phone">
        {row.tenantPhone && (
          <a href={`tel:${row.tenantPhone}`} className="underline">
            {row.tenantPhone}
          </a>
        )}
      </Detail>
      <Detail label="Email">{row.tenantEmail}</Detail>
      <Detail label="Occupation">{row.occupation}</Detail>
      <Detail label="Budget">{row.budget}</Detail>
      <Detail label="Preferred area">{row.preferredLocation}</Detail>
      <Detail label="Room">{row.roomTitle}</Detail>
      <Detail label="Move-in date">{formatDate(row.moveInDate)}</Detail>
      <Detail label="Request sent">{formatDateTime(row.requestedAt)}</Detail>
      <Detail label="Decision">
        {row.decidedAt ? `${row.status} on ${formatDateTime(row.decidedAt)}` : 'Waiting for your decision'}
      </Detail>
      <Detail label="Message from tenant">{row.message}</Detail>
      <Detail label="About the tenant">{row.bio}</Detail>
    </div>
  );
}

export default function BookingRequestTable({ requests, onStatusChange }: BookingRequestTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState(requests);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which request's details panel is open (only one at a time).
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: BookingStatus) => {
    if (status === 'CANCELLED' || updatingId) return;
    setUpdatingId(id);
    setError(null);
    try {
      if (onStatusChange) {
        await onStatusChange(id, status);
      } else {
        const response = await fetch(`/api/bookings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message ?? 'Could not update the request.');
      }
      // decidedAt is set locally too, so "Decision" shows the time immediately.
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status, decidedAt: new Date().toISOString() } : row
        )
      );
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update the request.');
    } finally {
      setUpdatingId(null);
    }
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
      {error && <p role="alert" className="border-b border-black bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
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
              <Fragment key={row.id}>
              <tr className="border-b border-black last:border-b-0">
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
                  {row.compatibilityScore != null && row.compatibilityScore > 0 && (
                  <span className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-[0_0_8px_1px_rgba(16,185,129,0.45)]">
                    {row.compatibilityScore}% Match
                  </span>
                  )}
                </td>

                {/* Status */}
                <td className="border-l border-black px-5 py-4">
                  <StatusBadge status={row.status} />
                </td>

                {/* Actions */}
                <td className="border-l border-black px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    aria-expanded={expandedId === row.id}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-bold underline"
                  >
                    {expandedId === row.id ? 'Hide details' : 'View details'}
                    <ChevronDown size={13} className={expandedId === row.id ? 'rotate-180' : ''} />
                  </button>
                  {row.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={updatingId !== null}
                        onClick={() => updateStatus(row.id, 'APPROVED')}
                        className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800"
                      >
                        <Check size={13} strokeWidth={3} />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={updatingId !== null}
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
              {/* Details row: opens right under the request, spans all 6 columns */}
              {expandedId === row.id && (
                <tr className="border-b border-black last:border-b-0">
                  <td colSpan={6} className="bg-neutral-50 p-5">
                    <RequestDetails row={row} />
                  </td>
                </tr>
              )}
              </Fragment>
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

            <button
              type="button"
              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
              aria-expanded={expandedId === row.id}
              className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-xs font-bold underline"
            >
              {expandedId === row.id ? 'Hide details' : 'View details'}
              <ChevronDown size={13} className={expandedId === row.id ? 'rotate-180' : ''} />
            </button>
            {expandedId === row.id && (
              //mb ki jgah shyad mt-3 hoga
              <div className="mb-2 border border-black bg-neutral-50 p-4">
                <RequestDetails row={row} />
              </div>
            )}

            {row.compatibilityScore != null && row.compatibilityScore > 0 && <span className="mt-2 inline-flex items-center rounded-full border border-emerald-500 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {row.compatibilityScore}% Match
            </span>}

              {row.status === 'PENDING' && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                    disabled={updatingId !== null}
                  onClick={() => updateStatus(row.id, 'APPROVED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
                >
                  <Check size={13} strokeWidth={3} />
                  Approve
                </button>
                <button
                  type="button"
                    disabled={updatingId !== null}
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