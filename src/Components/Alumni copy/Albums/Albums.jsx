import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen,
  faPlus,
  faTimes,
  faTrash,
  faImage,
  faCheck,
  faExclamationCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const AlbumsPage = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("grid"); // grid or list view
  const [isCreating, setIsCreating] = useState(false); // Loading state for create button

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const token = localStorage.getItem("Token");
        const response = await axios.get("https://xyndrix.me/api/albums/", {
          headers: { Authorization: `Token ${token}` },
        });
        setAlbums(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching albums:", error);
        showNotification(
          "Could not load albums. Please try again later.",
          "error"
        );
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  };

  // const handleDeleteAlbum = async (id, e) => {
  //   e.stopPropagation();
  //   if (!window.confirm("Are you sure you want to delete this album?")) return;
  //   try {
  //     const token = localStorage.getItem("Token");
  //     await axios.delete(`https://xyndrix.me/api/albums/${id}/`, {
  //       headers: { Authorization: `Token ${token}` },
  //     });
  //     setAlbums(prev => prev.filter(a => a.id !== id));
  //     showNotification("Album deleted successfully!");
  //   } catch (error) {
  //     console.error("Error deleting album:", error);
  //     showNotification("Could not delete album.", "error");
  //   }
  // };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification("Please enter an album title.", "error");
      return;
    }

    setIsCreating(true); // Start loading

    try {
      const token = localStorage.getItem("Token");
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      if (uploadedFile)
        payload.append("cover_image", uploadedFile.file, uploadedFile.name);

      const response = await axios.post(
        "https://xyndrix.me/api/albums/",
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAlbums((prev) => [response.data, ...prev]);
      setIsModalOpen(false);
      setFormData({ title: "", description: "" });
      setUploadedFile(null);
      showNotification("Album created successfully!");
    } catch (error) {
      console.error("Error creating album:", error);
      showNotification("Could not create album.", "error");
    } finally {
      setIsCreating(false); // Stop loading
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedFile({
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
      });
    } else {
      showNotification("Please upload only image files.", "error");
    }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
  };

  // Handle drag and drop box click
  const handleDragBoxClick = () => {
    document.getElementById("file-upload").click();
  };

  const filteredAlbums = searchTerm
    ? albums.filter(
        (album) =>
          album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          album.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : albums;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - Updated with green gradient and smaller size */}
        {/* Header Section with search in header */}
        <div className="bg-white shadow-sm pm-4 rounded-lg mb-6">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h1 className="text-3xl font-bold text-green-700">
                Albums Dashboard
              </h1>
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search albums..."
                    className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                </div>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
                  <button
                    className={`p-2 rounded ${
                      view === "grid"
                        ? "bg-white shadow text-green-600"
                        : "text-gray-500"
                    }`}
                    onClick={() => setView("grid")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    className={`p-2 rounded ${
                      view === "list"
                        ? "bg-white shadow text-green-600"
                        : "text-gray-500"
                    }`}
                    onClick={() => setView("list")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center font-medium"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  New Album
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.message && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition transform translate-y-0 ${
              notification.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={
                  notification.type === "error" ? faExclamationCircle : faCheck
                }
                className="mr-2"
              />
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600"></div>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center text-center">
            {searchTerm ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  No matching albums found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  We couldn't find any albums matching "{searchTerm}". Try a
                  different search term or clear your search.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faFolderOpen}
                  className="text-6xl text-gray-300 mb-4"
                />
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  No Albums Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  You haven't created any photo albums yet. Start organizing
                  your photos by creating your first album.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center font-medium"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Create Your First Album
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => navigate(`/alumni/albums/${album.id}`)}
                    className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {/* Delete button moved to top left */}

                      {album.cover_image ? (
                        <img
                          src={`https://xyndrix.me/api${album.cover_image}`}
                          alt={album.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={faImage}
                            className="text-3xl text-gray-400"
                          />
                        </div>
                      )}
                      {/* Removed black background overlay on hover */}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                        {album.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {album.description || "No description"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {filteredAlbums.map((album) => (
                    <li
                      key={album.id}
                      onClick={() => navigate(`/alumni/albums/${album.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex items-center p-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
                          {album.cover_image ? (
                            <img
                              src={`https://xyndrix.me/api${album.cover_image}`}
                              alt={album.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                              <FontAwesomeIcon
                                icon={faImage}
                                className="text-gray-400"
                              />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-grow">
                          <h3 className="text-lg font-medium text-gray-800">
                            {album.title}
                          </h3>
                          <p className="text-gray-500 text-sm truncate">
                            {album.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-xl font-semibold flex items-center">
                  <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
                  Create New Album
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-green-100 transition"
                  disabled={isCreating}
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Album Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Enter album title"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Describe what this album is about"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cover Image
                </label>
                {uploadedFile ? (
                  <div className="relative bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <button
                      onClick={removeFile}
                      type="button"
                      className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 shadow-md hover:bg-red-50 transition"
                      disabled={isCreating}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                    <div className="flex flex-col items-center">
                      <img
                        src={uploadedFile.preview}
                        alt="Preview"
                        className="w-full max-w-xs h-auto max-h-48 object-contain rounded-lg"
                      />
                      <p className="mt-2 text-sm text-gray-500 truncate max-w-full">
                        {uploadedFile.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition"
                    onClick={handleDragBoxClick}
                  >
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                          Upload a file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="sr-only"
                      disabled={isCreating}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-50 transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition flex items-center disabled:bg-green-400 disabled:cursor-not-allowed"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="mr-2 animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Create Album
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-out { 0%,100% { opacity: 0;} 10%,90% { opacity:1;} }
        .animate-fade-in-out { animation: fade-in-out 4s ease-in-out forwards; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0;} to { transform: scale(1); opacity: 1;} }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AlbumsPage;
