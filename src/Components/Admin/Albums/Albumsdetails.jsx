import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const [eventImages, setEventImages] = useState([]);
  const [formData, setFormData] = useState({ title: "", images: [] });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("Token"); // Get token from local storage
  
  const BASE_URL = "https://wearing-contains-aluminum-caring.trycloudflare.com";

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

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      console.log("Selected Files:", selectedFiles);
      setFormData({ ...formData, images: selectedFiles });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || formData.images.length === 0) {
      alert("Please enter a title and select at least one image.");
      return;
    }

    let formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);

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
                    className="w-full h-40 object-cover rounded-md"
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

          {/* Image Upload Form */}
          {showForm ? (
            <form
              onSubmit={handleSubmit}
              className="mt-4 bg-white p-4 rounded-lg shadow-md"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Event Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Images
                </label>
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Upload
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="fixed bottom-8 right-8 h-14 w-14 flex items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition"
            >
              +
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AlbumDetailPage;
