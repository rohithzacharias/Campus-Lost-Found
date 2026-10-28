import React, { useState, useEffect, useRef } from 'react';

export default function ImageUploader({
  currentImageUrl,
  onImageSelected,
  onImageRemoved,
  label = 'Item Photograph (Optional)'
}) {
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Clean up object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Image file is too large. Maximum size allowed is 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Create preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreview = URL.createObjectURL(file);
    setPreviewUrl(newPreview);
    setFileInfo({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    onImageSelected(file);
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setFileInfo(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {previewUrl ? (
        <div className="relative border-2 border-emerald-100 rounded-xl overflow-hidden bg-slate-50 group max-w-sm">
          <img
            src={previewUrl}
            alt="Report item preview"
            className="w-full h-48 object-cover object-center"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="px-3 py-1.5 bg-white text-slate-800 text-xs font-medium rounded-lg shadow-sm hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>
          {fileInfo && (
            <div className="p-2 bg-white/90 backdrop-blur-xs border-t border-slate-100 text-2xs text-slate-500 flex justify-between items-center">
              <span className="truncate max-w-[200px]">{fileInfo.name}</span>
              <span>{fileInfo.size}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Click to upload an image</p>
          <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WebP up to 5MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
