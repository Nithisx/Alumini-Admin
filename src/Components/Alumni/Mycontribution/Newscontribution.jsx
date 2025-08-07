"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Eye, AlertCircle, Loader, Edit, X, Save } from "lucide-react";

// API Configuration
const API_BASE_URL = "https://xyndrix.me/api";
const NEWS_API_URL = `${API_BASE_URL}/news/`;

const NewsContribution = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    category: "",
    featured: false,
    image: null
  });

  // Fetch news from API
  const fetchNews = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(NEWS_API_URL, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();
      setNews(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(err.message || "Failed to fetch news");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleAddNews = () => {
    console.log("Add new news article");
  };

  const handleEditNews = (article) => {
    setEditingId(article.id);
    setEditForm({
      title: article.title || "",
      content: article.content || "",
      category: article.category || "",
      featured: article.featured || false,
      image: null
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      title: "",
      content: "",
      category: "",
      featured: false,
      image: null
    });
  };

  const handleSaveEdit = async (articleId) => {
    setEditLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Prepare form data for multipart/form-data
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("content", editForm.content);
      formData.append("category", editForm.category);
      formData.append("featured", editForm.featured);
      
      // Only append image if a new one was selected
      if (editForm.image) {
        formData.append("thumbnail", editForm.image);
      }

      const response = await fetch(`${NEWS_API_URL}${articleId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update news: ${response.status}`);
      }

      const updatedArticle = await response.json();

      // Update the news in local state
      setNews((prevNews) =>
        prevNews.map((article) =>
          article.id === articleId ? updatedArticle : article
        )
      );

      // Reset edit state
      setEditingId(null);
      setEditForm({
        title: "",
        content: "",
        category: "",
        featured: false,
        image: null
      });

      alert("News article updated successfully!");
    } catch (err) {
      console.error("Error updating news:", err);
      alert(err.message || "Failed to update news article");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm("Are you sure you want to delete this news article?")) {
      return;
    }

    setDeleteLoading(newsId);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${NEWS_API_URL}${newsId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete news: ${response.status}`);
      }

      // Remove the deleted news from the local state
      setNews((prevNews) =>
        prevNews.filter((article) => article.id !== newsId)
      );

      alert("News article deleted successfully!");
    } catch (err) {
      console.error("Error deleting news:", err);
      alert(err.message || "Failed to delete news article");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  return (
    <div className="p-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">News Contributions</h2>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-500 text-center mb-3">{error}</p>
            <button
              onClick={fetchNews}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading news articles...</p>
          </div>
        </div>
      )}

      {/* News List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {news.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">
                No news articles yet
              </div>
              <p className="text-gray-500">
                Start by adding your first news contribution
              </p>
            </div>
          ) : (
            news.map((article) => (
              <div
                key={article.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {editingId === article.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Edit Article
                      </h3>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => handleInputChange("category", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image
                        </label>
                        
                        {/* Current Image Preview */}
                        {article.thumbnail && !editForm.image && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                            <img
                              src={article.thumbnail.startsWith('http') ? article.thumbnail : `https://xyndrix.me${article.thumbnail}`}
                              alt={article.title}
                              className="w-32 h-24 object-cover rounded-lg border"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* New Image Preview */}
                        {editForm.image && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">New Image:</p>
                            <img
                              src={URL.createObjectURL(editForm.image)}
                              alt="Preview"
                              className="w-32 h-24 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {editForm.image && (
                          <p className="text-sm text-gray-500 mt-1">
                            Selected: {editForm.image.name}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content
                        </label>
                        <textarea
                          value={editForm.content}
                          onChange={(e) => handleInputChange("content", e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center">
                        <input
                          type="checkbox"
                          id={`featured-${article.id}`}
                          checked={editForm.featured}
                          onChange={(e) => handleInputChange("featured", e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`featured-${article.id}`} className="ml-2 block text-sm text-gray-700">
                          Featured Article
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(article.id)}
                        disabled={editLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {editLoading ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    {/* Article Image */}
                    {article.thumbnail && (
                      <div className="mb-4">
                        <img
                          src={article.thumbnail.startsWith('http') ? article.thumbnail : `https://xyndrix.me${article.thumbnail}`}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">
                        {article.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          article.status
                        )}`}
                      >
                        {article.status || "draft"}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {article.content ||
                        article.description ||
                        "No content available"}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          {new Date(
                            article.published_on || article.created_at || article.createdAt
                          ).toLocaleDateString()}
                        </div>
                        {(article.status === "published" || !article.status) &&
                          article.views && (
                            <div className="flex items-center gap-1">
                              <Eye size={16} />
                              {article.views} views
                            </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditNews(article)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(article.id)}
                          disabled={deleteLoading === article.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === article.id ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewsContribution;