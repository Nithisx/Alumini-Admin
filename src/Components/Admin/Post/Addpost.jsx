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
  faFilePdf,
  faVideo,
  faFile,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://134.209.157.195:8000/jobs/";

const getAuthToken = async () => {
  const token = localStorage.getItem("Token");
  return token;
};

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("post"); // "post" or "brochure"

  // Job post form state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [newPostDescription, setNewPostDescription] = useState("");
  const [newPostCompany, setNewPostCompany] = useState("");
  const [newPostRole, setNewPostRole] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostSalary, setNewPostSalary] = useState("");
  const [newPostType, setNewPostType] = useState("");
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  // Brochure upload state
  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [brochureFile, setBrochureFile] = useState(null);
  const [isBrochureUploading, setIsBrochureUploading] = useState(false);
  const [brochureError, setBrochureError] = useState("");
  const brochureInputRef = useRef(null);

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
        throw new Error(
          `Failed to fetch posts: ${response.statusText} (${response.status})`
        );
      }

      const data = await response.json();
      const sortedData = data.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
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
  }, []);

  // Job post file handlers
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

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const fileType = file.type;
    if (fileType.startsWith("image/") || fileType === "application/pdf") {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: fileType.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
      setSelectedImage(file);
      setSelectedImageName(file.name);
    } else {
      alert("Please upload only images or PDF files.");
    }
  };

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

  // Brochure file handlers
  const handleBrochureDragOver = (e) => {
    e.preventDefault();
    setIsBrochureDragging(true);
  };

  const handleBrochureDragLeave = () => {
    setIsBrochureDragging(false);
  };

  const handleBrochureDrop = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBrochureFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrochureFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleBrochureFile(e.target.files[0]);
    }
  };

  const handleBrochureFile = (file) => {
    const fileType = file.type;
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");
    const isPDF = fileType === "application/pdf";

    if (isImage || isVideo || isPDF) {
      const fileInfo = {
        file,
        name: file.name,
        type: fileType,
        size: (file.size / 1024 / 1024).toFixed(2),
      };

      if (isImage) {
        fileInfo.preview = URL.createObjectURL(file);
        fileInfo.fileIcon = faImage;
        fileInfo.fileIconColor = "text-green-500";
        fileInfo.bgColor = "bg-green-100";
      } else if (isVideo) {
        fileInfo.fileIcon = faVideo;
        fileInfo.fileIconColor = "text-blue-500";
        fileInfo.bgColor = "bg-blue-100";
      } else if (isPDF) {
        fileInfo.fileIcon = faFilePdf;
        fileInfo.fileIconColor = "text-red-500";
        fileInfo.bgColor = "bg-red-100";
      }

      setBrochureFile(fileInfo);
      setBrochureError("");
    } else {
      setBrochureError("Please upload only images, videos, or PDF files.");
    }
  };

  const removeBrochureFile = () => {
    if (brochureFile?.preview) {
      URL.revokeObjectURL(brochureFile.preview);
    }
    setBrochureFile(null);
    setBrochureError("");
    if (brochureInputRef.current) {
      brochureInputRef.current.value = "";
    }
  };

  const handleBrochureUpload = async () => {
    if (!brochureFile) {
      setBrochureError("Please select a file to upload.");
      return;
    }

    setIsBrochureUploading(true);
    setBrochureError("");

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      const fileType = brochureFile.type;

      let endpoint = API_URL;

      if (fileType.startsWith("image/")) {
        formData.append("image", brochureFile.file);
      } else if (fileType.startsWith("video/")) {
        formData.append("video", brochureFile.file);
      } else if (fileType === "application/pdf") {
        formData.append("brochure", brochureFile.file);
      }

      formData.append("name", brochureFile.name);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("File uploaded successfully!");
        removeBrochureFile();
        closeModal();
        fetchJobs(); // Refresh the posts
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setBrochureError(
        error.message || "Failed to upload file. Please try again."
      );
    } finally {
      setIsBrochureUploading(false);
    }
  };

  const closeModal = () => {
    setIsMainModalOpen(false);
    setActiveTab("post");
    removeBrochureFile();
    setBrochureError("");
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
  };

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
    }

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

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
      closeModal();
      alert("Post created successfully!");
    } catch (error) {
      console.error("Error submitting post:", error);
      let errorMessage = "Failed to submit post. Please try again.";
      if (error.response) {
        errorMessage = `Server Error: ${error.response.status}. ${
          JSON.stringify(error.response.data) || error.response.statusText
        }`;
      } else if (error.request) {
        errorMessage = "Network error. Could not reach server.";
      } else {
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
      } else {
        const errorData = await response.text();
        throw new Error(
          `Failed to delete post: ${response.statusText} (${response.status})`
        );
      }
    } catch (error) {
      console.error("Error during delete operation:", error);
      setError(error.message || "Failed to delete post. Please try again.");
    }
  };

  const getFileTypeName = (file) => {
    if (!file) return "";

    if (file.type.startsWith("image/")) return "Image";
    if (file.type.startsWith("video/")) return "Video";
    if (file.type === "application/pdf") return "PDF";

    return "File";
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="container lg:mx-[240px]  p-4 md:p-4 max-w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Admin Job Feed
        </h2>

        {/* Posts List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Posted Jobs
          </h3>
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No job posts available yet.
            </p>
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
                      alt={`${post.user.username || "Admin"}'s avatar`}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUserCircle}
                      className="w-10 h-10 text-gray-400 mr-3"
                    />
                  )}
                  <div>
                    <span className="font-semibold text-gray-800">
                      {post.user?.username || "Admin"}
                    </span>
                    {post.created_at && (
                      <p className="text-xs text-gray-500">
                        Posted on:{" "}
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-600 focus:outline-none p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out"
                    aria-label="Delete post"
                    title="Delete post"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2">
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={`Illustration for ${
                        post.company_name || "job post"
                      }`}
                      className="mt-3 mb-4 w-full max-h-60 rounded-lg object-cover border border-gray-200"
                    />
                  )}

                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">
                    {post.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-2">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex">
                        <dt className="font-semibold w-24 shrink-0">
                          Company:
                        </dt>
                        <dd className="text-gray-800">
                          {post.company_name || "N/A"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-semibold w-24 shrink-0">Role:</dt>
                        <dd className="text-gray-800">{post.role || "N/A"}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-semibold w-24 shrink-0">
                          Location:
                        </dt>
                        <dd className="text-gray-800">
                          {post.location || "N/A"}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-semibold w-24 shrink-0">Type:</dt>
                        <dd className="text-gray-800">
                          {post.job_type || "N/A"}
                        </dd>
                      </div>
                      {post.salary_range && (
                        <div className="flex">
                          <dt className="font-semibold w-24 shrink-0">
                            Salary:
                          </dt>
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

      {/* Single Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={() => setIsMainModalOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg
                   hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   flex items-center justify-center transition-all duration-300 hover:scale-110"
          title="Add Content"
        >
          <FontAwesomeIcon icon={faPlus} className="text-2xl" />
        </button>
      </div>

      {/* Combined Modal */}
      {isMainModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Add Content
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              {/* Tab Selector */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("post")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "post"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Create Job Post
                </button>
                <button
                  onClick={() => setActiveTab("brochure")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "brochure"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Upload Files
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Job Post Form */}
              {activeTab === "post" && (
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="companyName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
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
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
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
                        <label
                          htmlFor="salary"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
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

                    <div>
                      <label
                        htmlFor="jobType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
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

                    {!uploadedFile ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                              ${
                                isDragging
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-300 hover:border-blue-400"
                              }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-3 bg-gray-100 p-3 rounded-full">
                            <FontAwesomeIcon
                              icon={faUpload}
                              className="text-2xl text-blue-500"
                            />
                          </div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Drop files to upload
                          </h4>
                          <p className="text-xs text-gray-500 mb-3">
                            or click to browse
                          </p>

                          <div className="flex justify-center space-x-3 text-xs">
                            <div className="flex items-center">
                              <FontAwesomeIcon
                                icon={faImage}
                                className="text-green-500 mr-1"
                              />
                              <span>Images</span>
                            </div>
                            <div className="flex items-center">
                              <FontAwesomeIcon
                                icon={faFileAlt}
                                className="text-red-500 mr-1"
                              />
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
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700">
                            Uploaded File
                          </h4>
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
                                className="w-12 h-12 object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                              <FontAwesomeIcon
                                icon={faFileAlt}
                                className="text-lg text-red-500"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {uploadedFile?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {uploadedFile?.size} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      disabled={isLoadingModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg
                            hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                            flex items-center justify-center min-w-[80px]
                            ${
                              isLoadingModal
                                ? "opacity-75 cursor-not-allowed"
                                : ""
                            }`}
                      disabled={isLoadingModal}
                    >
                      {isLoadingModal ? (
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
                </form>
              )}

              {/* Brochure Upload */}
              {activeTab === "brochure" && (
                <div className="p-6">
                  <div className="mx-auto max-w-md">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FontAwesomeIcon
                            icon={faFile}
                            className="text-2xl text-green-600"
                          />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">
                          Upload Files
                        </h4>
                        <p className="text-gray-600 mt-2">
                          Upload images, videos, or PDF documents
                        </p>
                      </div>

                      {brochureError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                          {brochureError}
                        </div>
                      )}

                      {!brochureFile ? (
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                ${
                                  isBrochureDragging
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-300 hover:border-green-400"
                                }`}
                          onDragOver={handleBrochureDragOver}
                          onDragLeave={handleBrochureDragLeave}
                          onDrop={handleBrochureDrop}
                          onClick={() => brochureInputRef.current.click()}
                        >
                          <div className="flex flex-col items-center">
                            <div className="mb-4 bg-gray-100 p-3 rounded-full">
                              <FontAwesomeIcon
                                icon={faUpload}
                                className="text-2xl text-green-500"
                              />
                            </div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              Drop files here
                            </h4>
                            <p className="text-xs text-gray-500 mb-2">
                              or click to browse
                            </p>

                            <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <FontAwesomeIcon
                                  icon={faImage}
                                  className="text-green-500 mr-1"
                                />
                                <span>Images</span>
                              </div>
                              <span className="mx-1">•</span>
                              <div className="flex items-center">
                                <FontAwesomeIcon
                                  icon={faVideo}
                                  className="text-blue-500 mr-1"
                                />
                                <span>Videos</span>
                              </div>
                              <span className="mx-1">•</span>
                              <div className="flex items-center">
                                <FontAwesomeIcon
                                  icon={faFilePdf}
                                  className="text-red-500 mr-1"
                                />
                                <span>PDF</span>
                              </div>
                            </div>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            ref={brochureInputRef}
                            onChange={handleBrochureFileSelect}
                            accept="image/*,video/*,.pdf,application/pdf"
                          />
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-700">
                              Selected {getFileTypeName(brochureFile)}
                            </h4>
                            <button
                              type="button"
                              onClick={removeBrochureFile}
                              className="text-red-500 hover:text-red-700"
                              disabled={isBrochureUploading}
                            >
                              <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                          </div>

                          <div className="flex items-center">
                            {brochureFile.type.startsWith("image/") ? (
                              <div className="relative mr-3">
                                <img
                                  src={brochureFile.preview}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-16 h-16 ${brochureFile.bgColor} rounded flex items-center justify-center mr-3`}
                              >
                                <FontAwesomeIcon
                                  icon={brochureFile.fileIcon}
                                  className={`${brochureFile.fileIconColor} text-2xl`}
                                />
                              </div>
                            )}

                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {brochureFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {brochureFile.size} MB
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={handleBrochureUpload}
                              className={`px-4 py-2 font-medium text-white bg-green-600 rounded-lg
                                    hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                                    flex items-center justify-center
                                    ${
                                      isBrochureUploading
                                        ? "opacity-75 cursor-not-allowed"
                                        : ""
                                    }`}
                              disabled={isBrochureUploading}
                            >
                              {isBrochureUploading ? (
                                <>
                                  <FontAwesomeIcon
                                    icon={faSpinner}
                                    className="animate-spin mr-2"
                                  />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon
                                    icon={faUpload}
                                    className="mr-2"
                                  />
                                  Upload {getFileTypeName(brochureFile)}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg md:max-w-md md:left-auto">
          <div className="flex items-center">
            <div className="mr-2">
              <FontAwesomeIcon icon={faTimes} className="text-red-500" />
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeed;