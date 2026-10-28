import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ItemCard from '../components/ItemCard';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function FoundItemsPage() {
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

      const res = await api.get(`/found?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to load found items:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, location, status, page]);

  useEffect(() => {
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
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mb-2">
            Campus Found Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Found Belongings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse {totalItems} items found by fellow campus students and staff.
          </p>
        </div>

        <div>
          <Link
            to="/report-found"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            Report Found Item
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        category={category}
        setCategory={setCategory}
        location={location}
        setLocation={setLocation}
        status={status}
        setStatus={setStatus}
        statusOptions={['All', 'open', 'matched', 'returned']}
        onReset={handleReset}
      />

      {/* Results Content */}
      {loading ? (
        <LoadingState message="Searching campus found items..." />
      ) : items.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} type="found" />
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
          title="No found items matching filters"
          description="We couldn't locate any items matching your selected criteria. Try resetting filters."
          actionText="Clear Filters"
          onActionClick={handleReset}
        />
      )}
    </div>
  );
}
