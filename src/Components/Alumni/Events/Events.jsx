import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faClock, faMapMarkerAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import EngagementPanel from "../../Shared/EngagementPanel";

const AuthorizedImage = ({ url, alt, className }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const token = localStorage.getItem("Token");
  useEffect(() => {
    let isMounted = true;
    fetch(url, { headers: { Authorization: token ? `Token ${token}` : "" } })
      .then((r) => r.blob())
      .then((blob) => { if (isMounted) setImageUrl(URL.createObjectURL(blob)); });
    return () => (isMounted = false);
  }, [url, token]);
  return imageUrl ? (
    <img src={imageUrl} alt={alt} className={className} />
  ) : (
    <div className="bg-gray-100 animate-pulse w-full h-full" />
  );
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [canModerate, setCanModerate] = useState(false);
  const token = localStorage.getItem("Token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      setCanModerate(false);
      return;
    }

    fetch("https://api.karpagamalumni.in/api/v1/profile/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((profile) => {
        setCurrentUserId(profile?.id ?? null);
        const role = (profile?.role || "").toLowerCase();
        setCanModerate(Boolean(profile?.is_staff) || role === "admin" || role === "staff");
      })
      .catch(() => {
        setCurrentUserId(null);
        setCanModerate(false);
      });
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    fetch("https://api.karpagamalumni.in/api/v1/events/", {
      headers: { Authorization: token ? `Token ${token}` : "" },
    })
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : data?.results || data?.events || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [token]);

  const filtered = events.filter(
    (e) =>
      (e?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e?.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* ── Instagram-style sticky page header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-900 flex-shrink-0">Events</h1>
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events…"
                className="w-full bg-gray-100 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          /* Skeleton cards */
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-56 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 font-medium">No events found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search</p>
          </div>
        ) : (
          filtered.map((event) => {
            const imgPath = event.images?.[0]?.image;
            const imgUrl = imgPath ? `https://api.karpagamalumni.in${imgPath}` : null;
            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div onClick={() => navigate(`/alumni/event/${event.id}`)} className="cursor-pointer">
                  {/* Post header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-violet-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.from_date_time)}</p>
                    </div>
                    {event.venue && (
                      <span className="text-xs bg-violet-50 text-violet-700 font-medium px-2.5 py-1 rounded-full flex-shrink-0 max-w-[120px] truncate">
                        {event.venue}
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  {imgUrl ? (
                    <div className="w-full h-56 overflow-hidden bg-gray-100">
                      <AuthorizedImage url={imgUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-violet-50 to-emerald-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-violet-200 text-5xl" />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                      <div className="flex items-start gap-1.5">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-500 mt-0.5" />
                        <span className="leading-4">Start: {formatDateTime(event.from_date_time)}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <FontAwesomeIcon icon={faClock} className="text-emerald-500 mt-0.5" />
                        <span className="leading-4">End: {formatDateTime(event.end_date_time)}</span>
                      </div>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <EngagementPanel
                    contentType="events"
                    contentId={event.id}
                    postOwnerId={event?.user ?? null}
                    canModerate={canModerate}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
