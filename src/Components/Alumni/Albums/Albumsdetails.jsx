import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const [eventImages, setEventImages] = useState([]);
  const [formData, setFormData] = useState({ title: "", images: [] });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  // New state for upload loading
  const [uploading, setUploading] = useState(false);
  // New state for fullscreen image viewer
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // New state for fullscreen image loading
  const [imageLoading, setImageLoading] = useState(false);
  
  const token = localStorage.getItem("Token"); // Get token from local storage
  const BASE_URL = "http://209.38.121.118/api";

  // Image compression function
const compressImage = (file, maxSizeMB = 5, quality = 0.8) => {
  console.log(`Original file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

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
          const printCompressedSize = (b) => {
            console.log(`Compressed file size: ${(b.size / (1024 * 1024)).toFixed(2)} MB`);
          };

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
                    printCompressedSize(finalBlob);
                    const compressedFile = new File([finalBlob], file.name, {
                      type: file.type,
                      lastModified: Date.now()
                    });
                    resolve(compressedFile);
                  },
                  file.type,
                  Math.max(0.1, quality - 0.2)
                );
              };
              newImg.src = e.target.result;
            };
            reader.readAsDataURL(blob);
          } else {
            printCompressedSize(blob);
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
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

    const fetchEventImages = async () => {
      console.log(`Fetching images from ${BASE_URL}/albums/${albumId}/images/`);
      try {
        const response = await axios.get(
          `${BASE_URL}/albums/${albumId}/images/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        console.log("API Response:", response.data);
        setEventImages(response.data);
      } catch (error) {
        console.error("Error fetching event images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventImages();
  }, [albumId]);

  // Handle keyboard navigation in fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fullscreenImage === null) return;
      
      if (e.key === "Escape") {
        closeFullscreen();
      } else if (e.key === "ArrowRight") {
        showNextImage();
      } else if (e.key === "ArrowLeft") {
        showPrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage, currentImageIndex, eventImages]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showForm || fullscreenImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showForm, fullscreenImage]);

  const handleFileChange = async (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      console.log("Selected Files:", selectedFiles);
      
      // Show loading state while compressing
      setUploading(true);
      
      try {
        // Compress each image if it's larger than 5MB
        const compressedFiles = await Promise.all(
          selectedFiles.map(async (file) => {
            const fileSizeMB = file.size / (1024 * 1024);
            console.log(`File ${file.name} size: ${fileSizeMB.toFixed(2)}MB`);
            
            if (fileSizeMB > 5) {
              console.log(`Compressing ${file.name}...`);
              const compressedFile = await compressImage(file);
              const compressedSizeMB = compressedFile.size / (1024 * 1024);
              console.log(`Compressed ${file.name} to ${compressedSizeMB.toFixed(2)}MB`);
              return compressedFile;
            }
            return file;
          })
        );
        
        setFormData({ ...formData, images: compressedFiles });
      } catch (error) {
        console.error("Error compressing images:", error);
        alert("Error processing images. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    setUploading(true); // Start upload loading state

    let formDataToSend = new FormData();
    formDataToSend.append("title", formData.title || "New Image");

    // Append each image using the key "images" to match Django's request.FILES.getlist('images')
    formData.images.forEach((image) => {
      formDataToSend.append("images", image);
    });

    console.log("Preparing to send request...");
    console.log("FormData entries:");
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      console.log(`Uploading to: ${BASE_URL}/albums/${albumId}/images/`);

      const response = await axios.post(
        `${BASE_URL}/albums/${albumId}/images/`,
        formDataToSend,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setEventImages([...response.data, ...eventImages]);
      setFormData({ title: "", images: [] });
      document.getElementById("imageUpload").value = "";
      setShowForm(false);
      alert("Event images uploaded successfully!");
    } catch (error) {
      console.error("Error uploading event image:", error);
      alert("Failed to upload event images.");
    } finally {
      setUploading(false); // End upload loading state
    }
  };

  // Delete an image by its id
  const handleDelete = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await axios.delete(`${BASE_URL}/albums/${imageId}/images/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setEventImages(eventImages.filter((img) => img.id !== imageId));
      alert("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image.");
    }
  };

  // Open fullscreen image viewer
  const openFullscreen = (image, index) => {
    setImageLoading(true); // Start loading
    setFullscreenImage(image);
    setCurrentImageIndex(index);
  };

  // Close fullscreen image viewer
  const closeFullscreen = () => {
    setFullscreenImage(null);
    setImageLoading(false);
  };

  // Show next image
  const showNextImage = () => {
    setImageLoading(true); // Start loading for next image
    const nextIndex = (currentImageIndex + 1) % eventImages.length;
    setCurrentImageIndex(nextIndex);
    setFullscreenImage(eventImages[nextIndex]);
  };

  // Show previous image
  const showPrevImage = () => {
    setImageLoading(true); // Start loading for previous image
    const prevIndex = (currentImageIndex - 1 + eventImages.length) % eventImages.length;
    setCurrentImageIndex(prevIndex);
    setFullscreenImage(eventImages[prevIndex]);
  };

  // Handle fullscreen image load complete
  const handleImageLoaded = () => {
    setImageLoading(false);
  };

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Display event images */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {eventImages.length > 0 ? (
              eventImages.map((event, index) => (
                <div
                  key={event.id || index}
                  className="relative group bg-white rounded-lg shadow p-3"
                >
                  <img
                    src={`${BASE_URL}${event.image}`}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded-md cursor-pointer"
                    onClick={() => openFullscreen(event, index)}
                  />
                  <p className="mt-2 text-center font-medium text-gray-700">
                    {event.title}
                  </p>
                  {/* Delete Button: icon-only, appears on hover */}
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="absolute top-2 right-2 bg-red-500 p-2 rounded hover:bg-red-400 transition duration-300 opacity-0 group-hover:opacity-100"
                  >
                    {/* Inline SVG Delete Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 01.894.553L10 3h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H8a2 2 0 01-2-2V5H5a1 1 0 110-2h4l.106-.447A1 1 0 019 2zm-1 4v10a1 1 0 001 1h4a1 1 0 001-1V6H8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No images available.</p>
            )}
          </div>

          {/* Fullscreen Image Modal */}
          {fullscreenImage && (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
              {/* Image container */}
              <div className="relative max-w-full max-h-full p-4">
                {/* Loading Spinner */}
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
                  </div>
                )}
                
                <img
                  src={`${BASE_URL}${fullscreenImage.image}`}
                  alt={fullscreenImage.title}
                  className={`max-h-screen max-w-full object-contain transition-opacity duration-300 ${
                    imageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={handleImageLoaded}
                />
                <h3 className="text-white text-center mt-4 text-xl">
                  {fullscreenImage.title}
                </h3>
              </div>

              {/* Navigation and Close buttons */}
              <button
                onClick={closeFullscreen}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Previous button */}
              <button
                onClick={showPrevImage}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                aria-label="Previous image"
                disabled={imageLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Next button */}
              <button
                onClick={showNextImage}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                aria-label="Next image"
                disabled={imageLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Current Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                {currentImageIndex + 1} / {eventImages.length}
              </div>
            </div>
          )}

          {/* Upload Image Modal Popup */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                {/* Close button */}
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                  aria-label="Close"
                  disabled={uploading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                  Upload New Images
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Images
                    </label>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Images larger than 5MB will be automatically compressed
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition disabled:opacity-50"
                      onClick={() => setShowForm(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          {formData.images.length > 0 ? 'Uploading...' : 'Processing...'}
                        </>
                      ) : (
                        'Upload'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-8 right-8 h-14 w-14 flex items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition text-2xl font-bold disabled:opacity-50"
            title="Upload Images"
            disabled={uploading}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            ) : (
              '+'
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default AlbumDetailPage;