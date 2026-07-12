import React, { useEffect, useState } from "react";
import { roleBase } from "../../../lib/useBasePath";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faNewspaper, faTag, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import AddNewsModal from "./Addnewsmodel";
import EditNewsModal from "./Editnewsmodal";
import ConfirmModal from "../../Shared/ConfirmModal";
import EngagementPanel from "../../Shared/EngagementPanel";
import { PageHeader, PageHero, StatPill, EmptyState, MotionList, MotionItem, SkeletonFeed } from "../../Shared/ui";
import { getMediaUrl } from "../../../config/api";
import { usePermissions } from "../../../lib/usePermissions";
import { observer } from "mobx-react-lite";
import { useNewsStore, useProfileStore } from "../../../stores";

const AuthorizedImage = ({ url, alt, className }) => {
  if (!url) {
    return <div className="bg-gray-100 animate-pulse w-full h-48" />;
  }

  return <img src={url} alt={alt} className={className} />;
};

function NewsList() {
  const newsStore = useNewsStore();
  const profileStore = useProfileStore();
  const posts = newsStore.items;
  const isLoading = newsStore.loading;
  const currentUserId = profileStore.currentUserId;

  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { has } = usePermissions();
  const canCreate = has("news.create");
  const canEditAny = has("news.edit_any");
  const canDeleteAny = has("news.delete_any");
  const canModerateComments = has("news.moderate_comments");
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [confirmDeleteNewsId, setConfirmDeleteNewsId] = useState(null);
  const navigate = useNavigate();

  // Data + persistence live in NewsStore; ownership needs only the cached profile.
  const fetchNews = () => newsStore.fetchAll();

  useEffect(() => { newsStore.fetchAll(); }, [newsStore]);
  useEffect(() => { profileStore.load(); }, [profileStore]);

  const isNewsOwner = (post) => newsStore.isOwner(post, currentUserId);

  const handleDeleteNews = async (newsId) => {
    try {
      await newsStore.remove(newsId);
    } catch {
      // silent — the store already recorded the error
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const getImageUrl = (path) => {
    if (!path) return null;
    return getMediaUrl(path);
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
      <PageHeader
        section="news"
        icon={<FontAwesomeIcon icon={faNewspaper} />}
        title="News"
        search={
          <>
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news…"
              className="w-full bg-gray-100 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
            />
          </>
        }
        actions={
          canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition text-base font-bold"
              title="Add news"
            >
              +
            </button>
          )
        }
        below={
          categories.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
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
          ) : null
        }
      />

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-0 sm:px-4 py-4 space-y-6">
        <div className="px-4 sm:px-0">
          <PageHero
            section="news"
            icon={<FontAwesomeIcon icon={faNewspaper} />}
            title="News Room"
            subtitle="Latest announcements, achievements and stories from the alumni community."
            stats={<StatPill value={posts.length} label="Articles" />}
          />
        </div>
        {isLoading ? (
          <SkeletonFeed count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            section="news"
            icon={<FontAwesomeIcon icon={faNewspaper} />}
            title="No news found"
            description={searchTerm ? "Try a different search term." : "No articles in this category yet."}
          />
        ) : (
          <MotionList className="space-y-6">
            {filtered.map((post) => {
            const imgUrl = getImageUrl(post.thumbnail);
            return (
              <MotionItem
                key={post.id}
                className="bg-white sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => navigate(`${roleBase()}/news/${post.id}/`)}
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
                    {(canEditAny || canDeleteAny || isNewsOwner(post)) && (
                      <div className="flex items-center gap-1">
                        {(canEditAny || isNewsOwner(post)) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingNewsId(post.id); }}
                            className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50 flex items-center justify-center"
                            title="Edit news"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-xs" />
                          </button>
                        )}
                        {(canDeleteAny || isNewsOwner(post)) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteNewsId(post.id); }}
                            className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50 flex items-center justify-center"
                            title="Delete news"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        )}
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
                  <EngagementPanel /* moderation gated by news.moderate_comments */
                    contentType="news"
                    contentId={post.id}
                    postOwnerId={post?.user ?? null}
                    canModerate={canModerateComments}
                    currentUserId={currentUserId}
                  />
                </div>
              </MotionItem>
            );
            })}
          </MotionList>
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

export default observer(NewsList);
