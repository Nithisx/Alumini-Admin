import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MoreHorizontal, MapPin, Trash2, X, Calendar, DollarSign,
  Briefcase, ChevronLeft, ChevronRight, Image as ImageIcon, Users,
} from "lucide-react";

const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

const ImageSlider = ({ images }) => {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative w-full aspect-video bg-gray-100">
      <img src={`${MEDIA_BASE_URL}${images[idx].image}`} alt="Job" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const JobCard = ({ item, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try { await onDelete(item.id); } finally { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Post header */}
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
            <p className="text-sm font-bold text-gray-900">{item.user?.first_name} {item.user?.last_name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.posted_on).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 w-36 overflow-hidden py-1">
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
      {item.images && item.images.length > 0 ? (
        <ImageSlider images={item.images} />
      ) : (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-gray-300" />
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-gray-900">{item.company_name}</h3>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">{item.role}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {item.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />{item.location}</span>}
          {item.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-500" />{item.salary_range}</span>}
          {item.job_type && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-emerald-500" />{item.job_type}</span>}
        </div>
        {item.description && <p className="text-xs text-gray-600 line-clamp-3">{item.description}</p>}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm font-semibold text-red-800 mb-1">Delete this job post?</p>
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
  );
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("Token");
        const res = await fetch(`${BASE_URL}/myposts/`, { headers: { Authorization: `Token ${token}` } });
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  const deleteJob = async (id) => {
    const token = localStorage.getItem("Token");
    const res = await fetch(`${BASE_URL}/jobs/${id}/`, { method: "DELETE", headers: { Authorization: `Token ${token}` } });
    if (!res.ok) { toast.error("Failed to delete job."); return; }
    setJobs((p) => p.filter((j) => j.id !== id));
    toast.success("Job deleted!");
  };

  if (loading) return (
    <div className="space-y-3 p-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 p-4"><div className="w-9 h-9 bg-gray-200 rounded-full" /><div className="flex-1 space-y-1"><div className="h-3 bg-gray-200 rounded w-1/3" /><div className="h-2 bg-gray-100 rounded w-1/4" /></div></div>
          <div className="w-full aspect-video bg-gray-200" />
          <div className="p-4 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/2" /><div className="h-2 bg-gray-100 rounded w-3/4" /></div>
        </div>
      ))}
    </div>
  );

  if (jobs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-emerald-300" />
      </div>
      <p className="text-gray-500 font-medium">No job posts yet</p>
      <p className="text-gray-400 text-sm mt-1 text-center">Your job contributions will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3 p-4">
      {jobs.map((job) => <JobCard key={job.id} item={job} onDelete={deleteJob} />)}
    </div>
  );
};

export default Jobs;
