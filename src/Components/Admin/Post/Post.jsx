import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUserCircle } from "@fortawesome/free-solid-svg-icons";

const API_URL = "https://empire-anything-curriculum-kentucky.trycloudflare.com/jobs/";

const getAuthToken = async () => {
  const token = localStorage.getItem("Token");
  return token;
};

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch jobs from backend
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

  return (
    <div className="container mx-auto p-6 max-w-2xl">
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
