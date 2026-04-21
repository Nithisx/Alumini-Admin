import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder, faFolderOpen, faPlus, faTimes, faTrash, faImage,
  faCheck, faSpinner, faSearch, faEllipsisV, faEdit, faCalendarAlt,
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
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [editUploadedFile, setEditUploadedFile] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("Token");
        const [albumsRes, profileRes] = await Promise.all([
          axios.get("https://api.karpagamalumni.in/api/v1/albums/", {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get("https://api.karpagamalumni.in/api/v1/profile/", {
            headers: { Authorization: `Token ${token}` },
          }),
        ]);
        setAlbums(Array.isArray(albumsRes.data) ? albumsRes.data : []);
        if (profileRes.data?.id) setCurrentUserId(profileRes.data.id);
      } catch {
        toast.error("Could not load albums.");
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = (album) => {
    const ownerId = album.created_by ?? album.owner ?? album.user?.id ?? album.user_id;
    return currentUserId && ownerId && currentUserId === parseInt(ownerId, 10);
  };

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

  const openEditModal = (album) => {
    setEditingAlbum(album);
    setEditFormData({ title: album.title || "", description: album.description || "" });
    setEditUploadedFile(null);
    setOpenMenuId(null);
  };

  const handleEditFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      if (editUploadedFile?.preview) URL.revokeObjectURL(editUploadedFile.preview);
      setEditUploadedFile({ file, name: file.name, preview: URL.createObjectURL(file) });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.title.trim()) { toast.error("Please enter a title."); return; }
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("Token");
      const payload = new FormData();
      payload.append("title", editFormData.title);
      payload.append("description", editFormData.description);
      if (editUploadedFile) payload.append("cover_image", editUploadedFile.file, editUploadedFile.name);
      const r = await axios.put(`https://api.karpagamalumni.in/api/v1/albums/${editingAlbum.id}/`, payload, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" },
      });
      setAlbums((prev) => prev.map((a) => a.id === editingAlbum.id ? r.data : a));
      setEditingAlbum(null);
      setEditUploadedFile(null);
      toast.success("Album updated!");
    } catch { toast.error("Could not update album."); }
    finally { setIsSavingEdit(false); }
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

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

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
        <div className="max-w-3xl mx-auto px-4 py-3">
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

      <div className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((album) => {
              const canManage = isOwner(album);
              return (
                <div
                  key={album.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    onClick={() => navigate(`/alumni/albums/${album.id}`)}
                    className="relative aspect-[4/3] cursor-pointer group overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100"
                  >
                    {album.cover_image ? (
                      <img
                        src={`https://api.karpagamalumni.in${album.cover_image}`}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faFolder} className="text-5xl text-amber-300" />
                      </div>
                    )}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex items-center justify-between px-3 py-2">
                    <div
                      onClick={() => navigate(`/alumni/albums/${album.id}`)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">{album.title}</p>
                      {album.posted_on && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
                          {fmt(album.posted_on)}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div
                        className="relative flex-shrink-0 ml-1"
                        ref={openMenuId === album.id ? menuRef : null}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setOpenMenuId(openMenuId === album.id ? null : album.id)}
                          className="w-7 h-7 text-gray-400 hover:text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                        >
                          <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
                        </button>
                        {openMenuId === album.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                            <button
                              onClick={() => openEditModal(album)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-xs" /> Edit
                            </button>
                            <button
                              onClick={() => { setConfirmDelete(album.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
                            </button>
                            <button
                              onClick={() => setOpenMenuId(null)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Album Modal ── */}
      {editingAlbum && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true"
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Album</h3>
              <button onClick={() => { setEditingAlbum(null); setEditUploadedFile(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <input type="text" value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Album title"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                disabled={isSavingEdit} />
              <textarea value={editFormData.description} rows={3}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                disabled={isSavingEdit} />

              {editUploadedFile ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={editUploadedFile.preview} alt="Preview" className="w-full h-40 object-cover" />
                  <button type="button" onClick={() => { URL.revokeObjectURL(editUploadedFile.preview); setEditUploadedFile(null); }}
                    disabled={isSavingEdit}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                </div>
              ) : editingAlbum.cover_image ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current cover</p>
                  <img src={`https://api.karpagamalumni.in${editingAlbum.cover_image}`}
                    alt="Current cover" className="w-full h-32 object-cover rounded-xl" />
                  <label className="mt-2 flex flex-col items-center justify-center h-10 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition text-xs text-gray-400">
                    Replace cover photo
                    <input type="file" accept="image/*" onChange={handleEditFileSelect} className="sr-only" disabled={isSavingEdit} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                  <FontAwesomeIcon icon={faImage} className="text-gray-300 text-2xl mb-2" />
                  <span className="text-sm text-gray-400">Tap to add cover photo</span>
                  <input type="file" accept="image/*" onChange={handleEditFileSelect} className="sr-only" disabled={isSavingEdit} />
                </label>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setEditingAlbum(null); setEditUploadedFile(null); }}
                  disabled={isSavingEdit}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingEdit}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {isSavingEdit ? (
                    <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Saving…</>
                  ) : (
                    <><FontAwesomeIcon icon={faCheck} /> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Album Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div
            role="dialog" aria-modal="true"
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
