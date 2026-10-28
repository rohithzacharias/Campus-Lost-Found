import React from 'react';

export default function LoadingState({ message = 'Loading reports...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-600" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
