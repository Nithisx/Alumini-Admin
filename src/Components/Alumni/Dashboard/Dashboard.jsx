import React, { useState, useEffect, useCallback } from "react";
import Herosection from "../../../Pages/Herosection";
import { format } from "date-fns";
import Footer from "../../../Pages/about_components/Footer";
import ChapterDistributionSection from "../../Shared/ChapterDistributionSection";

const HomePage = () => {
  const [data, setData] = useState(null);
  const [countryDistribution, setCountryDistribution] = useState({ chapters: [] });
  const [cityStateDistribution, setCityStateDistribution] = useState({ city_chapters: [], state_chapters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsSlide, setNewsSlide] = useState(0);
  const BASE_URL = "https://api.karpagamalumni.in/api/v1";
  const MEDIA_BASE_URL = "https://api.karpagamalumni.in";
  const token = localStorage.getItem("Token");

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading your feed…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full text-center border border-gray-100">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h3>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition">
          Try Again
        </button>
      </div>
    </div>
  );

  const formatDate = (d) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

  const stats = [
    { label: "Members", value: data.total_users, color: "bg-emerald-500", path: "/alumni/members/", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Events", value: data.upcoming_event, color: "bg-violet-500", path: "/alumni/event/", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Albums", value: data.albums_count, color: "bg-pink-500", path: "/alumni/albums/", icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "News", value: data.new_users, color: "bg-amber-500", path: "/alumni/news/", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <Herosection />
      </div>

      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 py-6 space-y-8">

        {/* ── Stats strip (Instagram Stories style) ── */}
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className={`w-16 h-16 ${s.color} rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ring-2 ring-white ring-offset-2 ring-offset-gray-50`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={s.icon} />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-800 leading-none">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Latest Albums (Instagram grid) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Photo Gallery</h2>
            <button onClick={() => navigate("/alumni/albums/")} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              See all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
            {data.latest_album_images?.slice(0, 6).map((album, i) => (
              <div
                key={album.id}
                onClick={() => navigate(`/alumni/albums/${album.id}/`)}
                className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100"
              >
                {album.cover_image ? (
                  <img src={`${MEDIA_BASE_URL}${album.cover_image}`} alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs font-semibold truncate">{album.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Featured News (Instagram post card style) ── */}
        {data.featured_news?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Latest News</h2>
              <button onClick={() => navigate("/alumni/news/")} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                See all
              </button>
            </div>
            <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                    className="w-full aspect-video object-cover"
                  />
                  {/* Caption */}
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-900 mb-1">{news.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{news.content}</p>
                  </div>
                </div>
              ))}
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
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Upcoming Events</h2>
            <button onClick={() => navigate("/alumni/event/")} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              See all
            </button>
          </div>
          <div className="space-y-3">
            {Array.isArray(data.upcoming_events) && data.upcoming_events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/alumni/event/${event.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                {event.images?.[0]?.image && (
                  <img src={`${MEDIA_BASE_URL}${event.images[0].image}`} alt={event.title}
                    className="w-full h-44 object-cover" />
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
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Chapter Distribution + New Members ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <ChapterDistributionSection
              countryDistribution={countryDistribution}
              cityStateDistribution={cityStateDistribution}
            />
          </section>

          {/* New Members (Instagram suggest panel) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">New Members</h2>
              <button onClick={() => navigate("/alumni/members/")} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                See all
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {data.latest_members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => navigate(`/alumni/members/${member.username}/`)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {member.profile_photo ? (
                    <img src={`${MEDIA_BASE_URL}${member.profile_photo}`} alt={member.first_name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100" />
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
        </div>
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
