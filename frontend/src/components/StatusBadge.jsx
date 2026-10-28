import React from 'react';

const statusStyles = {
  open: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Open / Searching'
  },
  matched: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Potential Match'
  },
  resolved: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    label: 'Resolved'
  },
  returned: {
    bg: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-600',
    label: 'Returned to Owner'
  }
};

export default function StatusBadge({ status, size = 'sm' }) {
  const normalized = (status || 'open').toLowerCase();
  const config = statusStyles[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: status || 'Unknown'
  };

  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${config.bg} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
}
