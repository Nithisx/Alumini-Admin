import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import EngagementPanel from "../../Shared/EngagementPanel";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faUserCircle,
  faMapMarkerAlt,
  faBuilding,
  faBriefcase,
  faMoneyBillWave,
  faClock,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faPlus,
  faImage,
  faTimesCircle,
  faTimes,
  faUpload,
  faSpinner,
  faEllipsisV,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "https://api.karpagamalumni.in/api/v1/jobs/";

// Helper to get the token
const getAuthToken = async () => {
  const token = localStorage.getItem("Token");
  return token;
};

// Format date to a more readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Fix for profile photo paths that might be relative
const getProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return "";
  if (photoPath.startsWith("http")) return photoPath;
  return `https://api.karpagamalumni.in${photoPath}`;
};

const normalizeJobsList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.jobs)) return payload.jobs;
  return [];
};

const normalizeCreatedJob = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload.job || payload.data || payload.result || payload;
};

// Image Gallery Component
const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://api.karpagamalumni.in${imagePath}`;
  };

  return (
    <div className="relative w-full bg-black overflow-hidden" style={{ maxHeight: "500px" }}>
      <img
        src={getImageUrl(images[currentIndex].image)}
        alt={`Job image ${currentIndex + 1}`}
        className="w-full object-contain"
        style={{ maxHeight: "500px" }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 mx-1 rounded-full cursor-pointer ${idx === currentIndex ? "bg-white" : "bg-gray-400"
                  }`}
                onClick={() => setCurrentIndex(idx)}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Job Card Component — social feed style (full-width, like Facebook/Instagram)
const JobCard = ({ post, onRequestDelete, onRequestEdit, currentUserId, canModerate }) => {
  const isOwn = post.user?.id === currentUserId;
  const canDelete = isOwn || canModerate;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with user info + 3-dots menu */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {post.user?.profile_photo ? (
            <img
              src={getProfilePhotoUrl(post.user.profile_photo)}
              alt={`${post.user.first_name}'s avatar`}
              className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faUserCircle} className="w-6 h-6 text-green-600" />
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">
              {post.user?.first_name} {post.user?.last_name}
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-0.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
              {formatDate(post.posted_on)}
            </div>
          </div>
        </div>
        {canDelete && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded w-8 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faEllipsisV} className="text-sm" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                <button
                  onClick={() => { setMenuOpen(false); onRequestEdit(post); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition"
                >
                  <FontAwesomeIcon icon={faEdit} className="text-xs" /> Edit
                </button>
                <button
                  onClick={() => { onRequestDelete(post.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
                </button>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job content body */}
      <div className="px-4 pb-3">
        <h3 className="text-base font-bold text-gray-900 mb-0.5">{post.role}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faBuilding} className="text-green-600 text-xs" />
            {post.company_name}
          </span>
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600 text-xs" />
            {post.location}
          </span>
          {post.salary_range && (
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 text-xs" />
              {post.salary_range}
            </span>
          )}
          {post.job_type && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium capitalize">
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              {post.job_type}
            </span>
          )}
        </div>
        {post.description && (
          <p className="text-gray-700 text-sm leading-relaxed">{post.description}</p>
        )}
      </div>

      {/* Full-width image */}
      <ImageGallery images={post.images || []} />

      {/* Engagement: like / comment / share */}
      <EngagementPanel
        contentType="jobs"
        contentId={post.id}
        postOwnerId={post.user?.id ?? null}
        canModerate={canModerate}
        currentUserId={currentUserId}
      />
    </div>
  );
};

const JobFeed = () => {
  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [canModerate, setCanModerate] = useState(false);

  // Modal and file upload states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Edit modal state
  const [editingJob, setEditingJob] = useState(null);
  const [editUploadedFile, setEditUploadedFile] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSalaryRange, setEditSalaryRange] = useState("");
  const [editJobType, setEditJobType] = useState("");
  const [editError, setEditError] = useState("");

  // Form field states
  const [description, setDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [jobType, setJobType] = useState("");
  const [error, setError] = useState("");

  // Fetch posts from backend
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Token ${token}` : "",
        },
      });
      const data = await response.json();
      setPosts(normalizeJobsList(data));
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const token = localStorage.getItem("Token");
    if (token) {
      fetch("https://api.karpagamalumni.in/api/v1/profile/", {
        headers: { Authorization: `Token ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          setCurrentUserId(d.id);
          const role = (d.role || "").toLowerCase();
          setCanModerate(d.is_staff || role === "admin" || role === "staff");
        })
        .catch(() => {});
    }
  }, []);

  // Open edit modal
  const openEditModal = (job) => {
    setEditingJob(job);
    setEditDescription(job.description || "");
    setEditCompanyName(job.company_name || "");
    setEditRole(job.role || "");
    setEditLocation(job.location || "");
    setEditSalaryRange(job.salary_range || "");
    setEditJobType(job.job_type || "");
    setEditUploadedFile(null);
    setEditError("");
  };

  const closeEditModal = () => {
    if (editUploadedFile?.preview) URL.revokeObjectURL(editUploadedFile.preview);
    setEditingJob(null);
    setEditUploadedFile(null);
    setEditError("");
  };

  const handleEditFileSelect = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) return;
      if (editUploadedFile?.preview) URL.revokeObjectURL(editUploadedFile.preview);
      setEditUploadedFile({ file, name: file.name, preview: URL.createObjectURL(file) });
    }
  };

  const handleEditSubmit = async () => {
    if (!editCompanyName || !editRole || !editLocation) {
      setEditError("Company name, role, and location are required.");
      return;
    }
    setIsSubmitting(true);
    setEditError("");
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append("description", editDescription);
      formData.append("company_name", editCompanyName);
      formData.append("role", editRole);
      formData.append("location", editLocation);
      formData.append("salary_range", editSalaryRange);
      formData.append("job_type", editJobType);
      if (editUploadedFile) formData.append("images", editUploadedFile.file);

      const response = await fetch(`${API_URL}${editingJob.id}/`, {
        method: "PUT",
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPosts((prev) => prev.map((p) => (p.id === editingJob.id ? data : p)));
      closeEditModal();
    } catch (err) {
      setEditError(err.message || "Failed to update. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a post
  const deletePost = async (postId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}${postId}/`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Token ${token}` : "",
        },
      });
      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      } else {
        toast.error("Failed to delete post. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to delete post. Please try again.");
    }
  };

  // Handle drop zone events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  const handleFile = (file) => {
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: URL.createObjectURL(file),
        size: (file.size / 1024 / 1024).toFixed(2),
      });
    } else {
      toast.success("Please upload only image files.");
    }
  };
  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
  };

  // Reset form fields
  const resetForm = () => {
    setDescription("");
    setCompanyName("");
    setRole("");
    setLocation("");
    setSalaryRange("");
    setJobType("");
    removeFile();
    setError("");
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Simple validation
    if (!companyName || !role || !location) {
      setError("Company name, role, and location are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      formData.append("description", description);
      formData.append("company_name", companyName);
      formData.append("role", role);
      formData.append("location", location);
      formData.append("salary_range", salaryRange);
      formData.append("job_type", jobType);

      if (uploadedFile) {
        formData.append("images", uploadedFile.file);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const createdJob = normalizeCreatedJob(data);
      if (createdJob) {
        setPosts((prevPosts) => [createdJob, ...prevPosts]);
      } else {
        await fetchJobs();
      }
      closeModal();
    } catch (error) {
      setError(
        error.message || "Failed to create post. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-20 lg:pb-6">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Job Post"
        message="This will permanently delete this job post."
        danger
        confirmText="Delete"
        onConfirm={() => { deletePost(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Two-column layout: feed + sidebar */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Main feed column */}
        <div className="w-full lg:flex-1 min-w-0">
          {/* Create post prompt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faUserCircle} className="text-green-600 text-lg" />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 text-sm transition-colors"
            >
              Share a job opportunity...
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Post
            </button>
          </div>

          {/* Posts feed */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-green-600"></div>
                <p className="text-gray-500 text-sm">Loading jobs...</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faBriefcase} className="text-xl text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Jobs Yet</h3>
              <p className="text-gray-500 text-sm mb-4">Be the first to share a job opportunity!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Post a Job
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <JobCard
                  key={post.id}
                  post={post}
                  onRequestDelete={setConfirmDeleteId}
                  onRequestEdit={openEditModal}
                  currentUserId={currentUserId}
                  canModerate={canModerate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4 sticky top-20 self-start">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Job Feed</h3>
            <p className="text-xs text-gray-500">Browse and share career opportunities with the alumni community.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Quick Actions</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Post a Job
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-job-title"
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100">
              <h3 id="add-job-title" className="text-2xl font-bold text-green-700">
                Create New Job Post
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div>
              <div className="p-4 sm:p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="company"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="role"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Role/Position *
                    </label>
                    <input
                      type="text"
                      id="role"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter job role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="salary"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Salary Range
                    </label>
                    <input
                      type="text"
                      id="salary"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="E.g., 25K-30K"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="jobType"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Job Type
                    </label>
                    <select
                      id="jobType"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                    >
                      <option value="">Select a job type</option>
                      <option value="fulltime">Full Time</option>
                      <option value="parttime">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="description"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      rows="4"
                      placeholder="Write a description for the job..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* File Upload Section */}
                  <div className="md:col-span-2">
                    {!uploadedFile ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                                  ${isDragging
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                          }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-4 bg-green-100 p-4 rounded-full">
                            <FontAwesomeIcon
                              icon={faUpload}
                              className="text-2xl text-green-600"
                            />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">
                            Drop image to upload
                          </h4>
                          <p className="text-sm text-gray-500 mb-3">
                            or click to browse
                          </p>

                          <div className="flex items-center text-sm text-gray-500">
                            <FontAwesomeIcon
                              icon={faImage}
                              className="text-green-500 mr-2"
                            />
                            <span>Supported formats: JPG, PNG, GIF</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-700">
                            Uploaded Image
                          </h4>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700 w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </div>

                        <div className="flex items-center">
                          <div className="relative mr-4">
                            <img
                              src={uploadedFile.preview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-gray-800 truncate">
                              {uploadedFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {uploadedFile.size} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={`px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg
                            hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                            flex items-center justify-center min-w-[120px] transition-all duration-200
                            ${isSubmitting
                      ? "opacity-75 cursor-not-allowed"
                      : ""
                    }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin mr-2"
                      />
                      Posting...
                    </>
                  ) : (
                    "Post Job"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-2xl font-bold text-blue-700">Edit Job Post</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-sm">{editError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} placeholder="Company name" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role/Position *</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="Job role" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salary Range</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editSalaryRange} onChange={(e) => setEditSalaryRange(e.target.value)} placeholder="E.g., 25K-30K" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Job Type</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editJobType} onChange={(e) => setEditJobType(e.target.value)}>
                    <option value="">Select a job type</option>
                    <option value="fulltime">Full Time</option>
                    <option value="parttime">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"
                    value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Job description" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Replace Image (optional)</label>
                  {editUploadedFile ? (
                    <div className="border rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                      <img src={editUploadedFile.preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{editUploadedFile.name}</span>
                      <button type="button" onClick={() => { URL.revokeObjectURL(editUploadedFile.preview); setEditUploadedFile(null); }}
                        className="text-red-500 hover:text-red-700">
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => editFileInputRef.current.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-4 text-center cursor-pointer">
                      <FontAwesomeIcon icon={faUpload} className="text-xl text-gray-400 mb-1" />
                      <p className="text-sm text-gray-500">Click to upload new image</p>
                      <input type="file" className="hidden" ref={editFileInputRef}
                        onChange={handleEditFileSelect} accept="image/*" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end gap-4">
              <button onClick={closeEditModal} className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" disabled={isSubmitting}>
                Cancel
              </button>
              <button onClick={handleEditSubmit} disabled={isSubmitting}
                className={`px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}>
                {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom styles for line clamp */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default JobFeed;
