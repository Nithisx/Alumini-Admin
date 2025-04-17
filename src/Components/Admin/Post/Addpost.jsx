import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faUserCircle,
  faMapMarkerAlt,
  faBuilding,
  faBriefcase,
  faMoneyBillWave,
  faClock,
  faHeart,
  faComment,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faPlus,
  faImage,
  faFileAlt,
  faTimesCircle,
  faTimes,
  faUpload,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://134.209.157.195:8000/jobs/";

// Helper to get the token
const getAuthToken = async () => {
  const token = localStorage.getItem("Token");
  return token;
};

// Format date to a more readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Image Gallery Component
const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Fix for image paths that might be relative
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://134.209.157.195:8000${imagePath}`;
  };

  return (
    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden my-3">
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
                className={`h-2 w-2 mx-1 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                onClick={() => setCurrentIndex(idx)}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Comment Section Component
const CommentSection = ({ comments, totalComments }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!comments || comments.length === 0) return null;
  
  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-700">Comments ({totalComments})</h4>
        {totalComments > 2 && (
          <button 
            className="text-green-600 text-sm font-medium"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "View all"}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {(isExpanded ? comments : comments.slice(0, 2)).map(comment => (
          <div key={comment.id} className="flex space-x-2">
            <div className="flex-shrink-0">
              {comment.user.profile_photo ? (
                <img 
                  src={comment.user.profile_photo} 
                  alt={`${comment.user.first_name}'s avatar`}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 bg-gray-50 p-2 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800">
                  {comment.user.first_name} {comment.user.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-gray-700">{comment.comment}</p>
            </div>
          </div>
        ))}
      </div>
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
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts", err);
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
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        console.error("Error deleting post");
      }
    } catch (error) {
      console.error("Error deleting post", error);
    }
  };
  
  // Handle drop zone events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFile = (file) => {
    // Check if file is an image
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: URL.createObjectURL(file),
        size: (file.size / 1024 / 1024).toFixed(2) // Convert to MB
      });
    } else {
      alert("Please upload only image files.");
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Add new post to state
      setPosts([response.data, ...posts]);
      
      // Close modal and reset form
      closeModal();
      
    } catch (error) {
      console.error("Error creating post:", error);
      setError(error.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-green-600">Jobs Feed</h2>
          <div className="h-1 w-20 bg-green-600 mt-2 rounded"></div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">No job posts available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition"
              >
                {/* Header with user info and actions */}
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="flex items-center space-x-3">
                    {post.user?.profile_photo ? (
                      <img
                        src={post.user.profile_photo}
                        alt={`${post.user.first_name}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faUserCircle}
                        className="w-10 h-10 text-gray-400"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-800">
                        {post.user?.first_name} {post.user?.last_name}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                        <span>{formatDate(post.posted_on)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-full transition"
                      title="Delete job post"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                
                {/* Green colored tag at top of content */}
                <div className="bg-green-600 h-1 w-full"></div>
                
                {/* Job info */}
                <div className="p-4">
                  {/* Company and Role */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-green-600">{post.role}</h3>
                    <div className="flex items-center text-gray-700 mt-1">
                      <FontAwesomeIcon icon={faBuilding} className="mr-2 text-green-600" />
                      <span>{post.company_name}</span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-green-600" />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-green-600" />
                      <span>{post.salary_range || "Not specified"}</span>
                    </div>
                    <div className="flex items-center col-span-2">
                      <FontAwesomeIcon icon={faClock} className="mr-2 text-green-600" />
                      <span className="capitalize">{post.job_type || "Not specified"}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4">{post.description}</p>

                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <ImageGallery images={post.images} />
                  )}

                  {/* Reactions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <button className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition">
                      <FontAwesomeIcon 
                        icon={faHeart} 
                        className={post.reaction?.like > 0 ? "text-red-500" : "text-gray-500"} 
                      />
                      <span>{post.reaction?.like || 0} likes</span>
                    </button>
                    
                    <button className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition">
                      <FontAwesomeIcon icon={faComment} className="text-gray-500" />
                      <span>{post.total_comments || 0} comments</span>
                    </button>
                  </div>

                  {/* Comments */}
                  <CommentSection 
                    comments={post.comments} 
                    totalComments={post.total_comments} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add post floating button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg 
                 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                 flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-green-600">Create New Job Post</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role/Position *
                    </label>
                    <input
                      type="text"
                      id="role"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter job role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      id="salary"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="E.g., 25K-30K"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type
                    </label>
                    <select
                      id="jobType"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="3"
                      placeholder="Write a description for the job..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* File Upload Section */}
                  <div className="md:col-span-2">
                    {!uploadedFile ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                  ${isDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-3 bg-gray-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faUpload} className="text-xl text-green-500" />
                          </div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Drop image to upload</h4>
                          <p className="text-xs text-gray-500 mb-2">or click to browse</p>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <FontAwesomeIcon icon={faImage} className="text-green-500 mr-1" />
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
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700 text-sm">Uploaded Image</h4>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="relative mr-3">
                            <img 
                              src={uploadedFile.preview} 
                              alt="Preview" 
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{uploadedFile.name}</p>
                            <p className="text-xs text-gray-500">{uploadedFile.size} MB</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg
                            hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                            flex items-center justify-center min-w-[80px]
                            ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    "Post Job"
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

export default JobFeed;