import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function MyReportsPage() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState(null); // { id, type: 'lost' | 'found', name }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status transition state
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/reports');
      if (res.data.success) {
        setLostItems(res.data.myLostItems || []);
        setFoundItems(res.data.myFoundItems || []);
      }
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleStatusChange = async (itemId, type, newStatus) => {
    setUpdatingId(itemId);
    try {
      const endpoint = type === 'lost' ? `/lost/${itemId}/status` : `/found/${itemId}/status`;
      const res = await api.patch(endpoint, { status: newStatus });
      if (res.data.success) {
        if (type === 'lost') {
          setLostItems((prev) =>
            prev.map((item) => (item._id === itemId ? res.data.item : item))
          );
        } else {
          setFoundItems((prev) =>
            prev.map((item) => (item._id === itemId ? res.data.item : item))
          );
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);

    try {
      const endpoint = itemToDelete.type === 'lost' ? `/lost/${itemToDelete.id}` : `/found/${itemToDelete.id}`;
      const res = await api.delete(endpoint);
      if (res.data.success) {
        if (itemToDelete.type === 'lost') {
          setLostItems((prev) => prev.filter((i) => i._id !== itemToDelete.id));
        } else {
          setFoundItems((prev) => prev.filter((i) => i._id !== itemToDelete.id));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleteLoading(false);
      setItemToDelete(null);
    }
  };

  const resolvedLostCount = lostItems.filter((i) => i.status === 'resolved').length;
  const returnedFoundCount = foundItems.filter((i) => i.status === 'returned').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            Student Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Campus Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report-lost"
            className="px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
          >
            + Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            + Report Found
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-2xl font-bold text-slate-900">{lostItems.length}</p>
          <p className="text-xs font-medium text-slate-500 uppercase mt-1">My Lost Reports</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-2xl font-bold text-slate-900">{foundItems.length}</p>
          <p className="text-xs font-medium text-slate-500 uppercase mt-1">My Found Reports</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-2xl font-bold text-emerald-600">{resolvedLostCount + returnedFoundCount}</p>
          <p className="text-xs font-medium text-slate-500 uppercase mt-1">Reclaimed / Closed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-2xl font-bold text-teal-600">
            {lostItems.filter((i) => i.status === 'open').length +
              foundItems.filter((i) => i.status === 'open').length}
          </p>
          <p className="text-xs font-medium text-slate-500 uppercase mt-1">Active Cases</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('lost')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'lost'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Lost Reports ({lostItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('found')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'found'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Found Reports ({foundItems.length})
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <LoadingState message="Loading your campus reports..." />
      ) : activeTab === 'lost' ? (
        lostItems.length > 0 ? (
          <div className="space-y-4">
            {lostItems.map((item) => (
              <div
                key={item._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                        {item.category}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <Link
                      to={`/lost-items/${item._id}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors block"
                    >
                      {item.itemName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Last seen at <span className="font-medium text-slate-700">{item.lastSeenLocation}</span> &bull; {new Date(item.lastSeenDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {item.status !== 'resolved' ? (
                    <button
                      type="button"
                      disabled={updatingId === item._id}
                      onClick={() => handleStatusChange(item._id, 'lost', 'resolved')}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Mark as Resolved
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={updatingId === item._id}
                      onClick={() => handleStatusChange(item._id, 'lost', 'open')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Re-open Report
                    </button>
                  )}

                  <Link
                    to={`/lost-items/${item._id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    View Details
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setItemToDelete({ id: item._id, type: 'lost', name: item.itemName })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="You haven't reported any lost items"
            description="If you misplace an item anywhere on campus, post a report here so people can return it."
            actionText="Report a Lost Item"
            actionLink="/report-lost"
          />
        )
      ) : foundItems.length > 0 ? (
        <div className="space-y-4">
          {foundItems.map((item) => (
            <div
              key={item._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-bold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.category}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <Link
                    to={`/found-items/${item._id}`}
                    className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors block"
                  >
                    {item.itemName}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Found at <span className="font-medium text-slate-700">{item.foundLocation}</span> &bull; {new Date(item.foundDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {item.status !== 'returned' ? (
                  <button
                    type="button"
                    disabled={updatingId === item._id}
                    onClick={() => handleStatusChange(item._id, 'found', 'returned')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark as Returned
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingId === item._id}
                    onClick={() => handleStatusChange(item._id, 'found', 'open')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Re-open Report
                  </button>
                )}

                <Link
                  to={`/found-items/${item._id}`}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  View Details
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setItemToDelete({ id: item._id, type: 'found', name: item.itemName })
                  }
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete report"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You haven't reported any found items"
          description="Found someone's lost book, calculator, or keys? Post a report to help reunite them."
          actionText="Report a Found Item"
          actionLink="/report-found"
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!itemToDelete}
        title="Delete Report"
        message={`Are you sure you want to permanently delete the report for "${itemToDelete?.name}"?`}
        confirmText="Delete Report"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
