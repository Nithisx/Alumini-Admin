import React, { useState, useEffect, useCallback } from "react";
import image1 from "../../../images/image1.jpeg";
import image2 from "../../../images/image2.jpg";
import image3 from "../../../images/image3.jpg";
import Herosection from "../../../Pages/Herosection";
import { format } from "date-fns";
import Footer from "../../../Pages/about_components/Footer";

const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsSlide, setNewsSlide] = useState(0);
  const BASE_URL = "https://xyndrix.me/api";

  // Retrieve token directly from localStorage
  const token = localStorage.getItem("Token");

  // Navigation function using window.location
  const navigate = useCallback((path) => {
    window.location.href = path;
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Authentication token not found");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/home/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-green-100">
          <div className="w-20 h-20 border-4 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-green-800">
            Loading your dashboard...
          </p>
          <p className="text-green-600 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center  justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-red-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h3>
            <p className="text-gray-700 mb-6">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <Herosection />

        {/* Quick Stats */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 border border-green-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 mb-1 sm:mb-2">
                {data.upcoming_events}
              </p>
              <p className="text-green-600 font-medium text-sm sm:text-base">
                Upcoming Events
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-700 mb-1 sm:mb-2">
                {data.albums_count}
              </p>
              <p className="text-emerald-600 font-medium text-sm sm:text-base">
                Photo Albums
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-teal-700 mb-1 sm:mb-2">
                {data.new_users}
              </p>
              <p className="text-teal-600 font-medium text-sm sm:text-base">
                New Members
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-cyan-100 to-green-100 rounded-2xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  ></path>
                </svg>
              </div>
              <p className="text-2xl sm:text-2xl lg:text-3xl font-bold text-cyan-700 mb-1 sm:mb-2">
                {data.total_users}
              </p>
              <p className="text-cyan-600 font-medium text-sm sm:text-base">
                Total Members
              </p>
            </div>
          </div>
        </div>

        {/* Featured News */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800 mb-2">
                Latest News
              </h2>
              <p className="text-green-600 text-sm sm:text-base">
                Stay updated with the latest happenings
              </p>
            </div>
            <button
              onClick={() => navigate("/staff/news/")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg flex items-center text-sm sm:text-base w-fit"
            >
              View All News
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </button>
          </div>
          {/* Featured News Slider */}
          {data.featured_news.length > 0 && (
            <section className="py-10 sm:py-16 lg:py-20" id="news-section">
              <div className="container mx-auto px-4">
                <div className="relative max-w-6xl mx-auto">
                  <div className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl">
                    {data.featured_news.map((news, index) => (
                      <div
                        key={news.id}
                        className={`transition-transform duration-700 ease-in-out ${
                          index === newsSlide
                            ? "translate-x-0"
                            : index < newsSlide
                            ? "-translate-x-full"
                            : "translate-x-full"
                        }`}
                        style={{
                          display: index === newsSlide ? "block" : "none",
                        }}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px] sm:min-h-[500px]">
                          <div className="relative order-1 lg:order-1">
                            <img
                              src={`https://xyndrix.me/api${news.thumbnail}`}
                              alt={news.title}
                              className="w-full h-64 sm:h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                                {news.category}
                              </span>
                            </div>
                          </div>
                          <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white order-2 lg:order-2">
                            <div className="mb-3 sm:mb-4">
                              <span className="text-blue-600 font-semibold text-xs sm:text-sm">
                                {format(
                                  new Date(news.published_on),
                                  "MMMM d, yyyy"
                                )}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                              {news.title}
                            </h3>
                            <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed line-clamp-3 sm:line-clamp-none">
                              {news.content}
                            </p>
                            <div className="flex items-center">
                              <img
                                src={`https://xyndrix.me/api${news.user.profile_photo}`}
                                alt={`${news.user.first_name} ${news.user.last_name}`}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4 object-cover border-2 border-blue-200"
                              />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">{`${news.user.first_name} ${news.user.last_name}`}</p>
                                <p className="text-gray-600 text-xs sm:text-sm">
                                  Alumni Contributor
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation buttons */}
                  <button
                    onClick={() =>
                      setNewsSlide(
                        (prev) =>
                          (prev - 1 + data.featured_news.length) %
                          data.featured_news.length
                      )
                    }
                    className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setNewsSlide(
                        (prev) => (prev + 1) % data.featured_news.length
                      )
                    }
                    className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* Slide indicators */}
                  <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
                    {data.featured_news.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setNewsSlide(index)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                          index === newsSlide ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}{" "}
        </section>

        {/* Upcoming Events */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800 mb-2">
                Upcoming Events
              </h2>
              <p className="text-green-600 text-sm sm:text-base">
                Don't miss out on these exciting events
              </p>
            </div>
            <button
              onClick={() => navigate("/staff/event/")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg flex items-center text-sm sm:text-base w-fit"
            >
              View All Events
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {Array.isArray(data.upcoming_events) ? (
              data.upcoming_events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-green-100"
                  onClick={() => navigate(`/staff/event/${event.id}`)}
                >
                  {event.images && event.images[0] ? (
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <img
                        src={`${BASE_URL}${event.images[0].image}`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 to-transparent"></div>
                      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-1 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-lg">
                        {formatDate(event.from_date_time)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 h-48 sm:h-56 flex items-center justify-center relative overflow-hidden">
                      <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                    </div>
                  )}

                  <div className="p-4 sm:p-6 lg:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-800 line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="flex items-start mb-2 sm:mb-3">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <div>
                        <p className="text-gray-700 font-medium text-sm sm:text-base">
                          {formatDate(event.from_date_time)}
                          {event.to_date_time &&
                            ` - ${formatDate(event.to_date_time)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start mb-4 sm:mb-6">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      <p className="text-gray-700 font-medium text-sm sm:text-base line-clamp-1">
                        {event.venue}
                      </p>
                    </div>

                    <p className="text-gray-600 mb-4 sm:mb-6 line-clamp-2 leading-relaxed text-sm sm:text-base">
                      {event.description}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/staff/event/${event.id}`);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 sm:py-10 bg-white rounded-xl shadow-md">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-700">
                  No upcoming events
                </h3>
                <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                  Check back later for new events
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {/* Latest Photo Albums */}
          <section className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-800 mb-2">
                  Photo Gallery
                </h2>
                <p className="text-green-600 text-sm sm:text-base">
                  Memories captured in time
                </p>
              </div>
              <button
                onClick={() => navigate("/staff/albums/")}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-2xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg flex items-center text-sm sm:text-base w-fit"
              >
                View Gallery
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {data.latest_album_images.map((album) => (
                <div
                  key={album.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-green-100"
                  onClick={() => navigate(`/staff/albums/${album.id}/`)}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    {album.cover_image ? (
                      <img
                        src={`${BASE_URL}${album.cover_image}`}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-200 to-emerald-300 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 opacity-60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white font-semibold px-3 sm:px-4 py-1 sm:py-2 bg-green-600/80 backdrop-blur-sm rounded-lg sm:rounded-xl text-xs sm:text-sm">
                        View Album
                      </span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="font-bold text-green-800 mb-1 sm:mb-2 truncate text-base sm:text-lg">
                      {album.title}
                    </h3>
                    <p className="text-green-600 text-xs sm:text-sm truncate">
                      {album.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chapters Section */}
            <section className="py-12 sm:py-16 lg:py-20" id="chapters-section">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12 sm:mb-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900 mb-3 sm:mb-4">
                    Global Chapters
                  </h2>
                  <p className="text-lg sm:text-xl text-green-700 max-w-2xl mx-auto">
                    Connect with alumni chapters around the world
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {data.chapters.slice(0, 6).map((chapter, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100"
                    >
                      <div className="flex items-center mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-300 to-green-300 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-green-800 leading-tight line-clamp-2">
                            {chapter.chapter.replace("&#039;", "'")}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className="text-green-700 font-semibold text-sm sm:text-base">
                            {chapter.member_count} Members
                          </span>
                        </div>
                        <span className="text-green-700 text-xs sm:text-sm font-medium bg-green-100 px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>

          {/* New Members */}
          <section className="lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 mb-2">
                  New Members
                </h2>
                <p className="text-green-600 text-sm sm:text-base">
                  Welcome our newest alumni
                </p>
              </div>
              <button
                onClick={() => navigate("/staff/members/")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg text-xs sm:text-sm flex items-center w-fit"
              >
                View All
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-green-100">
              {data.latest_members.map((member, index) => (
                <div
                  key={member.id}
                  className={`flex items-center py-3 sm:py-4 cursor-pointer hover:bg-green-50/80 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-all duration-200 group ${
                    index !== data.latest_members.length - 1
                      ? "border-b border-green-100"
                      : ""
                  }`}
                  onClick={() => navigate(`/staff/members/${member.username}/`)}
                >
                  <div className="mr-3 sm:mr-4 relative">
                    {member.profile_photo ? (
                      <img
                        src={`${BASE_URL}${member.profile_photo}`}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-3 border-green-200 shadow-lg group-hover:border-green-300 transition-colors"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg shadow-lg">
                        {member.first_name.charAt(0)}
                        {member.last_name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 group-hover:text-green-600 transition-colors text-sm sm:text-base">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-green-600 font-medium">
                      {member.role || "Alumni Member"}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
