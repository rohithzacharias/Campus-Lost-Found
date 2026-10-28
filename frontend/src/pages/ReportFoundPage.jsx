import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
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

export default function ReportFoundPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);

  const lostIdParam = searchParams.get('lostId') || '';
  const itemNameParam = searchParams.get('itemName') || '';
  const categoryParam = searchParams.get('category') || 'Electronics';
  const locationParam = searchParams.get('location') || '';
  const descParam = searchParams.get('description') || '';

  const savedPhone = localStorage.getItem('campusfind_phone') || '';

  const [formData, setFormData] = useState({
    itemName: itemNameParam,
    category: CATEGORIES.includes(categoryParam) ? categoryParam : 'Electronics',
    foundLocation: locationParam,
    foundDate: new Date().toISOString().substring(0, 10),
    description: descParam
      ? `Found item matching lost report: ${descParam}`
      : itemNameParam
      ? `Found item matching lost report for: ${itemNameParam}`
      : '',
    distinguishingFeatures: '',
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: savedPhone,
    matchedLostItemId: lostIdParam
  });

  const [openLostItems, setOpenLostItems] = useState([]);
  const [loadingLostList, setLoadingLostList] = useState(false);
  const [selectedLostId, setSelectedLostId] = useState(lostIdParam || '');

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch open lost items so finder can 1-click select and auto-fill
  useEffect(() => {
    async function fetchLostList() {
      setLoadingLostList(true);
      try {
        const res = await api.get('/lost?status=open&limit=50');
        if (res.data.success) {
          setOpenLostItems(res.data.items || []);
        }
      } catch (err) {
        console.error('Failed to load lost items for matching selector', err);
      } finally {
        setLoadingLostList(false);
      }
    }
    fetchLostList();
  }, []);

  // When finder selects a lost item from the dropdown, auto-fill all item fields
  const handleSelectLostItem = (lostId) => {
    setSelectedLostId(lostId);
    if (!lostId) {
      setFormData((prev) => ({
        ...prev,
        matchedLostItemId: ''
      }));
      return;
    }

    const matched = openLostItems.find((it) => it._id === lostId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        itemName: matched.itemName,
        category: CATEGORIES.includes(matched.category) ? matched.category : 'Other',
        foundLocation: matched.lastSeenLocation || prev.foundLocation,
        description: `Found item matching lost report for "${matched.itemName}". Description: ${matched.description || ''}`,
        distinguishingFeatures: matched.distinguishingFeatures || '',
        matchedLostItemId: matched._id
      }));
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (val) => {
    setFormData((prev) => ({ ...prev, contactPhone: val }));
    try {
      localStorage.setItem('campusfind_phone', val.trim());
    } catch (err) {
      console.error('Failed to save phone', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.itemName.trim()) {
      setError('Please provide an item name');
      return;
    }
    if (!formData.foundLocation.trim()) {
      setError('Please specify where you found the item');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }
    if (!formData.contactName.trim()) {
      setError('Please provide your name as finder');
      return;
    }
    if (!formData.contactEmail.trim() && !formData.contactPhone.trim()) {
      setError('Please provide at least one contact method (email or phone) so the owner can reach you');
      return;
    }

    setLoading(true);

    // Save phone number for future reports
    if (formData.contactPhone && formData.contactPhone.trim()) {
      try {
        localStorage.setItem('campusfind_phone', formData.contactPhone.trim());
      } catch (err) {
        console.error('Failed to save phone to localStorage', err);
      }
    }

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          payload.append(key, formData[key]);
        }
      });
      if (imageFile) {
        payload.append('image', imageFile);
      }

      const res = await api.post('/found', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        navigate(`/found-items/${res.data.item._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit found item report. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            Found Item Submission
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Found Belonging
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thank you for helping keep our campus honest and helpful. Post what you discovered so the owner can claim it.
          </p>
        </div>

        {/* 1-Click Lost Item Match Selector */}
        <div className="p-5 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              Did you find an item already reported as lost?
            </span>
            <span className="text-3xs text-emerald-700 font-semibold">
              Auto-fills all fields below in 1-click
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select
              value={selectedLostId}
              onChange={(e) => handleSelectLostItem(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 shadow-2xs"
            >
              <option value="">
                {loadingLostList
                  ? 'Loading reported lost items...'
                  : openLostItems.length > 0
                  ? '✦ Select a reported lost item to auto-fill (Optional)'
                  : 'No open lost items currently listed'}
              </option>
              {openLostItems.map((it) => (
                <option key={it._id} value={it._id}>
                  [{it.category}] {it.itemName} — Last seen at: {it.lastSeenLocation}
                </option>
              ))}
            </select>
            {selectedLostId && (
              <button
                type="button"
                onClick={() => handleSelectLostItem('')}
                className="px-3 py-2 text-xs text-red-600 hover:text-red-700 font-semibold hover:bg-red-50 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          {selectedLostId && (
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                <strong>Auto-filled from lost report!</strong> We've populated the item name, category, and description for you. Just verify the location and your contact info below.
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="itemName"
              required
              placeholder="e.g. Set of Dorm Room Keys, Graphing Calculator, Silver Apple Watch"
              value={formData.itemName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Date Found <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="foundDate"
                required
                value={formData.foundDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Location Found */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Location Where Found <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="foundLocation"
              required
              placeholder="e.g. Science Block Lecture Hall 101, Gym Locker Room, Student Union Bench"
              value={formData.foundLocation}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />

            {/* Quick location chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-3xs text-slate-400 font-semibold uppercase">Suggestions:</span>
              {['Central Library', 'Cafeteria', 'CSE Block', 'Main Auditorium', 'Hostel Block', 'Sports Ground'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, foundLocation: loc }))}
                  className="px-2 py-0.5 text-3xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Your Contact Information (Finder)
              </h3>
              <span className="text-3xs text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Auto-filled &bull; Saved in Browser
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  required
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  placeholder="student@campus.edu"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  name="contactPhone"
                  placeholder="e.g. 9876543210"
                  value={formData.contactPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <p className="text-2xs text-emerald-800">
              Provide at least one contact method so the verified owner can coordinate reclaiming their item.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Item Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows="4"
              placeholder="Describe what the item looks like, brand, general condition..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />

            {/* Quick handover status chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-3xs text-slate-400 font-semibold uppercase">Add handover note:</span>
              {[
                'Kept safely with finder (contact via phone)',
                'Handed over to Security Desk at Main Gate',
                'Submitted to Department Office',
                'Left at Library Reception Desk'
              ].map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => {
                    const sep = formData.description.trim() ? '\n' : '';
                    setFormData((prev) => ({
                      ...prev,
                      description: `${prev.description}${sep}Item Status: ${note}`
                    }));
                  }}
                  className="px-2 py-0.5 text-3xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  {note.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Distinguishing Features */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Distinguishing Features (Optional)
            </label>
            <input
              type="text"
              name="distinguishingFeatures"
              placeholder="e.g. Unique sticker, engraving, case color (leave sensitive details for owner to confirm)"
              value={formData.distinguishingFeatures}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Photograph Upload */}
          <ImageUploader
            label="Upload Found Item Photograph (Optional)"
            onImageSelected={(file) => setImageFile(file)}
            onImageRemoved={() => setImageFile(null)}
          />

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Publishing Report...' : 'Publish Found Item Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
