import React, { useState } from "react";
import { Eye, Heart } from "lucide-react";
import { API_ORIGIN } from "../../config/api";
import { useEngagementStore } from "../../stores";

const MEDIA_BASE_URL = API_ORIGIN;

const resolvePhoto = (photo) => {
  if (!photo) return null;
  return photo.startsWith("http") ? photo : `${MEDIA_BASE_URL}${photo}`;
};

const UserRow = ({ user, trailing }) => (
  <div className="flex items-center gap-2 text-xs">
    {user?.profile_photo ? (
      <img
        src={resolvePhoto(user.profile_photo)}
        alt=""
        className="w-6 h-6 rounded-full object-cover"
      />
    ) : (
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <span className="text-emerald-700 font-bold text-[10px]">
          {user?.first_name?.[0] || user?.username?.[0] || "?"}
        </span>
      </div>
    )}
    <span className="font-medium text-gray-800 truncate">
      {user?.full_name ||
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
        user?.username ||
        "Unknown"}
    </span>
    {user?.role && (
      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
        {user.role}
      </span>
    )}
    {trailing && <span className="ml-auto text-gray-400 text-[10px]">{trailing}</span>}
  </div>
);

/**
 * Views badge + expandable viewers list.
 * Fetches the full list from `/{contentType}/{contentId}/viewers/` on first expand
 * if uniqueViewers > recentViewers.length and `contentType` is provided.
 */
export const ViewStats = ({
  contentType,
  contentId,
  totalViews,
  uniqueViewers,
  recentViewers,
}) => {
  const engagement = useEngagementStore();
  const [expanded, setExpanded] = useState(false);
  const [viewers, setViewers] = useState(recentViewers || []);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedAll, setLoadedAll] = useState(false);

  const fetchAllViewers = async () => {
    if (loadedAll || loadingMore || !contentType) return;
    setLoadingMore(true);
    try {
      setViewers(await engagement.fetchViewers(contentType, contentId));
      setLoadedAll(true);
    } catch {
      /* leave the preloaded viewers in place */
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && (uniqueViewers || 0) > viewers.length && !loadedAll) {
      fetchAllViewers();
    }
  };

  return (
    <div className="px-4 pb-2 pt-1 border-t border-gray-50">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-emerald-700"
      >
        <Eye className="w-4 h-4" />
        <span>
          {totalViews || 0} {totalViews === 1 ? "view" : "views"}
        </span>
        <span className="text-gray-400">·</span>
        <span>
          {uniqueViewers || 0} unique{" "}
          {uniqueViewers === 1 ? "viewer" : "viewers"}
        </span>
        {(uniqueViewers || 0) > 0 && (
          <span className="text-emerald-600 ml-1">
            {expanded ? "Hide" : "Show"}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
          {loadingMore && viewers.length === 0 && (
            <p className="text-xs text-gray-400">Loading viewers…</p>
          )}
          {!loadingMore && viewers.length === 0 && (
            <p className="text-xs text-gray-400">No one has viewed this yet.</p>
          )}
          {viewers.map((v) => (
            <UserRow
              key={v.id}
              user={v.user}
              trailing={`${v.view_count} ${v.view_count === 1 ? "view" : "views"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Likes badge + expandable list of users who liked.
 * Uses `likers` (full list) if available, else falls back to `recentLikers`.
 * `totalLikes` and the lists come straight from /myposts/.
 */
export const LikesList = ({ totalLikes, likers, recentLikers }) => {
  const [expanded, setExpanded] = useState(false);
  const list = Array.isArray(likers) && likers.length > 0
    ? likers
    : (Array.isArray(recentLikers) ? recentLikers : []);
  const count = typeof totalLikes === "number" ? totalLikes : list.length;

  return (
    <div className="px-4 pb-2 pt-1 border-t border-gray-50">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-rose-600"
      >
        <Heart className={`w-4 h-4 ${count > 0 ? "text-rose-500" : ""}`} />
        <span>
          {count} {count === 1 ? "like" : "likes"}
        </span>
        {count > 0 && (
          <span className="text-rose-600 ml-1">
            {expanded ? "Hide" : "Show"}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-xs text-gray-400">No likes yet.</p>
          ) : (
            list.map((u, idx) => (
              <UserRow key={u?.id || idx} user={u} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ViewStats;
