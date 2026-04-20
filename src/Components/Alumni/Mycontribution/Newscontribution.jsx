import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { MoreHorizontal, Trash2, Edit, X, Calendar, Newspaper, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { getMyPosts } from "../../../lib/mypostsCache";

const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

const ImageSlider = ({ images }) => {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative w-full aspect-video bg-gray-100">
      <img src={`${MEDIA_BASE_URL}${images[idx].image}`} alt="News" className="w-full h-full object-cover" />
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
              {new Date(item.posted_on || item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
      {item.images && item.images.length > 0 ? (
        <ImageSlider images={item.images} />
      ) : (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-gray-300" />
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3 space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
        {(item.content || item.description) && (
          <p className="text-xs text-gray-600 line-clamp-3">{item.content || item.description}</p>
        )}
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("Token");
        const data = await getMyPosts(token);
        setNews(data.news || data.results || []);
      } catch { toast.error("Failed to fetch news."); } finally { setLoading(false); }
    })();
  }, []);

  const doDeleteNews = async (id) => {
    try {
      const token = localStorage.getItem("Token");
      const res = await fetch(`${BASE_URL}/news/${id}/`, { method: "DELETE", headers: { Authorization: `Token ${token}` } });
      if (!res.ok) throw new Error();
      setNews((p) => p.filter((a) => a.id !== id));
      toast.success("News article deleted!");
    } catch { toast.error("Failed to delete news article."); }
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
};

export default NewsContribution;
