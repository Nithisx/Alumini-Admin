import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const BASE_URL = "https://api.karpagamalumni.in";
const API_URL = `${BASE_URL}/api/v1/news/`;
const categories = ["Success Stories", "Events", "Announcements", "Press Release", "Updates"];

export default function EditNewsModal({ show, onClose, onSuccess, newsId }) {
  const [form, setForm] = useState({
    title: "", content: "", category: "Success Stories",
    thumbnail: null, featured: false,
  });
  const [existingThumbnail, setExistingThumbnail] = useState(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const token = localStorage.getItem("Token");

  useEffect(() => {
    if (!show || !newsId) return;
    fetch(`${API_URL}${newsId}/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || "",
          content: data.content || "",
          category: data.category || "Success Stories",
          thumbnail: null,
          featured: data.featured || false,
        });
        setExistingThumbnail(data.thumbnail ? `${BASE_URL}${data.thumbnail}` : null);
        setNewThumbnailPreview(null);
      })
      .catch(() => toast.error("Failed to load news details"));
  }, [show, newsId, token]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file" && name === "thumbnail") {
      const file = files[0];
      setForm((prev) => ({ ...prev, thumbnail: file }));
      if (file) setNewThumbnailPreview(URL.createObjectURL(file));
    } else if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("content", form.content.trim());
      data.append("category", form.category);
      data.append("featured", form.featured);
      if (form.thumbnail) data.append("thumbnail", form.thumbnail);

      const res = await fetch(`${API_URL}${newsId}/`, {
        method: "PUT",
        headers: { Authorization: `Token ${token}` },
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || "Failed to update news");

      toast.success("News updated successfully!");
      onSuccess(json);
    } catch (err) {
      setSubmitError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    setNewThumbnailPreview(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div
        role="dialog" aria-modal="true"
        className="bg-white rounded-t-3xl sm:rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 relative"
      >
        <button onClick={handleClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
          aria-label="Close">×</button>
        <h2 className="text-xl font-bold mb-4">Edit News</h2>

        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="News title" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows={5} required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="News content" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={form.category} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
            {(newThumbnailPreview || existingThumbnail) && (
              <div className="mb-2">
                <img src={newThumbnailPreview || existingThumbnail}
                  alt="Thumbnail" className="h-24 w-auto rounded border" />
                {newThumbnailPreview && (
                  <p className="text-xs text-green-600 mt-1">New thumbnail selected</p>
                )}
              </div>
            )}
            <input type="file" name="thumbnail" onChange={handleChange} accept="image/*"
              className="w-full p-2 border rounded" />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="edit-featured" name="featured"
              checked={form.featured} onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="edit-featured" className="ml-2 text-sm text-gray-900">Featured post</label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={handleClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
