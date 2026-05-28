import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [eventImages, setEventImages] = useState([]);
  const [formData, setFormData] = useState({ title: "", images: [] });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const token = localStorage.getItem("Token");
  const BASE_URL = "https://api.karpagamalumni.in/api/v1";
  const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

  // Staff can delete any image
  const canDeleteImage = () => true;

  const compressImage = (file, maxSizeMB = 5, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        const maxDimension = 1920;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const newImg = new Image();
                newImg.onload = () => {
                  const ctx = canvas.getContext('2d');
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(newImg, 0, 0, width, height);
                  canvas.toBlob(
                    (finalBlob) => {
                      resolve(new File([finalBlob], file.name, { type: file.type, lastModified: Date.now() }));
                    },
                    file.type,
                    Math.max(0.1, quality - 0.2)
                  );
                };
                newImg.src = e.target.result;
              };
              reader.readAsDataURL(blob);
            } else {
              resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (!albumId) return;
    const fetchData = async () => {
      try {
        const imagesRes = await axios.get(`${BASE_URL}/albums/${albumId}/images/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setEventImages(imagesRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [albumId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fullscreenImage === null) return;
      if (e.key === "Escape") closeFullscreen();
      else if (e.key === "ArrowRight") showNextImage();
      else if (e.key === "ArrowLeft") showPrevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage, currentImageIndex, eventImages]);

  useEffect(() => {
    document.body.style.overflow = (showForm || fullscreenImage) ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [showForm, fullscreenImage]);

  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);
    try {
      const compressedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          if (file.size / (1024 * 1024) > 5) return compressImage(file);
          return file;
        })
      );
      setFormData({ ...formData, images: compressedFiles });
    } catch {
      toast.error("Error processing images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) { toast.error("Please select at least one image."); return; }
    setUploading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title || "New Image");
    formData.images.forEach((image) => formDataToSend.append("images", image));
    try {
      const response = await axios.post(`${BASE_URL}/albums/${albumId}/images/`, formDataToSend, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" },
      });
      setEventImages([...response.data, ...eventImages]);
      setFormData({ title: "", images: [] });
      document.getElementById("imageUpload").value = "";
      setShowForm(false);
      toast.success("Images uploaded successfully!");
    } catch {
      toast.error("Failed to upload images.");
    } finally {
      setUploading(false);
    }
  };

  const doDeleteImage = async (imageId) => {
    try {
      await axios.delete(`${BASE_URL}/albums/${imageId}/images/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setEventImages(eventImages.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully!");
    } catch {
      toast.error("Failed to delete image.");
    }
  };

  const openFullscreen = (image, index) => {
    setImageLoading(true);
    setFullscreenImage(image);
    setCurrentImageIndex(index);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
    setImageLoading(false);
  };

  const showNextImage = () => {
    setImageLoading(true);
    const nextIndex = (currentImageIndex + 1) % eventImages.length;
    setCurrentImageIndex(nextIndex);
    setFullscreenImage(eventImages[nextIndex]);
  };

  const showPrevImage = () => {
    setImageLoading(true);
    const prevIndex = (currentImageIndex - 1 + eventImages.length) % eventImages.length;
    setCurrentImageIndex(prevIndex);
    setFullscreenImage(eventImages[prevIndex]);
  };

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) { navigate(-1); return; }
    navigate('/staff/albums');
  };

  return (
    <div className="p-4">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Image"
        message="This will permanently delete the image."
        danger
        confirmText="Delete"
        onConfirm={() => { doDeleteImage(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="mb-4">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 font-medium text-green-700 hover:text-green-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Go back
        </button>
      </div>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {eventImages.length > 0 ? (
              eventImages.map((event, index) => (
                <div
                  key={event.id || index}
                  className="relative group bg-white rounded-lg shadow p-3"
                >
                  <img
                    src={`${MEDIA_BASE_URL}${event.image}`}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded-md cursor-pointer"
                    onClick={() => openFullscreen(event, index)}
                  />
                  <p className="mt-2 text-center font-medium text-gray-700">{event.title}</p>
                  {canDeleteImage(event) && (
                    <button
                      onClick={() => setConfirmDeleteId(event.id)}
                      className="absolute top-2 right-2 bg-red-500 p-2 rounded hover:bg-red-400 transition duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm text-white" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full">No images available.</p>
            )}
          </div>

          {/* Fullscreen Image Modal */}
          {fullscreenImage && (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
              <div className="relative max-w-full max-h-full p-4">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
                  </div>
                )}
                <img
                  src={`${MEDIA_BASE_URL}${fullscreenImage.image}`}
                  alt={fullscreenImage.title}
                  className={`max-h-screen max-w-full object-contain transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
                  onLoad={() => setImageLoading(false)}
                />
                <h3 className="text-white text-center mt-4 text-xl">{fullscreenImage.title}</h3>
              </div>

              <button onClick={closeFullscreen}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button onClick={showPrevImage}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                aria-label="Previous image" disabled={imageLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button onClick={showNextImage}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                aria-label="Next image" disabled={imageLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                {currentImageIndex + 1} / {eventImages.length}
              </div>
            </div>
          )}

          {/* Upload Image Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button onClick={() => setShowForm(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                  aria-label="Close" disabled={uploading}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload New Images</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Images</label>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Images larger than 5MB will be automatically compressed</p>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button type="button"
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition disabled:opacity-50"
                      onClick={() => setShowForm(false)} disabled={uploading}>
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
                      disabled={uploading}>
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          {formData.images.length > 0 ? 'Uploading...' : 'Processing...'}
                        </>
                      ) : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-8 right-8 h-14 w-14 flex items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition text-2xl font-bold disabled:opacity-50"
            title="Upload Images" disabled={uploading}>
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            ) : '+'}
          </button>
        </>
      )}
    </div>
  );
};

export default AlbumDetailPage;
