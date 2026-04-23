import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MoreHorizontal, MapPin, Clock, Trash2, X, Heart, MessageCircle,
  Calendar, Eye, ChevronLeft, ChevronRight, Edit, Upload, Save, Plus,
} from "lucide-react";
import { getMyPosts } from "../../../lib/mypostsCache";

const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

const ImageSlider = ({ images }) => {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative w-full aspect-video bg-gray-100">
      <img src={`${MEDIA_BASE_URL}${images[idx].image}`} alt="Event" className="w-full h-full object-cover" />
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

const EditEventModal = ({ event, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({ title: "", description: "", venue: "", tag: "", from_date_time: "", end_date_time: "" });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      setFormData({ title: event.title || "", description: event.description || "", venue: event.venue || "", tag: event.tag || "", from_date_time: event.from_date_time?.slice(0, 16) || "", end_date_time: event.end_date_time?.slice(0, 16) || "" });
      setExistingImages(event.images || []);
      setNewImages([]);
      setImagesToDelete([]);
    }
  }, [event, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("Token");
      const fd = new FormData();
      Object.keys(formData).forEach((k) => fd.append(k, formData[k]));
      newImages.forEach((img) => fd.append("images", img));
      imagesToDelete.forEach((id) => fd.append("delete_images", id));
      const res = await fetch(`${BASE_URL}/events/${event.id}/`, { method: "PUT", headers: { Authorization: `Token ${token}` }, body: fd });
      if (!res.ok) throw new Error();
      onUpdate(await res.json());
      onClose();
    } catch { toast.error("Failed to update event."); } finally { setSubmitting(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Edit className="w-4 h-4 text-emerald-600" /> Edit Event</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[["title", "Event Title"], ["venue", "Venue"], ["tag", "Tag"]].map(([name, label]) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
              <input type="text" value={formData[name]} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))}
                className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" required />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["from_date_time", "Start"], ["end_date_time", "End"]].map(([name, label]) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type="datetime-local" value={formData[name]} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))}
                  className="w-full bg-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300" required />
              </div>
            ))}
          </div>
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Current Images</p>
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={`${MEDIA_BASE_URL}${img.image}`} alt="" className="w-full h-20 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setImagesToDelete((p) => [...p, img.id]); setExistingImages((p) => p.filter((x) => x.id !== img.id)); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Add Images</p>
            {newImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {newImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full h-20 object-cover rounded-xl" />
                    <button type="button" onClick={() => setNewImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Click to upload</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setNewImages((p) => [...p, ...Array.from(e.target.files)])} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl font-semibold">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 text-sm bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventCard = ({ item, onDelete, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const fmt = (d) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const rel = (d) => { const h = Math.floor((Date.now() - new Date(d)) / 3600000); return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; };

  const doDelete = async () => {
    setDeleting(true);
    try { await onDelete(item.id); } finally { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {item.user_data?.profile_photo ? (
              <img src={item.user_data.profile_photo.startsWith("http") ? item.user_data.profile_photo : `${MEDIA_BASE_URL}${item.user_data.profile_photo}`}
                alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-bold text-sm">{item.user_data?.first_name?.[0]}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900">{item.user_data?.first_name} {item.user_data?.last_name}</p>
              <p className="text-xs text-gray-400">{rel(item.uploaded_on)}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 w-40 overflow-hidden py-1">
                <button onClick={() => { setShowMenu(false); setShowEdit(true); }}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { setShowMenu(false); setConfirmDelete(true); }}
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
          item.images.length === 1 ? (
            <div className="w-full aspect-video"><img src={`${MEDIA_BASE_URL}${item.images[0].image}`} alt="" className="w-full h-full object-cover" /></div>
          ) : <ImageSlider images={item.images} />
        )}

        {/* Content */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Calendar className="w-3 h-3" />{item.tag}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {item.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />{item.venue}</span>}
            {item.from_date_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500" />{fmt(item.from_date_time)}</span>}
          </div>
          {item.description && <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>}

          {/* Actions */}
          {(item.total_reactions !== undefined || item.total_comments !== undefined) && (
            <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
              {item.total_reactions !== undefined && (
                <span className="flex items-center gap-1 text-xs text-gray-500"><Heart className="w-4 h-4" />{item.total_reactions}</span>
              )}
              {item.total_comments !== undefined && (
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageCircle className="w-4 h-4" />{item.total_comments}
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          {showComments && item.comments?.length > 0 && (
            <div className="space-y-2 pt-2 max-h-40 overflow-y-auto">
              {item.comments.map((c) => (
                <div key={c.id} className="flex gap-2 bg-gray-50 rounded-xl p-2.5">
                  {c.user?.profile_photo ? (
                    <img src={c.user.profile_photo.startsWith("http") ? c.user.profile_photo : `${MEDIA_BASE_URL}${c.user.profile_photo}`} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-emerald-700">{c.user?.first_name?.[0]}</span></div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-800">{c.user?.first_name} {c.user?.last_name}</p>
                    <p className="text-xs text-gray-600">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm font-semibold text-red-800 mb-1">Delete this event?</p>
            <p className="text-xs text-red-600 mb-3">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 font-medium">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="flex-1 py-1.5 text-sm bg-red-600 text-white rounded-xl font-medium disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>

      <EditEventModal event={item} isOpen={showEdit} onClose={() => setShowEdit(false)} onUpdate={onUpdate} />
    </>
  );
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("Token");
        const data = await getMyPosts(token);
        setEvents(data.events || data.posts || []);
      } catch { toast.error("Failed to fetch events."); } finally { setLoading(false); }
    })();
  }, []);

  const deleteEvent = async (id) => {
    const token = localStorage.getItem("Token");
    const res = await fetch(`${BASE_URL}/events/${id}`, { method: "DELETE", headers: { Authorization: `Token ${token}` } });
    if (!res.ok) { toast.error("Failed to delete event."); return; }
    setEvents((p) => p.filter((e) => e.id !== id));
  };

  const updateEvent = (updated) => setEvents((p) => p.map((e) => e.id === updated.id ? updated : e));

  if (loading) return (
    <div className="space-y-3 p-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 p-4"><div className="w-9 h-9 bg-gray-200 rounded-full" /><div className="flex-1 space-y-1"><div className="h-3 bg-gray-200 rounded w-1/3" /></div></div>
          <div className="w-full aspect-video bg-gray-200" />
          <div className="p-4 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
        </div>
      ))}
    </div>
  );

  if (events.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-emerald-300" />
      </div>
      <p className="text-gray-500 font-medium">No events yet</p>
      <p className="text-gray-400 text-sm mt-1 text-center">Your event contributions will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3 p-4">
      {events.map((event) => <EventCard key={event.id} item={event} onDelete={deleteEvent} onUpdate={updateEvent} />)}
    </div>
  );
};

export default Events;
