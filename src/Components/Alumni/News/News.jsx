/*
File: NewsList.js
This component fetches and displays news posts with a completely redesigned UI
Using a green-600 theme
*/
import React, { useEffect, useState } from 'react';
import AddNewsModal from './Addnewsmodel';
import { Calendar, Tag, Bookmark, Trash2, Plus, ChevronRight, Loader } from 'lucide-react';

const TOKEN = localStorage.getItem('Token');
const API_URL = 'https://api.karpagamalumni.in/api/v1/news/';
const BASE_URL = 'https://api.karpagamalumni.in';

export default function NewsList() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

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
      setPosts(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);


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

  // Get unique categories
  const categories = ['All', ...new Set(posts.map(post => post.category))];

  // Filter posts by category
  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter(post => post.category === activeCategory);

  // Get featured posts
  const featuredPosts = posts.filter(post => post.featured);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6 items-start">

        {/* Main feed column */}
        <div className="flex-1 min-w-0">
          {/* Create post prompt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Bookmark size={18} className="text-green-600" />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 text-sm transition-colors"
            >
              Share a news story...
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={14} />
              Post
            </button>
          </div>

          {/* Category filter pills */}
          <div className="mb-4 overflow-x-auto">
            <div className="flex space-x-2 pb-1">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${activeCategory === category
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* News feed */}
          {isLoading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Loader size={36} className="animate-spin text-green-600" />
              <p className="text-gray-500 text-sm">Loading news...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg text-red-700 text-sm">
              Failed to load news: {error}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No news articles found in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Featured posts first */}
              {activeCategory === 'All' && featuredPosts.length > 0 && featuredPosts.slice(0, 1).map(post => (
                <div key={`featured-${post.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {post.thumbnail && (
                    <div className="relative">
                      <img
                        src={getFullImageUrl(post.thumbnail)}
                        alt={post.title}
                        className="w-full object-cover"
                        style={{ maxHeight: "400px" }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                      <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                        <Bookmark size={11} /> Featured
                      </span>
                    </div>
                  )}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        <Tag size={10} /> {post.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(post.published_on)}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.content}</p>
                    <a href={`/alumni/news/${post.id}/`} className="inline-flex items-center text-green-600 font-medium text-sm hover:text-green-700">
                      Read Full Story <ChevronRight size={14} className="ml-1" />
                    </a>
                  </div>
                </div>
              ))}

              {/* Regular posts */}
              {filteredPosts.filter(p => !p.featured || activeCategory !== 'All').length === 0 && activeCategory === 'All' ? null :
                filteredPosts
                  .filter(p => activeCategory !== 'All' || !p.featured)
                  .map(post => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {post.thumbnail && (
                        <img
                          src={getFullImageUrl(post.thumbnail)}
                          alt={post.title}
                          className="w-full object-cover"
                          style={{ maxHeight: "350px" }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            <Tag size={10} /> {post.category}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={11} /> {formatDate(post.published_on)}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-gray-900 mb-1">{post.title}</h2>
                        <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.content}</p>
                        <a href={`/alumni/news/${post.id}/`} className="inline-flex items-center text-green-600 font-medium text-sm hover:text-green-700">
                          Read More <ChevronRight size={14} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4 sticky top-20">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Newsroom</h3>
            <p className="text-xs text-gray-500">Stay updated with the latest alumni news and announcements.</p>
          </div>
          {featuredPosts.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">More Featured</h3>
              <div className="space-y-3">
                {featuredPosts.slice(1, 4).map(post => (
                  <a key={post.id} href={`/alumni/news/${post.id}/`} className="flex gap-2 group">
                    {post.thumbnail ? (
                      <img src={getFullImageUrl(post.thumbnail)} alt={post.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Bookmark size={16} className="text-green-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-green-600 line-clamp-2 leading-tight">{post.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(post.published_on)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add News Modal */}
      <AddNewsModal show={showModal} onClose={() => setShowModal(false)} onSuccess={onNewsAdded} />
    </div>
  );
}
