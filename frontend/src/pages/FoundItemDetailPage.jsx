import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import ImageUploader from '../components/ImageUploader';

const CATEGORIES = [
  'Electronics',
  'ID Cards',
  'Bags',
  'Keys',
  'Books',
  'Clothing',
  'Accessories',
  'Other'
];

export default function FoundItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status transition state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    itemName: '',
    category: '',
    description: '',
    distinguishingFeatures: '',
    foundLocation: '',
    foundDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [replacementImage, setReplacementImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/found/${id}`);
        if (res.data.success) {
          setItem(res.data.item);
          const i = res.data.item;
          setEditFormData({
            itemName: i.itemName,
            category: i.category,
            description: i.description,
            distinguishingFeatures: i.distinguishingFeatures || '',
            foundLocation: i.foundLocation,
            foundDate: i.foundDate ? i.foundDate.substring(0, 10) : '',
            contactName: i.contactName,
            contactEmail: i.contactEmail || '',
            contactPhone: i.contactPhone || ''
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load found item details');
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id]);

  const isOwner =
    isAuthenticated &&
    item &&
    item.reportedBy &&
    (item.reportedBy._id === user?._id || item.reportedBy === user?._id);

  // Status change handler
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/found/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setItem(res.data.item);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const formData = new FormData();
      Object.keys(editFormData).forEach((key) => {
        formData.append(key, editFormData[key]);
      });
      if (replacementImage) {
        formData.append('image', replacementImage);
      }

      const res = await api.put(`/found/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setItem(res.data.item);
        setIsEditing(false);
        setReplacementImage(null);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update report');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/found/${id}`);
      if (res.data.success) {
        navigate('/found-items');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) return <LoadingState message="Loading found report details..." />;

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This found item report could not be found or has been removed.'}</p>
        <Link
          to="/found-items"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
        >
          Return to Found Directory
        </Link>
      </div>
    );
  }

  const formattedDate = item.foundDate
    ? new Date(item.foundDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-600">Home</Link>
        <span>&rsaquo;</span>
        <Link to="/found-items" className="hover:text-emerald-600">Found Items</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{item.itemName}</span>
      </nav>

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10">
          {/* Left Column: Image & Finder Contact */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-inner">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.itemName}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
                  <svg className="w-16 h-16 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Photograph Provided</span>
                </div>
              )}
            </div>

            {/* Finder Contact Details (Privacy-conscious) */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Finder's Contact Information
                </h4>
              </div>

              <div className="space-y-1.5 text-sm text-slate-700">
                <p>
                  <span className="text-xs font-semibold text-slate-500">Name: </span>
                  <span className="font-bold text-slate-900">{item.contactName}</span>
                </p>

                {item.contactEmail && (
                  <p>
                    <span className="text-xs font-semibold text-slate-500">Email: </span>
                    <a
                      href={`mailto:${item.contactEmail}?subject=Inquiring about found item: ${encodeURIComponent(item.itemName)}`}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold underline"
                    >
                      {item.contactEmail}
                    </a>
                  </p>
                )}

                {item.contactPhone && (
                  <p>
                    <span className="text-xs font-semibold text-slate-500">Phone: </span>
                    <a
                      href={`tel:${item.contactPhone}`}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      {item.contactPhone}
                    </a>
                  </p>
                )}
              </div>

              {/* Safety Advice */}
              <div className="pt-2 border-t border-emerald-200/60 text-2xs text-emerald-800 leading-relaxed">
                Tip: Arrange to inspect or collect items in a central campus spot such as the Campus Information Desk or Department Office.
              </div>
            </div>
          </div>

          {/* Right Column: Details & Owner Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                    Found Report
                  </span>
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 rounded-md">
                    {item.category}
                  </span>
                </div>
                <StatusBadge status={item.status} size="lg" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {item.itemName}
              </h1>

              {/* Key metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-y border-slate-100 text-sm">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-3xs uppercase font-bold text-slate-400">Found Location</span>
                    <span className="font-semibold text-slate-900">{item.foundLocation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-3xs uppercase font-bold text-slate-400">Date Found</span>
                    <span className="font-semibold text-slate-900">{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Distinguishing Features */}
              {item.distinguishingFeatures && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Distinguishing Features / Unique Marks
                  </h4>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    {item.distinguishingFeatures}
                  </p>
                </div>
              )}

              {/* Status History */}
              {item.statusHistory && item.statusHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Report Timeline
                  </h4>
                  <div className="space-y-2">
                    {item.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold capitalize text-slate-900">
                          Marked as {history.status}
                        </span>
                        <span className="text-slate-400">
                          {new Date(history.changedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Owner Actions Bar */}
            {isOwner && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Finder Controls
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Edit Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Update Status:</span>
                  {['open', 'matched', 'returned'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus || item.status === st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer ${
                        item.status === st
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'returned' ? 'Mark as Returned to Owner' : st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Edit Found Item Report</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.itemName}
                  onChange={(e) => setEditFormData({ ...editFormData, itemName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date Found</label>
                  <input
                    type="date"
                    required
                    value={editFormData.foundDate}
                    onChange={(e) => setEditFormData({ ...editFormData, foundDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Found Location</label>
                <input
                  type="text"
                  required
                  value={editFormData.foundLocation}
                  onChange={(e) => setEditFormData({ ...editFormData, foundLocation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.contactName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.contactEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editFormData.contactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Distinguishing Features</label>
                <input
                  type="text"
                  value={editFormData.distinguishingFeatures}
                  onChange={(e) => setEditFormData({ ...editFormData, distinguishingFeatures: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <ImageUploader
                label="Replace Item Photograph (Optional)"
                currentImageUrl={item.imageUrl}
                onImageSelected={(file) => setReplacementImage(file)}
                onImageRemoved={() => setReplacementImage(null)}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Found Item Report"
        message="Are you sure you want to permanently delete this found item report? This action cannot be undone."
        confirmText="Delete Report"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
