import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faNewspaper, faTag, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import AddNewsModal from "./Addnewsmodel";
import EditNewsModal from "../../Admin/News/Editnewsmodal";
import ConfirmModal from "../../Shared/ConfirmModal";
import EngagementPanel from "../../Shared/EngagementPanel";

const TOKEN = () => localStorage.getItem("Token");
const BASE_URL = "https://api.karpagamalumni.in";

const AuthorizedImage = ({ url, alt, className }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const token = TOKEN();
  useEffect(() => {
    let isMounted = true;
    fetch(url, { headers: { Authorization: token ? `Token ${token}` : "" } })
      .then((r) => r.blob())
      .then((blob) => { if (isMounted) setImageUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [url, token]);
  return imageUrl ? (
    <img src={imageUrl} alt={alt} className={className} />
  ) : (
    <div className="bg-gray-100 animate-pulse w-full h-48" />
  );
};

export default function NewsList() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [canModerate, setCanModerate] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [confirmDeleteNewsId, setConfirmDeleteNewsId] = useState(null);
  const navigate = useNavigate();

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const token = TOKEN();
      const res = await fetch(`${BASE_URL}/api/v1/news/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  useEffect(() => {
    const token = TOKEN();
    if (!token) return;
    fetch(`${BASE_URL}/api/v1/profile/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setCurrentUserId(d?.id ?? null);
        const role = (d?.role || "").toLowerCase();
        setCanModerate(Boolean(d?.is_staff) || role === "admin" || role === "staff");
      })
      .catch(() => {});
  }, []);

  const isNewsOwner = (post) => {
    if (!currentUserId) return false;
    const ownerId = post?.user ?? post?.user_id;
    return ownerId && String(currentUserId) === String(ownerId);
  };

  const handleDeleteNews = async (newsId) => {
    try {
      const token = TOKEN();
      const res = await fetch(`${BASE_URL}/api/v1/news/${newsId}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== newsId));
    } catch {
      // silent
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  const categories = ["All", ...new Set(posts.map((p) => p.category).filter(Boolean))];

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      (p.title || "").toLowerCase().includes(term) ||
      (p.content || "").toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <ConfirmModal
        isOpen={!!confirmDeleteNewsId}
        title="Delete News Article"
        message="This will permanently delete this news article."
        danger
        confirmText="Delete"
        onConfirm={() => { handleDeleteNews(confirmDeleteNewsId); setConfirmDeleteNewsId(null); }}
        onCancel={() => setConfirmDeleteNewsId(null)}
      />
      <EditNewsModal
        show={!!editingNewsId}
        newsId={editingNewsId}
        onClose={() => setEditingNewsId(null)}
        onSuccess={() => { setEditingNewsId(null); fetchNews(); }}
      />
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-900 flex-shrink-0">News</h1>
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search news…"
                className="w-full bg-gray-100 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex-shrink-0 w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition text-base font-bold"
              title="Add news"
            >
              +
            </button>
          </div>

          {/* Category pills */}
          {categories.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-colors flex-shrink-0 ${
                    activeCategory === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-0 sm:px-4 py-4 space-y-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-64 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 mx-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faNewspaper} className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 font-medium">No news found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? "Try a different search term" : "No articles in this category yet"}
            </p>
          </div>
        ) : (
          filtered.map((post) => {
            const imgUrl = getImageUrl(post.thumbnail);
            return (
              <div
                key={post.id}
                className="bg-white sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => navigate(`/alumni/news/${post.id}/`)}
                  className="cursor-pointer"
                >
                  {/* Post header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                      <FontAwesomeIcon icon={faNewspaper} className="text-emerald-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(post.published_on)}</p>
                    </div>
                    {post.category && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-md flex-shrink-0 border border-emerald-100 flex items-center gap-1">
                        <FontAwesomeIcon icon={faTag} className="text-[9px]" />
                        {post.category}
                      </span>
                    )}
                    {post.featured && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md flex-shrink-0 border border-amber-100">
                        Featured
                      </span>
                    )}
                    {(canModerate || isNewsOwner(post)) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingNewsId(post.id); }}
                          className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50 flex items-center justify-center"
                          title="Edit news"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteNewsId(post.id); }}
                          className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50 flex items-center justify-center"
                          title="Delete news"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Image */}
                  {imgUrl ? (
                    <div className="w-full bg-gray-50 border-y border-gray-100 overflow-hidden">
                      <div className="w-full p-1 sm:p-2">
                        <AuthorizedImage
                          url={imgUrl}
                          alt={post.title}
                          className="w-full h-auto max-h-[60vh] object-contain rounded-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faNewspaper} className="text-emerald-200 text-5xl opacity-50" />
                    </div>
                  )}

                  {/* Body */}
                  <div className="px-4 py-4">
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{post.content}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-2">Read more →</p>
                  </div>
                </div>

                {/* Engagement */}
                <div className="border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                  <EngagementPanel
                    contentType="news"
                    contentId={post.id}
                    postOwnerId={post?.user ?? null}
                    canModerate={canModerate}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddNewsModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => { setShowModal(false); fetchNews(); }}
      />
    </div>
  );
}
