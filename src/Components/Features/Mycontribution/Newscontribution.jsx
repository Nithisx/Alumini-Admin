import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { MoreHorizontal, Trash2, Edit, X, Upload, Calendar, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContributionsStore, useNewsStore } from "../../../stores";
import { ViewStats, LikesList } from "../../Shared/EngagementStats";
import { API_ORIGIN } from "../../../config/api";

const MEDIA_BASE_URL = API_ORIGIN;

const ImageSlider = ({ images }) => {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative w-full bg-gray-100 flex items-center justify-center overflow-hidden">
      <img src={`${MEDIA_BASE_URL}${images[idx].image}`} alt="News" className="w-full max-h-[60vh] sm:max-h-[55vh] object-contain" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`} />)}
          </div>
        </>
      )}
    </div>
  );
};

const normalizeComparable = (value) =>
  value === null || value === undefined ? "" : String(value);

const EditNewsModal = ({ article, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (article && isOpen) {
      setFormData({
        title: article.title || "",
        content: article.content || article.description || "",
        category: article.category || "",
      });
      setExistingImages(article.images || []);
      setNewImages([]);
      setImagesToDelete([]);
    }
  }, [article, isOpen]);

  const removeExistingImage = (imageId) => {
    setImagesToDelete((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(article.id, {
        values: formData,
        original: article,
        newImages,
        imagesToDelete,
      });
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
          />

          {existingImages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Current Images</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={`${MEDIA_BASE_URL}${img.image}`}
                      alt="News"
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newImages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">New Images</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {newImages.map((img, index) => (
                  <div key={`${img.name}-${index}`} className="relative group">
                    <img
                      src={URL.createObjectURL(img)}
                      alt="New"
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-green-500 transition-colors text-sm text-gray-600">
            <Upload size={16} />
            Add or Replace Images
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  setNewImages((prev) => [...prev, ...files]);
                }
                e.target.value = "";
              }}
            />
          </label>

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

const NewsCard = ({ item, onDelete, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {item.user?.profile_photo ? (
            <img src={item.user.profile_photo.startsWith("http") ? item.user.profile_photo : `${MEDIA_BASE_URL}${item.user.profile_photo}`}
              alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-sm">{item.user?.first_name?.[0]}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{item.user ? `${item.user.first_name} ${item.user.last_name}` : "Anonymous"}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.posted_on || item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="relative">
          {isUpdating && (
            <div className="absolute -left-2 -top-2 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          )}
          <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 w-40 overflow-hidden py-1">
              <button onClick={handleEdit}
                className="flex items-center w-full px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 gap-2">
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => { setShowMenu(false); onDelete(item.id); }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setShowMenu(false)}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      {item.images && item.images.length > 0 && (
        <ImageSlider images={item.images} />
      )}

      {/* Content */}
      <div className="px-4 py-3 space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
        {(item.content || item.description) && (
          <p className="text-xs text-gray-600 line-clamp-3">{item.content || item.description}</p>
        )}
      </div>

      <ViewStats
        contentType="news"
        contentId={item.id}
        totalViews={item.total_views}
        uniqueViewers={item.unique_viewers}
        recentViewers={item.recent_viewers}
      />

      <LikesList
        totalLikes={item.total_likes}
        likers={item.likers}
        recentLikers={item.recent_likers}
      />

      <EditNewsModal
        article={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
      />
    </div>
  );
};

const NewsContribution = observer(() => {
  const contributions = useContributionsStore();
  const newsStore = useNewsStore();
  const news = contributions.news;
  const loading = contributions.loading;
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    contributions.load().catch(() => toast.error("Failed to fetch news."));
  }, [contributions]);

  const doDeleteNews = async (id) => {
    try {
      await newsStore.remove(id);
      contributions.removeLocal("news", id);
      toast.success("News article deleted!");
    } catch { toast.error("Failed to delete news article."); }
  };

  const updateNews = async (newsId, payloadData) => {
    try {
      const { values, original, newImages, imagesToDelete } = payloadData;
      const payload = new FormData();

      const nextTitle = normalizeComparable(values?.title);
      const prevTitle = normalizeComparable(original?.title);
      if (nextTitle !== prevTitle) {
        payload.append("title", values.title ?? "");
      }

      const nextContent = normalizeComparable(values?.content);
      const prevContent = normalizeComparable(original?.content ?? original?.description);
      if (nextContent !== prevContent) {
        payload.append("content", values.content ?? "");
      }

      const nextCategory = normalizeComparable(values?.category);
      const prevCategory = normalizeComparable(original?.category);
      if (nextCategory !== prevCategory) {
        payload.append("category", values.category ?? "");
      }

      (newImages || []).forEach((image) => {
        payload.append("images", image);
      });

      (imagesToDelete || []).forEach((imageId) => {
        payload.append("delete_images", imageId);
      });

      if ([...payload.keys()].length === 0) {
        toast.info("No changes to update");
        return;
      }

      const updatedArticle = await newsStore.update(newsId, payload);
      const existing = news.find((a) => String(a.id) === String(newsId));
      contributions.replaceLocal("news", newsId, {
        ...existing,
        ...updatedArticle,
        images: updatedArticle.images ?? existing?.images,
      });
      toast.success("News article updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update news article");
      throw error;
    }
  };

  if (loading) return (
    <div className="space-y-3 p-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 p-4"><div className="w-9 h-9 bg-gray-200 rounded-full" /><div className="flex-1 space-y-1"><div className="h-3 bg-gray-200 rounded w-1/3" /><div className="h-2 bg-gray-100 rounded w-1/4" /></div></div>
          <div className="w-full aspect-video bg-gray-200" />
          <div className="p-4 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
        </div>
      ))}
    </div>
  );

  if (news.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <Newspaper className="w-8 h-8 text-emerald-300" />
      </div>
      <p className="text-gray-500 font-medium">No news articles yet</p>
      <p className="text-gray-400 text-sm mt-1 text-center">Your news contributions will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3 p-4">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete News Article"
        message="This will permanently delete this news article."
        danger confirmText="Delete"
        onConfirm={() => { doDeleteNews(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      {news.map((article) => (
        <NewsCard
          key={article.id}
          item={article}
          onDelete={setConfirmDeleteId}
          onUpdate={updateNews}
        />
      ))}
    </div>
  );
});

export default NewsContribution;
