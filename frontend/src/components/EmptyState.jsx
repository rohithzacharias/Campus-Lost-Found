import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  title = 'No reports found',
  description = 'There are currently no items matching your criteria.',
  actionText,
  actionLink,
  onActionClick
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 my-6 text-center bg-white border border-dashed border-slate-200 rounded-2xl max-w-xl mx-auto shadow-2xs">
      <div className="w-14 h-14 mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          {actionText}
        </Link>
      )}

      {actionText && onActionClick && !actionLink && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
