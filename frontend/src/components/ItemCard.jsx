import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function ItemCard({ item, type = 'lost' }) {
  const navigate = useNavigate();
  const isLost = type === 'lost';
  const detailUrl = isLost ? `/lost-items/${item._id}` : `/found-items/${item._id}`;
  const location = isLost ? item.lastSeenLocation : item.foundLocation;
  const rawDate = isLost ? item.lastSeenDate : item.foundDate;

  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Unknown date';

  const handleCardClick = () => {
    navigate(detailUrl);
  };

  const handleQuickFoundClick = (e) => {
    e.stopPropagation();
    navigate(`/lost-items/${item._id}?action=found`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-1 cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.itemName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-linear-to-br from-slate-100 to-slate-200/60 p-4">
            <svg className="w-10 h-10 mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-2xs font-medium uppercase tracking-wider text-slate-400">No Image Provided</span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider rounded-md backdrop-blur-md shadow-xs ${
              isLost
                ? 'bg-amber-500/90 text-white'
                : 'bg-emerald-600/90 text-white'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1.5">
            <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {item.category}
            </span>
            <span className="text-slate-400 font-normal text-2xs">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1.5">
            {item.itemName}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{location}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </div>

          {isLost && item.status !== 'resolved' && (
            <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="text-3xs font-semibold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Found this?
              </span>
              <button
                type="button"
                onClick={handleQuickFoundClick}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-3xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                I Found This
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
