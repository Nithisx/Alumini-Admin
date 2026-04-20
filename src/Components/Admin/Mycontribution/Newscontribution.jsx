"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import {
  MoreVertical,
  Share2,
  Trash2,
  Edit,
  X,
  Calendar,
  Eye,
  MessageCircle,
  Heart,
  RefreshCw,
  Image, // Add Image icon for placeholder
} from "lucide-react";
import { getMyPosts } from "../../../lib/mypostsCache";

const COLORS = {
  primary: "#059669", // green-600
  text: "#1f2937",
};

const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

// Add PlaceholderImage component
const PlaceholderImage = () => {
  return (
    <div className="relative w-full h-80 bg-gray-100 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
      <div className="text-center">
        <Image size={48} className="text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm font-medium">No Image Available</p>
      </div>
    </div>
  );
};

// ImageSlider component for news with multiple images
const ImageSlider = ({ images, baseUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative mb-6">
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <img
          src={`${baseUrl}${images[activeIndex].image}`}
          alt="News"
          className="w-full h-80 object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              →
            </button>
          </>
        )}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-sm font-medium">
              {activeIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${activeIndex === index
                ? "bg-green-600 scale-110"
                : "bg-gray-300 hover:bg-gray-400"
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EditNewsModal = ({ article, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (article && isOpen) {
      setFormData({
        title: article.title || "",
        content: article.content || article.description || "",
        category: article.category || "",
      });
    }
  }, [article, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(article.id, formData, article);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Edit News</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />

          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <textarea
            rows={6}
            placeholder="Content"
            value={formData.content}
            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-green-600 text-white font-medium disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// NewsItem Component with menu
const NewsItem = ({ item, onDelete, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdate = async (newsId, formData, originalArticle) => {
    setIsUpdating(true);
    try {
      await onUpdate(newsId, formData, originalArticle);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-4">
          {item.user && item.user.profile_photo && (
            <img
              src={
                item.user.profile_photo.startsWith("http")
                  ? item.user.profile_photo
                  : `${MEDIA_BASE_URL}${item.user.profile_photo}`
              }
              alt="Profile"
              className="w-12 h-12 rounded-full bg-gray-200 ring-2 ring-green-100"
            />
          )}
          <div>
            <p className="font-semibold text-gray-900 text-lg">
              {item.user
                ? `${item.user.first_name} ${item.user.last_name}`
                : "Anonymous"}
            </p>
            <p className="text-gray-500 text-sm flex items-center">
              <Calendar size={14} className="mr-1" />
              {new Date(item.posted_on || item.created_at).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </p>
          </div>
        </div>
        <div className="relative">
          {isUpdating && (
            <div className="absolute -left-2 -top-2 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          )}
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} className="text-gray-600" />
          </button>

          {/* Menu Popup */}
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-40 overflow-hidden">
              <button
                className="flex items-center w-full px-4 py-3 text-left hover:bg-green-50 text-green-700 transition-colors duration-200"
                onClick={handleEdit}
              >
                <Edit size={16} className="mr-3" />
                Edit
              </button>
              <button
                className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors duration-200"
                onClick={handleDelete}
              >
                <Trash2 size={16} className="mr-3" />
                Delete
              </button>
              <button
                className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-600 transition-colors duration-200"
                onClick={() => setShowMenu(false)}
              >
                <X size={16} className="mr-3" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-6">
          <h4 className="text-red-800 font-semibold mb-2">
            Delete News Article
          </h4>
          <p className="text-red-700 mb-4">
            Are you sure you want to delete this news article? This action
            cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 font-medium"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* News Content */}
      <div className="px-6">
        {/* Title */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {item.title}
          </h3>
        </div>

        {/* News Images - Always show either images or placeholder */}
        {item.images && item.images.length > 0 ? (
          item.images.length === 1 ? (
            <div className="mb-6">
              <img
                src={`${MEDIA_BASE_URL}${item.images[0].image}`}
                alt="News"
                className="w-full h-80 object-cover rounded-xl shadow-sm"
              />
            </div>
          ) : (
            <ImageSlider images={item.images} baseUrl={BASE_URL} />
          )
        ) : (
          <PlaceholderImage />
        )}

        {/* Content/Description */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed text-base">
            {item.content || item.description || "No content available"}
          </p>
        </div>
      </div>

      <EditNewsModal
        article={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
      />
    </div>
  );
};

const NewsContribution = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Token not found");

      const data = await getMyPosts(token);
      const newsData = data.news || data.results || [];
      setNews(newsData);
    } catch (error) {
      toast.error("Failed to fetch news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  const deleteNews = (newsId) => setConfirmDeleteId(newsId);

  const doDeleteNews = async (newsId) => {
    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Token not found");

      const response = await fetch(`${BASE_URL}/news/${newsId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Failed to delete news: ${response.status}`);

      setNews((prevNews) => prevNews.filter((article) => article.id !== newsId));
      toast.success("News article deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete news article");
    }
  };

  const updateNews = async (newsId, formData, originalArticle) => {
    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Token not found");

      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category || originalArticle.category || "General",
        featured: Boolean(originalArticle.featured),
      };

      const response = await fetch(`${BASE_URL}/news/${newsId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed to update news: ${response.status}`);

      const updatedArticle = await response.json();
      setNews((prevNews) =>
        prevNews.map((article) =>
          article.id === updatedArticle.id ? updatedArticle : article
        )
      );
      toast.success("News article updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update news article");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading your news articles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete News Article"
        message="This will permanently delete this news article."
        danger
        confirmText="Delete"
        onConfirm={() => { doDeleteNews(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {news.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No News Articles Yet
              </h3>
              <p className="text-gray-600">
                You haven't created any news articles yet. Start contributing to
                share important updates!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((article) => (
              <NewsItem
                key={article.id}
                item={article}
                onDelete={deleteNews}
                onUpdate={updateNews}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsContribution;
