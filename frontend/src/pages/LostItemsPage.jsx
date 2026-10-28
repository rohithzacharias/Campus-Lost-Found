import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ItemCard from '../components/ItemCard';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function LostItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('q', searchTerm.trim());
      if (category && category !== 'All') params.append('category', category);
      if (location.trim()) params.append('location', location.trim());
      if (status && status !== 'All') params.append('status', status);
      params.append('page', page);
      params.append('limit', 12);

      const res = await api.get(`/lost?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to load lost items:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, location, status, page]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
  }, [searchTerm, category, location, status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleReset = () => {
    setSearchTerm('');
    setCategory('All');
    setLocation('');
    setStatus('All');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 mb-2">
            Campus Lost Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Lost Belongings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse {totalItems} reported missing items across campus buildings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report-found"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Report Found Item
          </Link>
          <Link
            to="/report-lost"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            Report Lost Item
          </Link>
        </div>
      </div>

      {/* Quick Found Guidance Banner */}
      <div className="p-4 bg-linear-to-r from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-slate-900 block sm:inline mr-1">Found an item that is listed here?</span>
            <span className="text-slate-600">Click the <strong className="text-emerald-800">"I Found This"</strong> button on any card below to submit finding details instantly with auto-fill!</span>
          </div>
        </div>
        <Link
          to="/report-found"
          className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs"
        >
          General Found Form &rarr;
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <FilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        category={category}
        setCategory={setCategory}
        location={location}
        setLocation={setLocation}
        status={status}
        setStatus={setStatus}
        statusOptions={['All', 'open', 'matched', 'resolved']}
        onReset={handleReset}
      />

      {/* Results Content */}
      {loading ? (
        <LoadingState message="Searching campus lost items..." />
      ) : items.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} type="lost" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-xs font-medium text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No lost items found"
          description="We couldn't find any missing items matching your current search and filter settings."
          actionText="Clear Filters"
          onActionClick={handleReset}
        />
      )}
    </div>
  );
}
