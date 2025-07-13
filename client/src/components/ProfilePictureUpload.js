import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaCamera, FaTrash, FaUpload, FaTimes } from 'react-icons/fa';

const ProfilePictureUpload = ({ onUploadSuccess, className = '' }) => {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localHasProfilePicture, setLocalHasProfilePicture] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadProfilePicture, deleteProfilePicture, user, getProfilePictureUrl } = useAuth();

  // Update local state when user data changes
  useEffect(() => {
    setLocalHasProfilePicture(user?.hasProfilePicture || false);
  }, [user?.hasProfilePicture]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
      const result = await uploadProfilePicture(file);
      if (result.success) {
        setPreview(null);
        setLocalHasProfilePicture(true);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
      handleFileUpload(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
      handleFileUpload(file);
    }
  };

  const handleDeletePicture = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      setIsUploading(true);
      try {
        const result = await deleteProfilePicture();
        if (result.success) {
          setPreview(null);
          setLocalHasProfilePicture(false);
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
      } catch (error) {
        console.error('Delete error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle profile picture click to open modal
  const handleProfilePictureClick = () => {
    if (currentProfilePicture) {
      setShowModal(true);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle modal backdrop click
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const currentProfilePicture = localHasProfilePicture ? getProfilePictureUrl(user?.id) : null;

  return (
    <div className={`profile-picture-upload ${className}`}>
      {/* Profile Picture Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="relative max-w-2xl max-h-full mx-4">
            <button
              onClick={handleCloseModal}
              className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors duration-200 z-10"
            >
              <FaTimes className="w-5 h-5 text-gray-600" />
            </button>
            <img
              src={currentProfilePicture}
              alt="Profile"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Current Profile Picture */}
      {currentProfilePicture && !preview && (
        <div className="relative inline-block">
          <img
            key={`profile-${user?.id}-${localHasProfilePicture}`}
            src={currentProfilePicture}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
            onClick={handleProfilePictureClick}
            title="Click to view larger"
          />
          <button
            onClick={handleDeletePicture}
            disabled={isUploading}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200 disabled:opacity-50"
            title="Delete profile picture"
          >
            <FaTrash className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {(!currentProfilePicture || preview) && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
            dragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Preview */}
          {preview && (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
            </div>
          )}

          {/* Upload Icon and Text */}
          <div className="space-y-2">
            <div className="flex justify-center">
              {isUploading ? (
                <div className="spinner w-8 h-8"></div>
              ) : preview ? (
                <FaCamera className="w-8 h-8 text-green-500" />
              ) : (
                <FaUpload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div>
              {isUploading ? (
                <p className="text-sm text-gray-600">Uploading...</p>
              ) : preview ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Image selected</p>
                  <button
                    onClick={handleClick}
                    className="text-sm text-green-600 hover:text-green-500"
                  >
                    Choose different image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Upload profile picture
                  </p>
                  <p className="text-xs text-gray-500">
                    Drag and drop an image here, or click to select
                  </p>
                  <button
                    onClick={handleClick}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Choose File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* File Requirements */}
          <div className="mt-4 text-xs text-gray-500">
            <p>Supported formats: JPEG, PNG, GIF</p>
            <p>Maximum size: 5MB</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload; 