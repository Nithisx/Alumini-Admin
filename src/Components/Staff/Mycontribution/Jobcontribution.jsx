"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MoreVertical,
  MapPin,
  Share2,
  Trash2,
  Edit,
  X,
  Save,
  Upload,
  Calendar,
  DollarSign,
  Users,
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

// ImageSlider component
const ImageSlider = ({ images }) => {
  const [idx, setIdx] = useState(0);
  return (
    // Removed 'aspect-video', added 'max-h-[80vh]' and flexbox centering
    <div className="relative w-full bg-gray-100 max-h-[80vh] flex items-center justify-center overflow-hidden">
      <img 
        src={`${MEDIA_BASE_URL}${images[idx].image}`} 
        alt="Job" 
        // Changed 'h-full object-cover' to 'max-h-[80vh] object-contain'
        className="w-full max-h-[80vh] object-contain" 
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

// JobItem Component with menu
const JobItem = ({ item, onDelete, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  const handleUpdate = async (jobId, updatedFields) => {
    setIsUpdating(true);
    try {
      await onUpdate(jobId, updatedFields);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-4">
          {item.user.profile_photo && (
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
              {item.user.first_name} {item.user.last_name}
            </p>
            <p className="text-gray-500 text-sm flex items-center">
              <Calendar size={14} className="mr-1" />
              {new Date(item.posted_on).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
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
          <h4 className="text-red-800 font-semibold mb-2">Delete Job Post</h4>
          <p className="text-red-700 mb-4">
            Are you sure you want to delete this job post? This action cannot be
            undone.
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

      {/* Job Content */}
      <div className="px-6">
        {/* Company Name & Role */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {item.company_name}
          </h3>
          <div className="flex items-center text-green-600 mb-2">
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <span className="font-medium">{item.role}</span>
            </div>
            <span className="mx-3 text-gray-400">•</span>
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-1" />
              <span>{item.location}</span>
            </div>
          </div>
        </div>

        {/* Job Images - Always show either images or placeholder */}
        {item.images && item.images.length > 0 ? (
          item.images.length === 1 ? (
            <div className="mb-6">
              <img
                src={`${MEDIA_BASE_URL}${item.images[0].image}`}
                alt="Job"
                className="w-full h-80 object-cover rounded-xl shadow-sm"
              />
            </div>
          ) : (
            <ImageSlider images={item.images} baseUrl={BASE_URL} />
          )
        ) : (
          <PlaceholderImage />
        )}

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed text-base">
            {item.description}
          </p>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center bg-green-50 p-4 rounded-xl">
            <DollarSign size={20} className="text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Salary Range</p>
              <p className="font-semibold text-gray-900">{item.salary_range}</p>
            </div>
          </div>
          <div className="flex items-center bg-blue-50 p-4 rounded-xl">
            <Users size={20} className="text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Job Type</p>
              <p className="font-semibold text-gray-900">{item.job_type}</p>
            </div>
          </div>
        </div>
      </div>

      <EditJobModal
        job={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
      />
    </div>
  );
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Token not found");

      const data = await getMyPosts(token);
      setJobs(data.jobs || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const deleteJob = async (jobId) => {
    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Token not found");

      const response = await fetch(`${BASE_URL}/jobs/${jobId}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete");

      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
    } catch (error) {
      toast.error("Failed to delete job. Please try again.");
    }
  };

  const updateJob = async (jobId, updatedFields) => {
    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Token not found");

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

      const response = await fetch(`${BASE_URL}/jobs/${jobId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: payload,
      });

      if (!response.ok) throw new Error("Failed to update");

      const updatedJob = await response.json();
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                ...updatedJob,
                images: updatedJob.images ?? job.images,
              }
            : job
        )
      );
      toast.success("Job updated successfully");
    } catch (error) {
      toast.error("Failed to update job. Please try again.");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your job posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Job Posts Yet
              </h3>
              <p className="text-gray-600">
                You haven't created any job posts yet. Start contributing to
                help others find opportunities!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <JobItem
                key={job.id}
                item={job}
                onDelete={deleteJob}
                onUpdate={updateJob}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
