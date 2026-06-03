import React, { useState, useEffect, useCallback } from "react";
import Herosection from "../../../Pages/Herosection";
import { format } from "date-fns";
import Footer from "../../../Pages/about_components/Footer";
import ChapterDistributionSection from "../../Shared/ChapterDistributionSection";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
import CountUp from "../../Shared/CountUp";

const HomePage = () => {
  const [data, setData] = useState(null);
  const [countryDistribution, setCountryDistribution] = useState({ chapters: [] });
  const [cityStateDistribution, setCityStateDistribution] = useState({ city_chapters: [], state_chapters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsSlide, setNewsSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const BASE_URL = "https://api.karpagamalumni.in/api/v1";
  const MEDIA_BASE_URL = "https://api.karpagamalumni.in";
  const token = localStorage.getItem("Token");
  const newsCount = data?.featured_news?.length || 0;

  const navigate = useCallback((path) => { window.location.href = path; }, []);

  useEffect(() => {
    if (!token) { setLoading(false); setError("Authentication token not found"); return; }
    const fetchData = async () => {
      try {
        const [homeRes, countryRes, cityStateRes] = await Promise.all([
          fetch(`${BASE_URL}/home/`, { headers: { Authorization: `Token ${token}` } }),
          fetch(`${BASE_URL}/country-distribution/`, { headers: { Authorization: `Token ${token}` } }),
          fetch(`${BASE_URL}/city-state-chapters/`, { headers: { Authorization: `Token ${token}` } }),
        ]);
        if (!homeRes.ok || !countryRes.ok || !cityStateRes.ok) throw new Error("Failed to fetch data");
        setData(await homeRes.json());
        setCountryDistribution(await countryRes.json());
        setCityStateDistribution(await cityStateRes.json());
        setLoading(false);
      } catch (err) { setError(err.message); setLoading(false); }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [loading]);

  const goToNextNews = useCallback(() => {
    if (newsCount < 2) return;
    setNewsSlide((prev) => (prev + 1) % newsCount);
  }, [newsCount]);

  const goToPrevNews = useCallback(() => {
    if (newsCount < 2) return;
    setNewsSlide((prev) => (prev - 1 + newsCount) % newsCount);
  }, [newsCount]);

  const handleNewsTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleNewsTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goToNextNews();
      } else {
        goToPrevNews();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (loading) return (
    <div className={DASHBOARD_THEME.loadingPage}>
      <div className={DASHBOARD_THEME.loadingWrap}>
        <div className={DASHBOARD_THEME.loadingSpinner} />
        <p className={DASHBOARD_THEME.loadingText}>Loading your feed...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={DASHBOARD_THEME.loadingPage}>
      <div className={DASHBOARD_THEME.errorPanel}>
        <div className={DASHBOARD_THEME.errorIconWrap}>
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className={DASHBOARD_THEME.errorTitle}>Something went wrong</h3>
        <p className={DASHBOARD_THEME.errorBody}>{error}</p>
        <button onClick={() => window.location.reload()} className={DASHBOARD_THEME.retryButton}>
          Try Again
        </button>
      </div>
    </div>
  );

  const formatDate = (d) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
  const formatDateTime = (d) => {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "TBA";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getGoogleCalendarUrl = (event) => {
    const startDate = new Date(event.from_date_time);
    if (Number.isNaN(startDate.getTime())) return null;

    const endCandidate = event.end_date_time ? new Date(event.end_date_time) : null;
    const endDate = endCandidate && !Number.isNaN(endCandidate.getTime()) ? endCandidate : startDate;
    const toGoogleDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title || "Alumni Event",
      dates: `${toGoogleDate(startDate)}/${toGoogleDate(endDate)}`,
      details: event.description || "",
      location: event.venue || "",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const stats = [
    { label: "Members", value: data.total_users, color: "bg-emerald-500", path: "/admin/members/", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Upcoming Events", value: data.upcoming_event, color: "bg-violet-500", path: "/admin/event/", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Albums", value: data.albums_count, color: "bg-pink-500", path: "/admin/albums/", icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "News", value: data.new_users, color: "bg-amber-500", path: "/admin/news/", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  ];

  return (
    <div className={DASHBOARD_THEME.page}>
      {/* Hero */}
      <div className={DASHBOARD_THEME.hero}>
        <Herosection />
      </div>

      <div className={DASHBOARD_THEME.content}>

        {/* ── Stats strip (Instagram Stories style) ── */}
        <div className={DASHBOARD_THEME.statsGrid}>
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className={DASHBOARD_THEME.statButton}
            >
              <div className={`${DASHBOARD_THEME.statIcon} ${s.color}`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={s.icon} />
                </svg>
              </div>
              <div className="text-center">
                <p className={DASHBOARD_THEME.statCount}><CountUp value={s.value} /></p>
                <p className={DASHBOARD_THEME.statLabel}>{s.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Latest Albums (folder grid) ── */}
        <section>
          <div className={DASHBOARD_THEME.sectionHeader}>
            <h2 className={DASHBOARD_THEME.sectionTitle}>Photo Gallery</h2>
            <button onClick={() => navigate("/admin/albums/")} className={DASHBOARD_THEME.sectionAction}>
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.latest_album_images?.slice(0, 6).map((album) => (
              <div
                key={album.id}
                onClick={() => navigate(`/admin/albums/${album.id}/`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100">
                  {album.cover_image ? (
                    <img src={`${MEDIA_BASE_URL}${album.cover_image}`} alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{album.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Featured News (Instagram post card style) ── */}
        {data.featured_news?.length > 0 && (
          <section id="news-section">
            <div className={DASHBOARD_THEME.sectionHeader}>
              <h2 className={DASHBOARD_THEME.sectionTitle}>Latest News</h2>
              <button onClick={() => navigate("/admin/news/")} className={DASHBOARD_THEME.sectionAction}>
                See all
              </button>
            </div>
            <div
              className={`relative overflow-hidden ${DASHBOARD_THEME.panelCard}`}
              onTouchStart={handleNewsTouchStart}
              onTouchEnd={handleNewsTouchEnd}
            >
              {data.featured_news.map((news, index) => (
                <div key={news.id} style={{ display: index === newsSlide ? "block" : "none" }}>
                  {/* Post header */}
                  <div className="flex items-center gap-3 p-4">
                    <img
                      src={`${MEDIA_BASE_URL}${news.user.profile_photo}`}
                      alt={`${news.user.first_name}`}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-200"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{news.user.first_name} {news.user.last_name}</p>
                      <p className="text-xs text-gray-400">{format(new Date(news.published_on), "MMM d, yyyy")}</p>
                    </div>
                    <span className="ml-auto text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full">{news.category}</span>
                  </div>
                  {/* Image */}
                  <img
                    src={`${MEDIA_BASE_URL}${news.thumbnail}`}
                    alt={news.title}
                    className="w-full h-auto max-h-[80vh] object-contain bg-gray-50"
                  />
                  {/* Caption */}
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-900 mb-1">{news.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{news.content}</p>
                  </div>
                </div>
              ))}
              {newsCount > 1 && (
                <button
                  type="button"
                  aria-label="Next news"
                  onClick={goToNextNews}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-white/90 text-emerald-700 shadow-md hover:bg-white transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5 pb-4">
                {data.featured_news.map((_, i) => (
                  <button key={i} onClick={() => setNewsSlide(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === newsSlide ? "bg-emerald-600 w-4" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Upcoming Events ── */}
        <section id="events-section">
          <div className={DASHBOARD_THEME.sectionHeader}>
            <h2 className={DASHBOARD_THEME.sectionTitle}>Upcoming Events</h2>
            <button onClick={() => navigate("/admin/event/")} className={DASHBOARD_THEME.sectionAction}>
              See all
            </button>
          </div>
          <div className={DASHBOARD_THEME.eventList}>
            {Array.isArray(data.upcoming_events) && data.upcoming_events.map((event) => {
              const calendarUrl = getGoogleCalendarUrl(event);

              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/admin/event/${event.id}`)}
                  className={DASHBOARD_THEME.eventCard}
                >
                  {event.images?.[0]?.image && (
                    <img src={`${MEDIA_BASE_URL}${event.images[0].image}`} alt={event.title}
                      className="w-full h-auto max-h-[80vh] object-contain bg-gray-50"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 flex-1">{event.title}</h3>
                      <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {formatDate(event.from_date_time)}
                      </span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-xs text-gray-500 truncate">{event.venue}</p>
                      </div>
                    )}
                    <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                      <p>
                        From: <span className="font-medium text-gray-700">{formatDateTime(event.from_date_time)}</span>
                      </p>
                      <p>
                        To: <span className="font-medium text-gray-700">{formatDateTime(event.end_date_time)}</span>
                      </p>
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
              );
            })}
          </div>
        </section>

        {/* ── Chapter Distribution + Sidebar Panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="member-section">
          <section className="order-2 lg:order-1 lg:col-span-2">
            <ChapterDistributionSection
              countryDistribution={countryDistribution}
              cityStateDistribution={cityStateDistribution}
              chapterBasePath="/admin"
            />
          </section>

          <div className="order-1 lg:order-2 flex flex-col gap-6">
            {/* New Members */}
            <section className="order-2 lg:order-1">
              <div className={DASHBOARD_THEME.sectionHeader}>
                <h2 className={DASHBOARD_THEME.sectionTitle}>New Members</h2>
                <button onClick={() => navigate("/admin/members/")} className={DASHBOARD_THEME.sectionAction}>
                  See all
                </button>
              </div>
              <div className={DASHBOARD_THEME.memberList}>
                {data.latest_members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => navigate(`/admin/members/${member.username}/`)}
                    className={DASHBOARD_THEME.memberRow}
                  >
                    {member.profile_photo ? (
                      <img src={`${MEDIA_BASE_URL}${member.profile_photo}`} alt={member.first_name}
                        className={DASHBOARD_THEME.memberAvatar} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{member.role || "Alumni"}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </section>

            {/* Batch Mates */}
            {data.batch_mates?.length > 0 && (
              <section className="order-1 lg:order-2">
                <div className={DASHBOARD_THEME.sectionHeader}>
                  <h2 className={DASHBOARD_THEME.sectionTitle}>Batch Mates</h2>
                  <button onClick={() => navigate("/admin/members/")} className={DASHBOARD_THEME.sectionAction}>
                    See all
                  </button>
                </div>
                <div className={DASHBOARD_THEME.memberList}>
                  {data.batch_mates.map((mate) => (
                    <div
                      key={mate.id}
                      onClick={() => navigate(`/admin/members/${mate.username}/`)}
                      className={DASHBOARD_THEME.memberRow}
                    >
                      {mate.profile_photo ? (
                        <img src={`${MEDIA_BASE_URL}${mate.profile_photo}`} alt={mate.first_name}
                          className={DASHBOARD_THEME.memberAvatar} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {mate.first_name?.[0]}{mate.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{mate.first_name} {mate.last_name}</p>
                        <p className="text-xs text-gray-400 truncate">{mate.course || "Alumni"}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <section className="bg-gradient-to-r from-emerald-700 to-green-700 rounded-2xl p-6 sm:p-8 text-white" id="contact-section">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ready to connect with the network?</h2>
          <p className="text-emerald-50 mb-6 max-w-2xl">
            Explore member profiles, continue conversations, and stay updated from your dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition"
              onClick={() => navigate("/admin/members/")}
            >
              Browse Members
            </button>
            <button
              className="px-5 py-2.5 border border-emerald-200 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
              onClick={() => navigate("/admin/chat")}
            >
              Open Chat
            </button>
          </div>
        </section>
      </div>

      <Footer />

      <style>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HomePage;
