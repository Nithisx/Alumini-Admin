"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Eye, AlertCircle, Loader } from "lucide-react";

// API Configuration
const API_BASE_URL = "https://xyndrix.me/api";
const NEWS_API_URL = `${API_BASE_URL}/news/`;

const NewsContribution = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Fetch news from API
  const fetchNews = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(NEWS_API_URL, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();
      setNews(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(err.message || "Failed to fetch news");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleAddNews = () => {
    console.log("Add new news article");
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm("Are you sure you want to delete this news article?")) {
      return;
    }

    setDeleteLoading(newsId);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${NEWS_API_URL}${newsId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete news: ${response.status}`);
      }

      // Remove the deleted news from the local state
      setNews((prevNews) =>
        prevNews.filter((article) => article.id !== newsId)
      );

      // Show success message
      alert("News article deleted successfully!");
    } catch (err) {
      console.error("Error deleting news:", err);
      alert(err.message || "Failed to delete news article");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">News Contributions</h2>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-500 text-center mb-3">{error}</p>
            <button
              onClick={fetchNews}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading news articles...</p>
          </div>
        </div>
      )}

      {/* News List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {news.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">
                No news articles yet
              </div>
              <p className="text-gray-500">
                Start by adding your first news contribution
              </p>
            </div>
          ) : (
            news.map((article) => (
              <div
                key={article.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {article.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      article.status
                    )}`}
                  >
                    {article.status || "draft"}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {article.content ||
                    article.description ||
                    "No content available"}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(
                        article.created_at || article.createdAt
                      ).toLocaleDateString()}
                    </div>
                    {(article.status === "published" || !article.status) &&
                      article.views && (
                        <div className="flex items-center gap-1">
                          <Eye size={16} />
                          {article.views} views
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteNews(article.id)}
                      disabled={deleteLoading === article.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading === article.id ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewsContribution;
