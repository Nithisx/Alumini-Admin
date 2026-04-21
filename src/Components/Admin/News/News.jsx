/*
File: NewsList.js
This component fetches and displays news posts with a completely redesigned UI
Using a green-600 theme
*/
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import AddNewsModal from './Addnewsmodel';
import EditNewsModal from './Editnewsmodal';
import { Calendar, Tag, Bookmark, Trash2, Plus, ChevronRight, Loader, MoreVertical, Pencil } from 'lucide-react';

const TOKEN = localStorage.getItem('Token');
const API_URL = 'https://api.karpagamalumni.in/api/v1/news/';
const BASE_URL = 'https://api.karpagamalumni.in';

export default function NewsList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Fetch news from API
  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Token ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Delete a post
  const handleDelete = (id) => { setConfirmDeleteId(id); setOpenMenuId(null); };

  const doDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${TOKEN}` }
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}${path}`;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Callback when a new post is successfully added
  const onNewsAdded = () => {
    setShowModal(false);
    fetchNews();
  };

  const openEditNews = (id) => {
    setEditingNewsId(id);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const onNewsEdited = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setShowEditModal(false);
    setEditingNewsId(null);
  };

  // Get unique categories
  const categories = ['All', ...new Set(posts.map(post => post.category))];

  // Filter posts by category
  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter(post => post.category === activeCategory);

  // Get featured posts
  const featuredPosts = posts.filter(post => post.featured);

  return (
    <div className="bg-gray-50 min-h-screen pb-20 lg:pb-6">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete News Item"
        message="This will permanently delete this news item."
        danger
        confirmText="Delete"
        onConfirm={() => { doDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Newsroom</h1>
            <p className="text-gray-500 mt-2">Stay updated with our latest announcements</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition shadow-md"
          >
            <Plus size={18} className="mr-2" />
            Post News
          </button>
        </div>

        {/* Featured Posts - Only show if we have featured posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map(post => (
                <div key={`featured-${post.id}`} className="bg-white rounded-xl overflow-hidden shadow-lg transition transform hover:scale-[1.02] relative group">
                  {/* 3-dots menu for Featured Posts */}
                  <div className="absolute top-4 right-4 z-10" ref={openMenuId === `f-${post.id}` ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === `f-${post.id}` ? null : `f-${post.id}`)}
                      className="w-8 h-8 bg-white/80 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow transition"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === `f-${post.id}` && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                        <button
                          onClick={() => openEditNews(post.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition">
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          {deletingId === post.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                        </button>
                        <button
                          onClick={() => setOpenMenuId(null)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative h-60">
                    <img
                      src={post.thumbnail ? getFullImageUrl(post.thumbnail) : 'https://via.placeholder.com/600x400'}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={e => e.target.src = 'https://via.placeholder.com/600x400'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                        <Tag size={14} className="mr-1" />
                        {post.category}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2">{post.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Calendar size={16} className="mr-2" />
                      {formatDate(post.published_on)}
                      <span className="mx-2">•</span>
                      <Bookmark size={16} className="mr-2" />
                      Featured
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-4">{post.content}</p>
                    <div className="flex justify-between items-center">
                      <a
                        href={`/admin/news/${post.id}/`}
                        className="inline-flex items-center text-green-600 font-medium hover:text-green-700"
                      >
                        Read Full Story
                        <ChevronRight size={16} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${activeCategory === category
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* News List */}
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <div className="text-green-600">
              <Loader size={40} className="animate-spin" />
            </div>
            <p className="mt-4 text-gray-600">Loading news...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <p className="text-red-700">Failed to load news: {error}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No news articles found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredPosts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition relative group">
                {/* 3-dots menu for Regular Posts */}
                <div className="absolute top-4 right-4 z-10" ref={openMenuId === post.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                    className="w-8 h-8 bg-white/80 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === post.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                      <a href={`/admin/news/${post.id}/edit`}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition">
                        <Pencil size={13} /> Edit
                      </a>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        {deletingId === post.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                      </button>
                      <button
                        onClick={() => setOpenMenuId(null)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="sm:flex">
                  <div className="sm:w-1/3 relative">
                    <img
                      src={post.thumbnail ? getFullImageUrl(post.thumbnail) : 'https://via.placeholder.com/400x300'}
                      alt={post.title}
                      className="w-full h-48 sm:h-full object-cover"
                      onError={e => e.target.src = 'https://via.placeholder.com/400x300'}
                    />
                  </div>
                  <div className="p-6 sm:w-2/3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {post.category}
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(post.published_on)}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-3 text-gray-800">{post.title}</h2>
                    <p className="text-gray-600 line-clamp-2 mb-4">{post.content}</p>
                    <div className="flex justify-between items-center">
                      <a
                        href={`/admin/news/${post.id}/`}
                        className="inline-flex items-center text-green-600 font-medium hover:text-green-700"
                      >
                        Read More
                        <ChevronRight size={16} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add News Modal */}
      <AddNewsModal show={showModal} onClose={() => setShowModal(false)} onSuccess={onNewsAdded} />
      {/* Edit News Modal */}
      <EditNewsModal
        show={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingNewsId(null); }}
        onSuccess={onNewsEdited}
        newsId={editingNewsId}
      />
    </div>
  );
}
