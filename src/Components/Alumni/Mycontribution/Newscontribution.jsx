"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Eye,
  AlertCircle,
  Loader,
  Edit,
  X,
  Save,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle2,
  Info,
  Image as ImageIcon,
  Star,
  Clock,
  Tag,
  FileText,
  Upload
} from "lucide-react";

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

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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

      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("content", editForm.content);
      formData.append("category", editForm.category);
      formData.append("featured", editForm.featured);
      
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

      setNews((prevNews) =>
        prevNews.map((article) =>
          article.id === articleId ? updatedArticle : article
        )
      );

      setEditingId(null);
      setEditForm({
        title: "",
        content: "",
        category: "",
        featured: false,
        image: null
      });

      showToast("success", "Article updated successfully!");
    } catch (err) {
      console.error("Error updating news:", err);
      showToast("error", err.message || "Failed to update article");
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

      setNews((prevNews) =>
        prevNews.filter((article) => article.id !== newsId)
      );

      showToast("success", "Article deleted successfully!");
    } catch (err) {
      console.error("Error deleting news:", err);
      showToast("error", err.message || "Failed to delete article");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
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

  // Process news for search/filter/sort
  const processedNews = useMemo(() => {
    let filtered = [...news];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(searchLower) ||
        article.content?.toLowerCase().includes(searchLower) ||
        article.category?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(article => 
        (article.status || "draft") === statusFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "title") {
        const aTitle = (a.title || "").toLowerCase();
        const bTitle = (b.title || "").toLowerCase();
        return sortDir === "asc" 
          ? aTitle.localeCompare(bTitle)
          : bTitle.localeCompare(aTitle);
      } else {
        const aDate = new Date(a.published_on || a.created_at || a.createdAt || 0);
        const bDate = new Date(b.published_on || b.created_at || b.createdAt || 0);
        return sortDir === "asc" ? aDate - bDate : bDate - aDate;
      }
    });

    return filtered;
  }, [news, search, statusFilter, sortBy, sortDir]);

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 max-w-md px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : toast.type === "error"
            ? "bg-red-50 text-red-800 border-red-200"
            : "bg-blue-50 text-blue-800 border-blue-200"
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === "success" && <CheckCircle2 size={20} className="text-emerald-600" />}
            {toast.type === "error" && <AlertCircle size={20} className="text-red-600" />}
            {toast.type === "info" && <Info size={20} className="text-blue-600" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
          

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchNews}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* News Grid */}
        {!isLoading && !error && (
          <>
            {processedNews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {news.length === 0 ? "No articles yet" : "No matching articles"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {news.length === 0 
                    ? "Create your first news article to get started" 
                    : "Try adjusting your search or filters"
                  }
                </p>
                {news.length === 0 && (
                  <button
                    onClick={handleAddNews}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <Plus size={20} />
                    Create Article
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedNews.map((article) => (
                  <div
                    key={article.id}
                    id={`article-${article.id}`}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                  >
                    {editingId === article.id ? (
                      /* Edit Mode */
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900">Edit Article</h3>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => handleInputChange("title", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter article title..."
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              value={editForm.category}
                              onChange={(e) => handleInputChange("category", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter category..."
                            />
                          </div>

                          {/* Image Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Thumbnail Image
                            </label>
                            
                            {/* Current Image Preview */}
                            {article.thumbnail && !editForm.image && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-2">Current image:</p>
                                <img
                                  src={article.thumbnail.startsWith('http') ? article.thumbnail : `https://xyndrix.me${article.thumbnail}`}
                                  alt={article.title}
                                  className="w-full h-32 object-cover rounded-lg border"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* New Image Preview */}
                            {editForm.image && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-2">New image:</p>
                                <img
                                  src={URL.createObjectURL(editForm.image)}
                                  alt="Preview"
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              </div>
                            )}
                            
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                id={`image-${article.id}`}
                              />
                              <label
                                htmlFor={`image-${article.id}`}
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors"
                              >
                                <Upload size={20} />
                                {editForm.image ? editForm.image.name : "Choose new image"}
                              </label>
                            </div>
                          </div>

                          {/* Content */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Content
                            </label>
                            <textarea
                              value={editForm.content}
                              onChange={(e) => handleInputChange("content", e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="Write your article content..."
                            />
                          </div>

                          {/* Featured Toggle */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`featured-${article.id}`}
                              checked={editForm.featured}
                              onChange={(e) => handleInputChange("featured", e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`featured-${article.id}`} className="ml-2 flex items-center gap-1 text-sm text-gray-700">
                              <Star size={16} className="text-yellow-500" />
                              Featured Article
                            </label>
                          </div>
                        </div>

                        {/* Action Buttons - Sticky */}
                        <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t border-gray-200 -mx-6 px-6 -mb-6 pb-6">
                          <div className="flex gap-3">
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(article.id)}
                              disabled={editLoading}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        {/* Article Image */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {article.thumbnail ? (
                            <img
                              src={article.thumbnail.startsWith('http') ? article.thumbnail : `https://xyndrix.me${article.thumbnail}`}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwVjE1MEgyMjVWMTAwSDE3NVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTE1MCA3NUMyMjUgNzUgMjUwIDEwMCAyNTAgMTc1QzI1MCAyMjUgMjI1IDI1MCAyMDAgMjUwSDE1MEM3NSAyNTAgNTAgMjI1IDUwIDE3NUM1MCAxMDAgNzUgNzUgMTUwIDc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon size={32} className="text-gray-400" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(article.status)}`}>
                              {article.status || "draft"}
                            </span>
                          </div>

                          {/* Featured Badge */}
                          {article.featured && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <Star size={12} />
                                Featured
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          {/* Category */}
                          {article.category && (
                            <div className="flex items-center gap-1 mb-2">
                              <Tag size={14} className="text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">{article.category}</span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {article.title}
                          </h3>

                          {/* Content Preview */}
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                            {article.content || article.description || "No content available"}
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(
                                  article.published_on || article.created_at || article.createdAt
                                ).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              {(article.status === "published" || !article.status) && article.views && (
                                <div className="flex items-center gap-1">
                                  <Eye size={14} />
                                  {article.views}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditNews(article)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit article"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteNews(article.id)}
                                disabled={deleteLoading === article.id}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete article"
                              >
                                {deleteLoading === article.id ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsContribution;
