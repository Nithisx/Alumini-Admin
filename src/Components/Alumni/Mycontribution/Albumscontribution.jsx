import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Image, Eye, Edit, Trash2, Save, X, Upload } from "lucide-react";

const AlbumsContribution = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: ""
  });
  const [editCoverImage, setEditCoverImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const token = localStorage.getItem("Token");
  const BASE_URL = "https://api.karpagamalumni.in/api";

  useEffect(() => {
    fetchUserContributions();
  }, []);

  const fetchUserContributions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/myposts/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      // Extract albums from the API response
      if (response.data && response.data.albums) {
        setAlbums(response.data.albums);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching albums:", error);
      setError("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (albumId) => {
    if (!window.confirm("Are you sure you want to delete this album?")) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/albums/${albumId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      // Remove the deleted album from the state
      setAlbums(albums.filter(album => album.id !== albumId));
      alert("Album deleted successfully!");
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album. Please try again.");
    }
  };

  const handleEditClick = (album) => {
    setEditingAlbum(album.id);
    setEditFormData({
      title: album.title,
      description: album.description || ""
    });
    setEditCoverImage(null);
  };

  const handleEditCancel = () => {
    setEditingAlbum(null);
    setEditFormData({ title: "", description: "" });
    setEditCoverImage(null);
  };

  const handleEditSave = async (albumId) => {
    if (!editFormData.title.trim()) {
      alert("Title is required");
      return;
    }

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editFormData.title);
      formData.append("description", editFormData.description);

      if (editCoverImage) {
        formData.append("cover_image", editCoverImage);
      }

      const response = await axios.put(
        `${BASE_URL}/albums/${albumId}/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the album in the state
      setAlbums(albums.map(album =>
        album.id === albumId ? response.data : album
      ));

      setEditingAlbum(null);
      setEditFormData({ title: "", description: "" });
      setEditCoverImage(null);
      alert("Album updated successfully!");
    } catch (error) {
      console.error("Error updating album:", error);
      alert("Failed to update album. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditCoverImage(file);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserContributions}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {albums.length === 0 ? (
        <div className="text-center py-12">
          <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No albums contributed yet</p>
          <p className="text-gray-400 mt-2">
            Start by creating your first album to share memories with the community.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              My Album Contributions
            </h2>
            <p className="text-gray-600">
              Total Albums: <span className="font-medium">{albums.length}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Album Cover */}
                <div className="h-48 bg-gray-100 overflow-hidden">
                  {album.cover_image ? (
                    <img
                      src={`${BASE_URL}${album.cover_image}`}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <Image className="h-12 w-12 text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Album Details */}
                <div className="p-4">
                  {editingAlbum === album.id ? (
                    /* Edit Form */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Album title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Album description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cover Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {editCoverImage && (
                          <p className="text-sm text-green-600 mt-1">
                            New image selected: {editCoverImage.name}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => handleEditSave(album.id)}
                          disabled={editLoading}
                          className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          <span>{editLoading ? "Saving..." : "Save"}</span>
                        </button>

                        <button
                          onClick={handleEditCancel}
                          disabled={editLoading}
                          className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal View */
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                        {album.title}
                      </h3>

                      {album.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {album.description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Posted on {formatDate(album.posted_on)}</span>
                      </div>

                      {/* Album Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Created by {album.user?.first_name} {album.user?.last_name}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => window.location.href = `/alumni/albums/${album.id}`}
                          className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(album)}
                            className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition"
                            title="Edit Album"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(album.id)}
                            className="flex items-center space-x-1 bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition"
                            title="Delete Album"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumsContribution;