import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function ReportLostPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Electronics',
    lastSeenLocation: '',
    lastSeenDate: new Date().toISOString().substring(0, 10),
    description: '',
    distinguishingFeatures: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.itemName.trim()) {
      setError('Please provide an item name');
      return;
    }
    if (!formData.lastSeenLocation.trim()) {
      setError('Please specify where you last saw the item');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key]);
      });
      if (imageFile) {
        payload.append('image', imageFile);
      }

      const res = await api.post('/lost', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        navigate(`/lost-items/${res.data.item._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit lost item report. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            Lost Item Submission
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Missing Item
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provide detailed information so fellow students can easily identify and return your item.
          </p>
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
              placeholder="e.g. Black Lenovo ThinkPad Laptop, Student ID Card, Blue Water Bottle"
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
                Date Last Seen <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="lastSeenDate"
                required
                value={formData.lastSeenDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
              </input>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Last Seen Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastSeenLocation"
              required
              placeholder="e.g. Library 2nd Floor Study Cubicle, Science Block Room 304, Cafeteria"
              value={formData.lastSeenLocation}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows="4"
              placeholder="Describe color, size, brand, case, or contents inside..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Distinguishing Features */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Distinguishing Features (Optional)
            </label>
            <input
              type="text"
              name="distinguishingFeatures"
              placeholder="e.g. Scratched logo, specific keychain, name initials written in corner"
              value={formData.distinguishingFeatures}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Photograph Upload */}
          <ImageUploader
            label="Upload Item Photograph (Optional)"
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
              {loading ? 'Submitting Report...' : 'Publish Lost Item Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
