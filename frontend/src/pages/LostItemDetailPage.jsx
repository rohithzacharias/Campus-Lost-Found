import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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

export default function LostItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
    lastSeenLocation: '',
    lastSeenDate: ''
  });
  const [replacementImage, setReplacementImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // "I Found This Item!" modal state
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [foundFormData, setFoundFormData] = useState({
    foundLocation: '',
    foundDate: new Date().toISOString().substring(0, 10),
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    currentLocationNote: '',
    additionalFeatures: ''
  });
  const [foundPhoto, setFoundPhoto] = useState(null);
  const [foundSubmitting, setFoundSubmitting] = useState(false);
  const [foundError, setFoundError] = useState('');
  const [foundSuccessCreatedId, setFoundSuccessCreatedId] = useState(null);

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/lost/${id}`);
        if (res.data.success) {
          setItem(res.data.item);
          const i = res.data.item;
          setEditFormData({
            itemName: i.itemName,
            category: i.category,
            description: i.description,
            distinguishingFeatures: i.distinguishingFeatures || '',
            lastSeenLocation: i.lastSeenLocation,
            lastSeenDate: i.lastSeenDate ? i.lastSeenDate.substring(0, 10) : ''
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load lost item details');
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

  // Open "I Found This Item" modal with pre-filled details
  const handleOpenFoundModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    const savedPhone = localStorage.getItem('campusfind_phone') || '';
    setFoundFormData({
      foundLocation: item?.lastSeenLocation || '',
      foundDate: new Date().toISOString().substring(0, 10),
      contactName: user?.name || '',
      contactEmail: user?.email || '',
      contactPhone: savedPhone,
      currentLocationNote: `Kept safely with ${user?.name || 'finder'}`,
      additionalFeatures: item?.distinguishingFeatures || ''
    });
    setFoundPhoto(null);
    setFoundError('');
    setFoundSuccessCreatedId(null);
    setIsFoundModalOpen(true);
  };

  // Automatically open modal if ?action=found in URL
  useEffect(() => {
    if (item && searchParams.get('action') === 'found' && !isFoundModalOpen && !foundSuccessCreatedId) {
      handleOpenFoundModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, searchParams]);

  // Handle phone changes and sync with localStorage
  const handlePhoneChange = (val) => {
    setFoundFormData((prev) => ({ ...prev, contactPhone: val }));
    try {
      localStorage.setItem('campusfind_phone', val.trim());
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Found Report for this item
  const handleFoundSubmit = async (e) => {
    e.preventDefault();
    setFoundSubmitting(true);
    setFoundError('');

    if (!foundFormData.foundLocation.trim()) {
      setFoundError('Please specify where you found this item');
      setFoundSubmitting(false);
      return;
    }
    if (!foundFormData.contactEmail.trim() && !foundFormData.contactPhone.trim()) {
      setFoundError('Please provide at least one contact method (email or phone)');
      setFoundSubmitting(false);
      return;
    }

    if (foundFormData.contactPhone && foundFormData.contactPhone.trim()) {
      try {
        localStorage.setItem('campusfind_phone', foundFormData.contactPhone.trim());
      } catch (err) {
        console.error('Failed to save phone', err);
      }
    }

    try {
      const formData = new FormData();
      formData.append('itemName', item.itemName);
      formData.append('category', item.category);
      formData.append(
        'description',
        `Found item matching lost report "${item.itemName}". Note: ${foundFormData.currentLocationNote || 'Discovered on campus'}`
      );
      formData.append(
        'distinguishingFeatures',
        foundFormData.additionalFeatures || item.distinguishingFeatures || ''
      );
      formData.append('foundLocation', foundFormData.foundLocation.trim());
      formData.append('foundDate', foundFormData.foundDate);
      formData.append('contactName', foundFormData.contactName.trim());
      formData.append('contactEmail', foundFormData.contactEmail.trim().toLowerCase());
      formData.append('contactPhone', foundFormData.contactPhone.trim());
      formData.append('matchedLostItemId', item._id);

      if (foundPhoto) {
        formData.append('image', foundPhoto);
      }

      const res = await api.post('/found', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFoundSuccessCreatedId(res.data.item._id);
        // Update local item status to matched
        setItem((prev) => ({
          ...prev,
          status: 'matched',
          matchedFoundItemId: res.data.item
        }));
      }
    } catch (err) {
      setFoundError(err.response?.data?.message || 'Failed to submit found report');
    } finally {
      setFoundSubmitting(false);
    }
  };

  // Status change handler (Owner)
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/lost/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setItem(res.data.item);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Edit form submit (Owner)
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

      const res = await api.put(`/lost/${id}`, formData, {
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

  // Delete handler (Owner)
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/lost/${id}`);
      if (res.data.success) {
        navigate('/lost-items');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) return <LoadingState message="Loading lost report details..." />;

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This lost item report could not be found or has been removed.'}</p>
        <Link
          to="/lost-items"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
        >
          Return to Lost Directory
        </Link>
      </div>
    );
  }

  const formattedDate = item.lastSeenDate
    ? new Date(item.lastSeenDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-600">Home</Link>
        <span>&rsaquo;</span>
        <Link to="/lost-items" className="hover:text-emerald-600">Lost Items</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{item.itemName}</span>
      </nav>

      {/* Potential Match Alert */}
      {item.matchedFoundItemId && (
        <div className="p-4 sm:p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs text-blue-900 space-y-1.5 flex-1">
            <p className="font-bold text-sm sm:text-base">Potential Match Reported!</p>
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              A student reported finding this item at{' '}
              <span className="font-semibold">{item.matchedFoundItemId.foundLocation || 'campus'}</span>.
              {item.matchedFoundItemId.contactName && (
                <> Finder: <span className="font-semibold">{item.matchedFoundItemId.contactName}</span>.</>
              )}
            </p>
            <div className="pt-1">
              <Link
                to={`/found-items/${item.matchedFoundItemId._id || item.matchedFoundItemId}`}
                className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 hover:underline text-xs sm:text-sm"
              >
                View Finder's Report &amp; Contact Details &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click "I Found This Item!" Banner (For all students, finders & owners) */}
      {item.status !== 'resolved' && (
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-3xs font-bold uppercase tracking-wider">
              ✦ Fast 1-Click Found Reporting
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {isOwner ? `Did you or someone find this ${item.itemName}?` : `Did you find this ${item.itemName}?`}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
              No need to fill out a long form from scratch! Click below to confirm where it was found and auto-fill your contact details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenFoundModal}
            className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            I Found This Item!
          </button>
        </div>
      )}

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10">
          {/* Left Column: Image */}
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

            {/* Reporter Contact Info Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Reported by Student
              </h4>
              <p className="text-sm font-semibold text-slate-800">
                {item.reportedBy?.name || 'Anonymous Student'}
              </p>
              {item.reportedBy?.email && (
                <a
                  href={`mailto:${item.reportedBy.email}?subject=Found your lost item: ${encodeURIComponent(item.itemName)}`}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Reporter via Email
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                    Lost Report
                  </span>
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                    {item.category}
                  </span>
                </div>
                <StatusBadge status={item.status} size="lg" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {item.itemName}
                </h1>
                {/* Secondary "I Found This" button next to title */}
                {item.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={handleOpenFoundModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    I Found This Item
                  </button>
                )}
              </div>

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
                    <span className="block text-3xs uppercase font-bold text-slate-400">Last Seen Location</span>
                    <span className="font-semibold text-slate-900">{item.lastSeenLocation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-3xs uppercase font-bold text-slate-400">Date Last Seen</span>
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

              {/* Status History Timeline */}
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
                    Owner Actions
                  </span>
                  <div className="flex items-center gap-2">
                    {item.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={handleOpenFoundModal}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Log as Found
                      </button>
                    )}
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

                {/* Quick Status Updater */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Update Status:</span>
                  {['open', 'matched', 'resolved'].map((st) => (
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
                      {st === 'resolved' ? 'Mark as Resolved' : st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "I Found This Item!" Fast Modal */}
      {isFoundModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            {foundSuccessCreatedId ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Thank You! Report Published</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your found report has been posted and linked to this lost item. The status is now marked as{' '}
                  <span className="font-semibold text-blue-700">Potential Match</span> so the student can reach out to you.
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <Link
                    to={`/found-items/${foundSuccessCreatedId}`}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md"
                  >
                    View Your Found Report
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsFoundModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Report Finding This Item
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFoundModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Item Summary Banner */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl mb-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-emerald-800 text-xs">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      'ITEM'
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 text-sm">{item.itemName}</p>
                    <p className="text-slate-500">
                      Category: <span className="font-semibold text-emerald-800">{item.category}</span> &bull; Last seen: {item.lastSeenLocation}
                    </p>
                  </div>
                </div>

                {foundError && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                    {foundError}
                  </div>
                )}

                <form onSubmit={handleFoundSubmit} className="space-y-4">
                  {/* Where did you find it */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                          Where did you find it? <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CSE 1st floor hallway"
                          value={foundFormData.foundLocation}
                          onChange={(e) =>
                            setFoundFormData({ ...foundFormData, foundLocation: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                          Date Found <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={foundFormData.foundDate}
                          onChange={(e) =>
                            setFoundFormData({ ...foundFormData, foundDate: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick Location Suggestion Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-3xs text-slate-400 font-semibold uppercase">Quick Fill:</span>
                      {item.lastSeenLocation && (
                        <button
                          type="button"
                          onClick={() => setFoundFormData({ ...foundFormData, foundLocation: item.lastSeenLocation })}
                          className="px-2 py-0.5 text-3xs font-medium rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Same place: {item.lastSeenLocation}
                        </button>
                      )}
                      {['Central Library', 'Cafeteria', 'CSE Block', 'Main Auditorium'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setFoundFormData({ ...foundFormData, foundLocation: loc })}
                          className="px-2 py-0.5 text-3xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Finder Contact Information (Pre-filled) */}
                  <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-emerald-950 uppercase tracking-wide">
                        Your Contact Information (Finder)
                      </span>
                      <span className="text-3xs text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        Auto-filled &bull; Saved for future
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-3xs font-semibold text-slate-600 uppercase mb-0.5">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={foundFormData.contactName}
                          onChange={(e) =>
                            setFoundFormData({ ...foundFormData, contactName: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-3xs font-semibold text-slate-600 uppercase mb-0.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={foundFormData.contactEmail}
                          onChange={(e) =>
                            setFoundFormData({ ...foundFormData, contactEmail: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-3xs font-semibold text-slate-600 uppercase mb-0.5">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={foundFormData.contactPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Item Location / Pickup Instructions */}
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-slate-700 uppercase">
                      Where is the item currently kept?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kept safely with me / Handed to Security Desk at Library"
                      value={foundFormData.currentLocationNote}
                      onChange={(e) =>
                        setFoundFormData({ ...foundFormData, currentLocationNote: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />

                    {/* Quick Status Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-3xs text-slate-400 font-semibold uppercase">Presets:</span>
                      {[
                        `In my possession (will return to owner)`,
                        `Handed over to Security Desk (Main Gate)`,
                        `Submitted to Department Office`,
                        `Left at Library Reception`
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setFoundFormData({ ...foundFormData, currentLocationNote: preset })
                          }
                          className="px-2 py-0.5 text-3xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                        >
                          {preset.split('(')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Photo */}
                  <ImageUploader
                    label="Attach Photo of Found Item (Optional)"
                    onImageSelected={(file) => setFoundPhoto(file)}
                    onImageRemoved={() => setFoundPhoto(null)}
                  />

                  {/* Submit Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFoundModalOpen(false)}
                      className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={foundSubmitting}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {foundSubmitting && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {foundSubmitting ? 'Submitting...' : 'Confirm & Report Found'}
                    </button>
                  </div>

                  {/* Full Page Link */}
                  <div className="pt-2 text-center">
                    <Link
                      to={`/report-found?lostId=${item._id}&itemName=${encodeURIComponent(item.itemName)}&category=${encodeURIComponent(item.category)}&location=${encodeURIComponent(item.lastSeenLocation || '')}&description=${encodeURIComponent(item.description || '')}`}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Prefer to fill out the full Report Found form? Open full page &rarr;
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (Owner) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Edit Lost Item Report</h3>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date Last Seen</label>
                  <input
                    type="date"
                    required
                    value={editFormData.lastSeenDate}
                    onChange={(e) => setEditFormData({ ...editFormData, lastSeenDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Seen Location</label>
                <input
                  type="text"
                  required
                  value={editFormData.lastSeenLocation}
                  onChange={(e) => setEditFormData({ ...editFormData, lastSeenLocation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
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

      {/* Delete Confirmation Dialog (Owner) */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Lost Item Report"
        message="Are you sure you want to permanently delete this lost item report? This action cannot be undone."
        confirmText="Delete Report"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
