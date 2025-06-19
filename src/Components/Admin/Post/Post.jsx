import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
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
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://134.209.157.195/jobs/";

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

  return (
    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden my-3">
      <img
        src={images[currentIndex].image}
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
                className={`h-2 w-2 mx-1 rounded-full ${
                  idx === currentIndex ? "bg-white" : "bg-gray-400"
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

// Comment Section Component
const CommentSection = ({ comments, totalComments }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!comments || comments.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-700">
          Comments ({totalComments})
        </h4>
        {totalComments > 2 && (
          <button
            className="text-blue-600 text-sm font-medium"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "View all"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(isExpanded ? comments : comments.slice(0, 2)).map((comment) => (
          <div key={comment.id} className="flex space-x-2">
            <div className="flex-shrink-0">
              {comment.user.profile_photo ? (
                <img
                  src={comment.user.profile_photo}
                  alt={`${comment.user.first_name}'s avatar`}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUserCircle}
                  className="w-6 h-6 text-gray-400"
                />
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

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  // New post state
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostCompany, setNewPostCompany] = useState("");
  const [newPostRole, setNewPostRole] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostSalary, setNewPostSalary] = useState("");
  const [newPostType, setNewPostType] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
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

  // Handles the submission of a new post
  const handleSubmitPost = async () => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      formData.append("description", newPostCaption || "");
      formData.append("company_name", newPostCompany || "");
      formData.append("role", newPostRole || "");
      formData.append("location", newPostLocation || "");
      formData.append("salary_range", newPostSalary || "");
      formData.append("job_type", newPostType || "");

      if (selectedImage) {
        formData.append("images", selectedImage);
      }

      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: token ? `Token ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });

      setPosts([response.data, ...posts]);
      setShowNewPostForm(false);

      // Clear inputs
      setNewPostCaption("");
      setNewPostCompany("");
      setNewPostRole("");
      setNewPostLocation("");
      setNewPostSalary("");
      setNewPostType("");
      setSelectedImage(null);
    } catch (error) {
      if (error.response) {
        console.error(
          "Server error:",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        console.error("Network error: No response received", error.request);
      } else {
        console.error("Request setup error:", error.message);
      }
      setError(error.message);
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
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        console.error("Error deleting post");
      }
    } catch (error) {
      console.error("Error deleting post", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Jobs Feed</h2>
          <button
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <FontAwesomeIcon icon={showNewPostForm ? faTrash : faPlus} />
            {showNewPostForm ? "Cancel" : "Add Job"}
          </button>
        </div>

        {/* New Post Form */}
        {showNewPostForm && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Create New Job Post
            </h3>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newPostCompany}
                  onChange={(e) => setNewPostCompany(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={newPostRole}
                  onChange={(e) => setNewPostRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Job role/title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newPostLocation}
                    onChange={(e) => setNewPostLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Location"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={newPostSalary}
                    onChange={(e) => setNewPostSalary(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 25K-30K"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Job Type</label>
                  <select
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="fulltime">Full Time</option>
                    <option value="parttime">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="Job description..."
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Upload Image</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedImage && (
                  <p className="text-green-600 text-sm mt-1">
                    Selected file: {selectedImage.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmitPost}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
              >
                Submit Job Post
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="mr-1"
                        />
                        <span>{formatDate(post.posted_on)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center"></div>
                </div>

                {/* Job info */}
                <div className="p-4">
                  {/* Company and Role */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      {post.role}
                    </h3>
                    <div className="flex items-center text-gray-700 mt-1">
                      <FontAwesomeIcon
                        icon={faBuilding}
                        className="mr-2 text-gray-500"
                      />
                      <span>{post.company_name}</span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="mr-2 text-gray-500"
                      />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={faMoneyBillWave}
                        className="mr-2 text-gray-500"
                      />
                      <span>{post.salary_range}</span>
                    </div>
                    <div className="flex items-center col-span-2">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="mr-2 text-gray-500"
                      />
                      <span className="capitalize">{post.job_type}</span>
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
                        className={
                          post.reaction?.like > 0
                            ? "text-red-500"
                            : "text-gray-500"
                        }
                      />
                      <span>{post.reaction?.like || 0} likes</span>
                    </button>

                    <button className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition">
                      <FontAwesomeIcon
                        icon={faComment}
                        className="text-gray-500"
                      />
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
    </div>
  );
};

export default AdminFeed;
