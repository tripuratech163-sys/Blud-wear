import { useState } from 'react';

const CloudinaryUpload = ({ onUploadSuccess, buttonText = "Upload Image", style }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError("Cloudinary configuration is missing. Make sure VITE_CLOUDINARY_UPLOAD_PRESET is set in .env.local");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data.secure_url);
      } else {
        setError(data.error?.message || "Upload failed");
      }
    } catch (err) {
      setError("Network error occurred while uploading");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = null;
    }
  };

  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
        />
        <button 
          type="button" 
          className="admin-btn-secondary"
          disabled={isUploading}
          style={{ width: '100%', pointerEvents: 'none' }}
        >
          {isUploading ? 'Uploading...' : buttonText}
        </button>
      </div>
      {error && <span style={{ color: '#ff3b30', fontSize: '0.8rem' }}>{error}</span>}
    </div>
  );
};

export default CloudinaryUpload;
