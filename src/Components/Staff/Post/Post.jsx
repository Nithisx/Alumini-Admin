import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faUserCircle,
  faSpinner,
  faImage,
  faFileAlt,
  faTimesCircle,
  faTimes,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://209.38.121.118/api/jobs/";

const getAuthToken = async () => {
  const token = localStorage.getItem("Token");
  return token;
};

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // New post form state (moved from Post component)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [newPostDescription, setNewPostDescription] = useState("");
  const [newPostCompany, setNewPostCompany] = useState("");
  const [newPostRole, setNewPostRole] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostSalary, setNewPostSalary] = useState("");
  const [newPostType, setNewPostType] = useState("");
  const [isLoadingModal, setIsLoadingModal] = useState(false); // Loading state for modal submit
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAuthToken();
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Token ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) =>
         new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setPosts(sortedData);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err.message || "Failed to fetch posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    console.log("Fetched posts:", sortedData);
  }, []);

  // Handle drop zone events (moved from Post component)
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

  // Handle file selection (moved from Post component)
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the selected file (moved from Post component)
  const handleFile = (file) => {
    const fileType = file.type;
    if (fileType.startsWith("image/") || fileType === "application/pdf") {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: fileType.startsWith("image/") ? URL.createObjectURL(file) : null,
        size: (file.size / 1024 / 1024).toFixed(2)
      });
      // Also update the image for the actual submit
      setSelectedImage(file);
      setSelectedImageName(file.name);
    } else {
      alert("Please upload only images or PDF files.");
    }
  };

  // Remove uploaded file (moved from Post component)
  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setSelectedImage(null);
    setSelectedImageName("");
    if (document.getElementById("image-upload-modal")) {
      document.getElementById("image-upload-modal").value = "";
    }
  };

  // Handle form submission (moved and adapted from Post component)
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoadingModal(true);
    setError("");

    const token = await getAuthToken();
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setIsLoadingModal(false);
      return;
    }

    const formData = new FormData();
    formData.append("description", newPostDescription);
    formData.append("company_name", newPostCompany);
    formData.append("role", newPostRole);
    formData.append("location", newPostLocation);
    formData.append("salary_range", newPostSalary);
    formData.append("job_type", newPostType);

    if (selectedImage) {
      formData.append("images", selectedImage, selectedImage.name);
      console.log("Appending image:", selectedImage.name);
    } else {
      console.log("No image selected for upload");
    }

    console.log("Submitting new post:", {
      description: newPostDescription,
      company_name: newPostCompany,
      role: newPostRole,
      location: newPostLocation,
      salary_range: newPostSalary,
      job_type: newPostType,
      image: selectedImage ? selectedImage.name : "No image",
    });

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      console.log("Post submission success:", response.data);
      setPosts([response.data, ...posts]);
      setNewPostDescription("");
      setNewPostCompany("");
      setNewPostRole("");
      setNewPostLocation("");
      setNewPostSalary("");
      setNewPostType("");
      setSelectedImage(null);
      setSelectedImageName("");
      setUploadedFile(null);
      if (document.getElementById("image-upload-modal")) {
        document.getElementById("image-upload-modal").value = "";
      }
      setIsLoadingModal(false);
      setIsModalOpen(false);
      alert("Post created successfully!");
    } catch (error) {
      console.error("Error submitting post:", error);
      let errorMessage = "Failed to submit post. Please try again.";
      if (error.response) {
        console.error("Server Error:", error.response.status, error.response.data);
        errorMessage = `Server Error: ${error.response.status}. ${JSON.stringify(error.response.data) || error.response.statusText}`;
      } else if (error.request) {
        console.error("Network Error:", error.request);
        errorMessage = "Network error. Could not reach server.";
      } else {
        console.error("Request Setup Error:", error.message);
        errorMessage = error.message;
      }
      setError(errorMessage);
      setIsLoadingModal(false);
    }
  };

  const deletePost = async (postId) => {
    setError("");
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(`${API_URL}${postId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
        console.log(`Post ${postId} deleted successfully.`);
      } else {
        const errorData = await response.text();
        console.error("Error deleting post:", response.status, errorData);
        throw new Error(`Failed to delete post: ${response.statusText} (${response.status})`);
      }
    } catch (error) {
      console.error("Error during delete operation:", error);
      setError(error.message || "Failed to delete post. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-6 max-w-3xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Admin Job Feed</h2>

    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">Posted Jobs</h3>
      {loading ? (
        <p className="text-center text-gray-500 py-6">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500 py-6">No job posts available yet.</p>
      ) : (
        posts.map((post) => (
          <div
        key={post.id}
        className="bg-white shadow-md rounded-lg p-5 border border-gray-200 relative"
          >
        <div className="flex items-center mb-3">
          {post.user?.avatar ? (
            <img
              src={post.user.avatar}
              alt={`${post.user.username || 'Admin'}'s avatar`}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
          ) : (
            <FontAwesomeIcon
              icon={faUserCircle}
              className="w-10 h-10 text-gray-400 mr-3"
            />
          )}
          <div>
            <span className="font-semibold text-gray-800">{post.user?.username || 'Admin'}</span>
            {post.created_at && (
              <p className="text-xs text-gray-500">
            Posted on: {new Date(post.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={() => deletePost(post.id)}
            className="absolute top-3 right-3 text-gray-400 hover:text-red-600 focus:outline-none p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out"
            aria-label="Delete post"
            title="Delete post"
          >
            <FontAwesomeIcon icon={faTrash} className="w-4 h-4"/>
          </button>
        </div>

        <div className="mt-2">
          {post.images && (
            <img
              src={post.images}
              alt={`Illustration for ${post.company_name || 'job post'}`}
              className="mt-3 mb-4 w-full max-h-60 rounded-lg object-cover border border-gray-200"
            />
          )}

          <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.description}</p>

          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex">
            <dt className="font-semibold w-24 shrink-0">Company:</dt>
            <dd className="text-gray-800">{post.company_name || 'N/A'}</dd>
              </div>
              <div className="flex">
            <dt className="font-semibold w-24 shrink-0">Role:</dt>
            <dd className="text-gray-800">{post.role || 'N/A'}</dd>
              </div>
              <div className="flex">
            <dt className="font-semibold w-24 shrink-0">Location:</dt>
            <dd className="text-gray-800">{post.location || 'N/A'}</dd>
              </div>
              <div className="flex">
            <dt className="font-semibold w-24 shrink-0">Type:</dt>
            <dd className="text-gray-800">{post.job_type || 'N/A'}</dd>
              </div>
              {post.salary_range && (
            <div className="flex">
              <dt className="font-semibold w-24 shrink-0">Salary:</dt>
              <dd className="text-gray-800">{post.salary_range}</dd>
            </div>
              )}
            </dl>
        </div>
          </div>
        </div>
      ))
    )}
      </div>
      </div>

      {/* Add post floating button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg
                   hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>

      {/* Upload Modal (moved from Post component) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Create New Job Post</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                {/* Job Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    id="description"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Describe the job role and responsibilities..."
                    value={newPostDescription}
                    onChange={(e) => setNewPostDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Company & Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newPostCompany}
                      onChange={(e) => setNewPostCompany(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role / Job Title
                    </label>
                    <input
                      id="role"
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newPostRole}
                      onChange={(e) => setNewPostRole(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Location & Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newPostLocation}
                      onChange={(e) => setNewPostLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Range (Optional)
                    </label>
                    <input
                      id="salary"
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newPostSalary}
                      onChange={(e) => setNewPostSalary(e.target.value)}
                    />
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <input
                    id="jobType"
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value)}
                    required
                  />
                </div>

                {/* File Upload Section */}
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 bg-gray-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faUpload} className="text-2xl text-blue-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-700 mb-1">Drop files to upload</h4>
                      <p className="text-sm text-gray-500 mb-4">or click to browse</p>

                      <div className="flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faImage} className="text-green-500 mr-2" />
                          <span>Images</span>
                        </div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faFileAlt} className="text-red-500 mr-2" />
                          <span>PDF</span>
                        </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    id="image-upload-modal"
                  />
                </div>
                ) : (
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Uploaded File</h4>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>

                    <div className="flex items-center">
                      {uploadedFile.preview ? (
                        <div className="relative mr-3">
                          <img
                            src={uploadedFile.preview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-red-500" />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{uploadedFile?.name}</p>
                        <p className="text-xs text-gray-500">{uploadedFile?.size} MB</p>
                      </div>
                    </div>
                </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={isLoadingModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                            flex items-center justify-center min-w-[80px]
                            ${isLoadingModal ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isLoadingModal}
                >
                  {isLoadingModal ? (
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

export default AdminFeed;