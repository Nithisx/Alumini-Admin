import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://134.209.157.195:8000/jobs/";

// You can optionally define a helper to get the token. Here it's wrapped in a Promise.
const getAuthToken = async () => {
  const token = localStorage.getItem("Token");
  return token;
};

const AdminFeed = () => {
  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New post state – using fields from the alumini student code:
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
    console.log("handleSubmitPost called");

    console.log("Input values:", {
      description: newPostCaption,
      company_name: newPostCompany,
      role: newPostRole,
      location: newPostLocation,
      salary_range: newPostSalary,
      job_type: newPostType,
      image: selectedImage || "No image selected",
    });

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token not found");
      console.log("Token:", token);

      const formData = new FormData();
      formData.append("description", newPostCaption || "");
      formData.append("company_name", newPostCompany || "");
      formData.append("role", newPostRole || "");
      formData.append("location", newPostLocation || "");
      formData.append("salary_range", newPostSalary || "");
      formData.append("job_type", newPostType || "");

      if (selectedImage) {
        console.log("Appending image:", selectedImage);
        // In a web environment, selectedImage should be a File object from an input[type="file"]
        formData.append("images", selectedImage);
      } else {
        console.log("No image selected");
      }

      console.log("Sending request to:", API_URL);
      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: token ? `Token ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Success:", response.data);
      // Prepend the new post to the posts list
      setPosts([response.data, ...posts]);

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

  // Delete a post using DELETE method (Admin can delete any post)
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

  // File input change handler
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-green-700 mb-6">Jobs Feed</h2>
      
      {/* New Post Form */}
      <div className="bg-white shadow p-4 rounded-lg border border-gray-100 mb-6">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Job Description"
            className="border border-gray-300 p-2 rounded"
            value={newPostCaption}
            onChange={(e) => setNewPostCaption(e.target.value)}
          />
          <input
            type="text"
            placeholder="Company Name"
            className="border border-gray-300 p-2 rounded"
            value={newPostCompany}
            onChange={(e) => setNewPostCompany(e.target.value)}
          />
          <input
            type="text"
            placeholder="Role"
            className="border border-gray-300 p-2 rounded"
            value={newPostRole}
            onChange={(e) => setNewPostRole(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            className="border border-gray-300 p-2 rounded"
            value={newPostLocation}
            onChange={(e) => setNewPostLocation(e.target.value)}
          />
          <input
            type="text"
            placeholder="Salary Range"
            className="border border-gray-300 p-2 rounded"
            value={newPostSalary}
            onChange={(e) => setNewPostSalary(e.target.value)}
          />
          <input
            type="text"
            placeholder="Job Type"
            className="border border-gray-300 p-2 rounded"
            value={newPostType}
            onChange={(e) => setNewPostType(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          <button
            onClick={handleSubmitPost}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Post
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {/* Posts List */}
      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow p-4 mb-4 rounded-lg border border-gray-100"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {post.avatar ? (
                  <img
                    src={post.avatar}
                    alt={`${post.username}'s avatar`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    className="w-8 h-8 text-gray-400 mr-2"
                  />
                )}
                <span className="font-medium">{post.username}</span>
              </div>
              <button
                onClick={() => deletePost(post.id)}
                className="text-red-600"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <p className="mt-2 text-gray-800">{post.content || post.description}</p>
            {/* Optional: Display other fields if available */}
            <p className="text-sm text-gray-500">
              {post.company_name} | {post.role} | {post.location} | {post.salary_range} | {post.job_type}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminFeed;