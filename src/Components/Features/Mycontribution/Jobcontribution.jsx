import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MoreHorizontal, MapPin, Trash2, Edit, X, Save, Upload, Calendar, DollarSign,
  Briefcase, ChevronLeft, ChevronRight, Users, Eye,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContributionsStore, useJobsStore } from "../../../stores";
import { ViewStats, LikesList } from "../../Shared/EngagementStats";
import { DocumentList } from "../../Shared/DocumentPreview";
import JobStatusTag from "../../Shared/JobStatusTag";
import { API_ORIGIN } from "../../../config/api";

const MEDIA_BASE_URL = API_ORIGIN;

const ImageSlider = ({ images }) => {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative w-full bg-gray-100 flex items-center justify-center overflow-hidden">
      <img
        src={`${MEDIA_BASE_URL}${images[idx].image}`}
        alt="Job"
        className="w-full max-h-[60vh] sm:max-h-[55vh] object-contain"
      />
      
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

const normalizeComparable = (value) =>
  value === null || value === undefined ? "" : String(value);

const EditJobModal = ({ job, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    company_name: "",
    role: "",
    location: "",
    salary_range: "",
    job_type: "",
    description: "",
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      setFormData({
        company_name: job.company_name || "",
        role: job.role || "",
        location: job.location || "",
        salary_range: job.salary_range || "",
        job_type: job.job_type || "",
        description: job.description || "",
      });
      setExistingImages(job.images || []);
      setNewImages([]);
      setImagesToDelete([]);
    }
  }, [job, isOpen]);

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
      await onSave(job.id, {
        values: formData,
        original: job,
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
          <h3 className="text-lg font-semibold text-gray-900">Edit Job</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company name"
              value={formData.company_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Role"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Salary range"
              value={formData.salary_range}
              onChange={(e) => setFormData((prev) => ({ ...prev, salary_range: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Job type"
              value={formData.job_type}
              onChange={(e) => setFormData((prev) => ({ ...prev, job_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent md:col-span-2"
            />
          </div>

          <textarea
            rows={4}
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                      alt="Job"
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
              className="flex-1 py-2.5 px-4 rounded-lg bg-green-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={submitting}
            >
              <Save size={16} />
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const JobCard = ({ item, onDelete, onUpdate, onStatusChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try { await onDelete(item.id); } finally { setDeleting(false); setConfirmDelete(false); }
  };

  const handleUpdate = async (jobId, updatedFields) => {
    setIsUpdating(true);
    try {
      await onUpdate(jobId, updatedFields);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  return (
    <div className="bg-white border border-gray-100 h rounded-2xl shadow-sm overflow-hidden">
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
              {new Date(item.posted_on).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
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
        <ImageSlider images={item.images} />
      )}

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-gray-900">{item.company_name}</h3>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">{item.role}</span>
          <JobStatusTag
            status={item.status}
            jobId={item.id}
            canManage
            onChange={(next) => onStatusChange?.(item.id, next)}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {item.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />{item.location}</span>}
          {item.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-500" />{item.salary_range}</span>}
          {item.job_type && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-emerald-500" />{item.job_type}</span>}
        </div>
        {item.description && <p className="text-xs text-gray-600 line-clamp-3">{item.description}</p>}
      </div>

      <DocumentList documents={item.documents} />

      <ViewStats
        contentType="jobs"
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

      <EditJobModal
        job={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
      />
    </div>
  );
};

const Jobs = observer(() => {
  const contributions = useContributionsStore();
  const jobsStore = useJobsStore();
  const jobs = contributions.jobs;
  const loading = contributions.loading;

  useEffect(() => {
    // A load failure leaves the list empty — the empty state covers it.
    contributions.load().catch(() => {});
  }, [contributions]);

  const deleteJob = async (id) => {
    try {
      await jobsStore.remove(id);
      contributions.removeLocal("jobs", id);
      toast.success("Job deleted!");
    } catch { toast.error("Failed to delete job."); }
  };

  const updateJob = async (jobId, updatedFields) => {
    try {
      const { values, original, newImages, imagesToDelete } = updatedFields;
      const payload = new FormData();

      const fieldKeys = [
        "company_name",
        "role",
        "location",
        "salary_range",
        "job_type",
        "description",
      ];

      fieldKeys.forEach((key) => {
        const nextValue = normalizeComparable(values?.[key]);
        const previousValue = normalizeComparable(original?.[key]);
        if (nextValue !== previousValue) {
          payload.append(key, values[key] ?? "");
        }
      });

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

      const updatedJob = await jobsStore.update(jobId, payload);
      const existing = jobs.find((j) => String(j.id) === String(jobId));
      contributions.replaceLocal("jobs", jobId, {
        ...existing,
        ...updatedJob,
        images: updatedJob.images ?? existing?.images,
      });
      toast.success("Job updated successfully");
    } catch (error) {
      toast.error("Failed to update job. Please try again.");
      throw error;
    }
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
    <div className="space-y-3 p-0">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          item={job}
          onDelete={deleteJob}
          onUpdate={updateJob}
          onStatusChange={(id, next) =>
            setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: next } : j)))
          }
        />
      ))}
    </div>
  );
});

export default Jobs;
