import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

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

  if (!images || images.length === 0)
    return (
      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden my-3 flex items-center justify-center">
        {/* Placeholder image or icon */}
        <FontAwesomeIcon icon={faImage} className="text-5xl text-gray-300" />
      </div>
    );

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  // Fix for image paths that might be relative
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://api.karpagamalumni.in/api/v1${imagePath}`;
  };

  return (
    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden my-3">
      <img
        src={getImageUrl(images[currentIndex].image)}
        alt={`Job image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
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

// Job Card Component
const JobCard = ({ post, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this job post?")) {
      setIsDeleting(true);
      await onDelete(post.id);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >


      {/* Header with user info */}
      <div className="p-4 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {post.user?.profile_photo ? (
            <img
              src={getProfilePhotoUrl(post.user.profile_photo)}
              alt={`${post.user.first_name}'s avatar`}
              className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faUserCircle}
                className="w-6 h-6 text-green-600"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold text-gray-800 text-sm">
              {post.user?.first_name} {post.user?.last_name}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className="mr-1"
              />
              <span>{formatDate(post.posted_on)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Content */}
      <div className="p-4">
        {/* Company and Role */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
            {post.role}
          </h3>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <FontAwesomeIcon
              icon={faBuilding}
              className="mr-2 text-green-600 flex-shrink-0"
            />
            <span className="truncate">{post.company_name}</span>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              className="mr-2 text-green-600 w-4 flex-shrink-0"
            />
            <span className="truncate">{post.location}</span>
          </div>

          {post.salary_range && (
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon
                icon={faMoneyBillWave}
                className="mr-2 text-green-600 w-4 flex-shrink-0"
              />
              <span className="truncate">{post.salary_range}</span>
            </div>
          )}

          {post.job_type && (
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon
                icon={faClock}
                className="mr-2 text-green-600 w-4 flex-shrink-0"
              />
              <span className="capitalize truncate">{post.job_type}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {post.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {post.description}
          </p>
        )}

        {/* Images - Always render ImageGallery to show placeholder when no images */}
        <ImageGallery images={post.images || []} />
      </div>

      {/* Bottom border accent */}
      <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
    </div>
  );
};

const JobFeed = () => {
  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal and file upload states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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
  }, []);

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
    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Feed</h1>
          <p className="text-gray-600 mb-4">Discover amazing career opportunities</p>
          <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-green-600 mx-auto rounded-full"></div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl shadow-lg text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faBriefcase} className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Yet</h3>
            <p className="text-gray-600 mb-6">Be the first to post a job opportunity!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Post First Job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <JobCard
                key={post.id}
                post={post}
                onDelete={deletePost}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Post Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-2xl 
                 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300
                 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-job-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100">
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
              <div className="p-6">
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

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
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