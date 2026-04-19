import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import axios from "axios";
import { Calendar, Image, Eye, Edit, Trash2, Save, X, Upload } from "lucide-react";

const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

const AlbumsContribution = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [editCoverImage, setEditCoverImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const token = localStorage.getItem("Token");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/myposts/`, { headers: { Authorization: `Token ${token}` } });
        setAlbums(res.data.albums || []);
        setError(null);
      } catch { setError("Failed to load albums."); } finally { setLoading(false); }
    })();
  }, []);

  const doDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/albums/${id}/`, { headers: { Authorization: `Token ${token}` } });
      setAlbums((p) => p.filter((a) => a.id !== id));
      toast.success("Album deleted!");
    } catch { toast.error("Failed to delete album."); }
  };

  const handleEditClick = (album) => {
    setEditingAlbum(album.id);
    setEditFormData({ title: album.title, description: album.description || "" });
    setEditCoverImage(null);
  };

  const handleEditSave = async (id) => {
    if (!editFormData.title.trim()) { toast.error("Title is required."); return; }
    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", editFormData.title);
      fd.append("description", editFormData.description);
      if (editCoverImage) fd.append("cover_image", editCoverImage);
      const res = await axios.put(`${BASE_URL}/albums/${id}/`, fd, { headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" } });
      setAlbums((p) => p.map((a) => a.id === id ? res.data : a));
      setEditingAlbum(null);
      toast.success("Album updated!");
    } catch { toast.error("Failed to update album."); } finally { setEditLoading(false); }
  };

  const fmt = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse overflow-hidden">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-1.5"><div className="h-3 bg-gray-200 rounded w-2/3" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <p className="text-red-500 font-medium">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl">Retry</button>
    </div>
  );

  if (albums.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <Image className="w-8 h-8 text-emerald-300" />
      </div>
      <p className="text-gray-500 font-medium">No albums yet</p>
      <p className="text-gray-400 text-sm mt-1 text-center">Your album contributions will appear here.</p>
    </div>
  );

  return (
    <div className="p-4">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Album"
        message="This will permanently delete the album and all its contents."
        danger confirmText="Delete"
        onConfirm={() => { doDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <p className="text-xs text-gray-400 mb-3"><span className="font-bold text-gray-700">{albums.length}</span> albums</p>

      <div className="grid grid-cols-2 gap-3">
        {albums.map((album) => (
          <div key={album.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Cover */}
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {album.cover_image ? (
                <img src={`${MEDIA_BASE_URL}${album.cover_image}`} alt={album.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                  <Image className="w-8 h-8 text-emerald-300" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-3">
              {editingAlbum === album.id ? (
                <div className="space-y-2">
                  <input type="text" value={editFormData.title}
                    onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Album title"
                    className="w-full bg-gray-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  <textarea value={editFormData.description} rows={2}
                    onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    className="w-full bg-gray-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer bg-gray-50 rounded-xl px-3 py-1.5 border border-dashed border-gray-200 hover:border-emerald-400 transition-colors">
                    <Upload className="w-3 h-3" />
                    {editCoverImage ? editCoverImage.name.slice(0, 15) + "…" : "Change cover"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditCoverImage(e.target.files[0])} />
                  </label>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEditSave(album.id)} disabled={editLoading}
                      className="flex-1 py-1.5 text-xs bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
                      <Save className="w-3 h-3" />{editLoading ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingAlbum(null)} disabled={editLoading}
                      className="flex-1 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-1">
                      <X className="w-3 h-3" />Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xs font-bold text-gray-900 truncate mb-0.5">{album.title}</h3>
                  {album.description && <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{album.description}</p>}
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                    <Calendar className="w-3 h-3" />{fmt(album.posted_on)}
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={() => window.location.href = `/alumni/albums/${album.id}`}
                      className="flex-1 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />View
                    </button>
                    <button onClick={() => handleEditClick(album)}
                      className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(album.id)}
                      className="w-7 h-7 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumsContribution;
