import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen, faPlus, faTimes, faTrash, faImage,
  faCheck, faSpinner, faSearch,
} from "@fortawesome/free-solid-svg-icons";

const AlbumsPage = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("Token");
        const r = await axios.get("https://api.karpagamalumni.in/api/v1/albums/", {
          headers: { Authorization: `Token ${token}` },
        });
        setAlbums(Array.isArray(r.data) ? r.data : []);
      } catch {
        toast.error("Could not load albums.");
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const doDeleteAlbum = async (id) => {
    try {
      const token = localStorage.getItem("Token");
      await axios.delete(`https://api.karpagamalumni.in/api/v1/albums/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      toast.success("Album deleted!");
    } catch { toast.error("Could not delete album."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Please enter a title."); return; }
    setIsCreating(true);
    try {
      const token = localStorage.getItem("Token");
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      if (uploadedFile) payload.append("cover_image", uploadedFile.file, uploadedFile.name);
      const r = await axios.post("https://api.karpagamalumni.in/api/v1/albums/", payload, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" },
      });
      setAlbums((prev) => [r.data, ...prev]);
      setIsModalOpen(false);
      setFormData({ title: "", description: "" });
      setUploadedFile(null);
      toast.success("Album created!");
    } catch { toast.error("Could not create album."); }
    finally { setIsCreating(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setUploadedFile({ file, name: file.name, preview: URL.createObjectURL(file) });
    } else { toast.error("Please upload an image file."); }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
  };

  const filtered = searchTerm
    ? albums.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : albums;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Album"
        message="This will permanently delete the album and all its contents."
        danger confirmText="Delete"
        onConfirm={() => { doDeleteAlbum(confirmDelete); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-900 flex-shrink-0">Albums</h1>
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search albums…"
                className="w-full bg-gray-100 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faFolderOpen} className="text-5xl text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">{searchTerm ? "No albums match your search" : "No albums yet"}</p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Create First Album
              </button>
            )}
          </div>
        ) : (
          /* Instagram-style square grid */
          <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
            {filtered.map((album) => (
              <div
                key={album.id}
                onClick={() => navigate(`/alumni/albums/${album.id}`)}
                className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100"
              >
                {album.cover_image ? (
                  <img
                    src={`https://api.karpagamalumni.in${album.cover_image}`}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FontAwesomeIcon icon={faImage} className="text-gray-300 text-2xl" />
                  </div>
                )}
                {/* Hover overlay with title + delete */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-white text-xs font-semibold text-center truncate w-full">{album.title}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(album.id); }}
                    className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-white text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Album Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div
            role="dialog" aria-modal="true"
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">New Album</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Album title"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                disabled={isCreating}
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Description (optional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                disabled={isCreating}
              />

              {/* Cover image upload */}
              {uploadedFile ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={uploadedFile.preview} alt="Preview" className="w-full h-40 object-cover" />
                  <button type="button" onClick={removeFile} disabled={isCreating}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                  <FontAwesomeIcon icon={faImage} className="text-gray-300 text-2xl mb-2" />
                  <span className="text-sm text-gray-400">Tap to add cover photo</span>
                  <input id="file-upload" type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" disabled={isCreating} />
                </label>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isCreating}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {isCreating ? (
                    <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Creating…</>
                  ) : (
                    <><FontAwesomeIcon icon={faCheck} /> Create Album</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumsPage;
