import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faClock, faMapMarkerAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import EngagementPanel from "../../Shared/EngagementPanel";
import { DocumentList } from "../../Shared/DocumentPreview";

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

  const getGoogleCalendarUrl = (event) => {
    const startDate = new Date(event?.from_date_time);
    if (Number.isNaN(startDate.getTime())) return null;

    const endCandidate = event?.end_date_time ? new Date(event.end_date_time) : null;
    const endDate = endCandidate && !Number.isNaN(endCandidate.getTime()) ? endCandidate : startDate;
    const toGoogleDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event?.title || "Alumni Event",
      dates: `${toGoogleDate(startDate)}/${toGoogleDate(endDate)}`,
      details: event?.description || "",
      location: event?.venue || "",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const resolveEventId = (event) => {
    const candidates = [event?.pk, event?.id, event?.event_id, event?.eventId];
    for (const value of candidates) {
      if (value === null || value === undefined) continue;
      const s = String(value).trim();
      if (!s) continue;
      // Accept positive integers or UUIDs
      if (/^\d+$/.test(s) && Number(s) > 0) return s;
      if (UUID_RE.test(s)) return s;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* ── Instagram-style sticky page header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
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
                className="w-full bg-gray-100 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-2xl mx-auto px-0 sm:px-4 py-4 space-y-6">
        {isLoading ? (
          /* Skeleton cards */
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
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 font-medium">No events found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          filtered.map((event) => {
            const imgPath = event.images?.[0]?.image;
            const imgUrl = imgPath ? `https://api.karpagamalumni.in${imgPath}` : null;
            const resolvedId = resolveEventId(event);
            const calendarUrl = getGoogleCalendarUrl(event);
            
            return (
              <div
                key={event.id}
                className="bg-white sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div onClick={() => resolvedId && navigate(`/alumni/event/${resolvedId}`)} className="cursor-pointer">
                  {/* Post header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 border border-violet-200">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-violet-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">{event.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.from_date_time)}</p>
                    </div>
                    {event.venue && (
                      <span className="text-[10px] bg-violet-50 text-violet-700 font-bold px-2 py-1 rounded-md flex-shrink-0 max-w-[100vw] truncate border border-violet-100">
                        {event.venue}
                      </span>
                    )}
                  </div>

                  {/* Adaptive Image Section */}
                  {imgUrl ? (
                    <div className="relative w-full bg-gray-50 flex items-center justify-center border-y border-gray-50 overflow-hidden">
                      {/* Inner wrapper for padding control */}
                      <div className="w-full h-full p-1 sm:p-2">
                        <AuthorizedImage 
                          url={imgUrl} 
                          alt={event.title} 
                          className="w-full h-auto max-h-[60vh] md:max-h-[60vh] object-contain rounded-sm" 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-violet-50 to-emerald-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-violet-200 text-5xl opacity-50" />
                    </div>
                  )}

                  {/* Caption / Body */}
                  <div className="px-4 py-4">
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-4">{event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-[11px] font-medium text-gray-600">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-500 w-3" />
                        <span>Starts: {formatDateTime(event.from_date_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faClock} className="text-emerald-500 w-3" />
                        <span>Ends: {formatDateTime(event.end_date_time)}</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-400 w-3" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>

                    {calendarUrl && (
                      <a
                        href={calendarUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Add to Google Calendar
                      </a>
                    )}
                  </div>
                </div>

                {/* Attached documents */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DocumentList documents={event.documents} />
                </div>

                {/* Interaction Panel */}
                <div className="border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                  {resolvedId && (
                    <EngagementPanel
                      contentType="events"
                      contentId={resolvedId}
                      postOwnerId={event?.user ?? null}
                      canModerate={canModerate}
                      currentUserId={currentUserId}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
