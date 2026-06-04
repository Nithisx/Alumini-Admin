import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailScaffold from "./DetailScaffold";
import { InfoCard, AnimatedCard, MetaChip, Icons } from "./primitives";
import useViewerProfile from "./useViewerProfile";
import { API_BASE, getMediaUrl } from "./media";
import EngagementPanel from "../EngagementPanel";
import ConfirmModal from "../ConfirmModal";
import HeroActions from "./HeroActions";

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
};

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3C/svg%3E";

/**
 * NewsDetailView — standard view for a single news article, used by all roles.
 * @param {string} basePath e.g. "/alumni"
 */
export default function NewsDetailView({ basePath = "" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUserId, canModerate } = useViewerProfile();
  const token = localStorage.getItem("Token");
  const listPath = `${basePath}/news`;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/news/${id}/`, {
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No more news available.");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // adjacent-article existence (for prev/next)
  useEffect(() => {
    const currentId = Number(id);
    if (!Number.isInteger(currentId) || currentId <= 0) {
      setHasPrev(false);
      setHasNext(false);
      return;
    }
    const exists = async (newsId) => {
      if (!Number.isInteger(newsId) || newsId <= 0) return false;
      try {
        const res = await fetch(`${API_BASE}/news/${newsId}/`, {
          headers: { ...(token && { Authorization: `Token ${token}` }), "Content-Type": "application/json" },
        });
        return res.ok;
      } catch {
        return false;
      }
    };
    let cancelled = false;
    Promise.all([exists(currentId - 1), exists(currentId + 1)]).then(([p, n]) => {
      if (!cancelled) {
        setHasPrev(p);
        setHasNext(n);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const postOwnerId = post?.user?.id ?? post?.user ?? null;
  const canManage = canModerate || (currentUserId != null && currentUserId === postOwnerId);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/news/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error();
      navigate(listPath);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const meta = post
    ? [
        post.category && <MetaChip key="cat" icon={Icons.tag}>{post.category}</MetaChip>,
        post.published_on && <MetaChip key="date" icon={Icons.calendar}>{formatDate(post.published_on)}</MetaChip>,
        <MetaChip key="by" icon={Icons.person}>By {post.user?.username || "Anonymous"}</MetaChip>,
        post.featured && (
          <span key="feat" className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-300/90 text-amber-900 px-2 py-0.5 rounded-full">
            ★ Featured
          </span>
        ),
      ].filter(Boolean)
    : [];

  return (
    <>
      <DetailScaffold
        loading={loading}
        error={error}
        notFound={!loading && !error && !post}
        loadingLabel="Loading article…"
        errorTitle="No More News Available"
        notFoundTitle="News Article Not Found"
        backFallback={listPath}
        title={post?.title}
        meta={meta}
        actions={
          canManage && <HeroActions onDelete={() => setConfirmOpen(true)} />
        }
      >
        {post?.thumbnail && (
          <AnimatedCard className="overflow-hidden" hover={false}>
            <img
              src={getMediaUrl(post.thumbnail)}
              alt={post.title}
              className="w-full object-cover max-h-96"
              onError={(e) => {
                e.target.src = FALLBACK_IMG;
                e.target.className = "w-full h-48 object-contain bg-gray-100";
              }}
            />
          </AnimatedCard>
        )}

        <InfoCard>
          <div className="prose max-w-none">
            {String(post?.content || "")
              .split("\n\n")
              .map((para, i) => (
                <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                  {para}
                </p>
              ))}
          </div>
          {post?.updated_on && (
            <p className="mt-4 text-xs text-gray-400">Last updated: {formatDate(post.updated_on)}</p>
          )}
        </InfoCard>

        {post?.images?.length > 0 && (
          <InfoCard title="Related Images" icon={Icons.camera}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.images.map((image, index) => (
                <div key={image.id ?? index} className="overflow-hidden rounded-lg">
                  <img
                    src={getMediaUrl(image.image)}
                    alt={image.caption || `Image ${index + 1}`}
                    className="w-full h-40 object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMG;
                      e.target.className = "w-full h-40 object-contain p-2 bg-gray-100";
                    }}
                  />
                  {image.caption && (
                    <div className="text-xs text-gray-500 mt-1 truncate">{image.caption}</div>
                  )}
                </div>
              ))}
            </div>
          </InfoCard>
        )}

        <InfoCard bodyClassName="">
          <EngagementPanel
            contentType="news"
            contentId={id}
            postOwnerId={postOwnerId}
            canModerate={canModerate}
            currentUserId={currentUserId}
          />
        </InfoCard>

        {/* prev / next navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(listPath)} className="text-emerald-600 font-medium hover:underline">
            View All News
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => hasPrev && navigate(`${basePath}/news/${Number(id) - 1}`)}
              disabled={!hasPrev}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasPrev ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => hasNext && navigate(`${basePath}/news/${Number(id) + 1}`)}
              disabled={!hasNext}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasNext ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </DetailScaffold>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete this article?"
        message="This action cannot be undone."
        confirmText={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
