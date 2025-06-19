import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const TOKEN = localStorage.getItem('Token');
const API_BASE = 'http://134.209.157.195/news/';
const SERVER_BASE = 'http://134.209.157.195';

export default function SingleNews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}${id}/`, {
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => setPost(data))
      .catch(err => {
        console.error('Error fetching news:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getFullImageUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${SERVER_BASE}${path}`;
  };

  const formatDate = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handlePrevious = () => {
    const prevId = Number(id) - 1;
    if (prevId > 0) {
      navigate(`/admin/news/${prevId}`);
    }
  };

  const handleNext = () => {
    navigate(`/admin/news/${Number(id) + 1}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded shadow max-w-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Unable to Load Article</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/admin/news" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">
            Return to News List
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded shadow max-w-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">News Article Not Found</h2>
          <p className="text-gray-600 mb-4">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/admin/news" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">
            Browse All News
          </Link>
        </div>
      </div>
    );
  }

  const hasImages = post.images && post.images.length > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Simple Header */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/admin/news" className="flex items-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to News
          </Link>
          
          <div className="flex space-x-4">
            <button
              onClick={handlePrevious}
              disabled={Number(id) <= 1}
              className={`${Number(id) <= 1 ? 'opacity-50 cursor-not-allowed' : ''} transition`}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Article Content */}
        <div className="bg-white rounded shadow p-6 mb-6">
          {post.thumbnail && (
            <div className="mb-6">
              <img 
                src={getFullImageUrl(post.thumbnail)} 
                alt={post.title} 
                className="w-full object-cover max-h-96"
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3C/svg%3E";
                  e.target.className = "w-full h-48 object-contain bg-gray-100";
                }}
              />
            </div>
          )}
          
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">{post.category} • {formatDate(post.published_on)}</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>
            
            <div className="flex items-center text-sm text-gray-600 mb-6">
              <span>By {post.user?.username || 'Anonymous'}</span>
              <span className="mx-2">•</span>
              <span>Updated: {formatDate(post.updated_on)}</span>
              {post.featured && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-amber-600 font-medium">Featured</span>
                </>
              )}
            </div>
          </div>
          
          <div className="prose max-w-none">
            {post.content.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 text-gray-700">
                {para}
              </p>
            ))}
          </div>
        </div>
        
        {/* Image Gallery - Simplified */}
        {hasImages && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Related Images</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.images.map((image, index) => (
                <div key={image.id} className="overflow-hidden">
                  <img 
                    src={getFullImageUrl(image.image)} 
                    alt={image.caption || `Image ${index + 1}`} 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3C/svg%3E";
                      e.target.className = "w-full h-40 object-contain p-2 bg-gray-100";
                    }}
                  />
                  {image.caption && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {image.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Simple Navigation Footer */}
        <div className="flex justify-between items-center">
          <Link 
            to="/admin/news" 
            className="text-blue-600"
          >
            View All News
          </Link>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePrevious}
              disabled={Number(id) <= 1}
              className={`px-4 py-2 ${
                Number(id) <= 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white'
              }`}
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}