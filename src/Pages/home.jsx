"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Header from "./Header.jsx";
import Herosection from "./Herosection.jsx";
import Image1 from "../images/image1.jpeg";
import Image2 from "../images/image2.jpg";
import Image3 from "../images/image3.jpg";
import Footer from "../Pages/about_components/Footer.jsx";
import Loader from "./Loder.jsx";
export default function Home() {
  const [data, setData] = useState({
    upcoming_events: [],
    latest_album_images: [],
    latest_members: [],
    chapters: [],
    featured_news: [],
    total_users: 0,
    new_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsSlide, setNewsSlide] = useState(0);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Hide loader after 4 seconds
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://134.209.157.195:8000/home/");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-slide for hero carousel
  useEffect(() => {
    if (data.latest_album_images.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % data.latest_album_images.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [data.latest_album_images.length]);

  // Auto-slide for news carousel
  useEffect(() => {
    if (data.featured_news.length > 0) {
      const timer = setInterval(() => {
        setNewsSlide((prev) => (prev + 1) % data.featured_news.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [data.featured_news.length]);

  // Scroll to element if hash is present in URL
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  if (showLoader) {
    return <Loader />;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Alumni Portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="p-8 bg-red-50 rounded-xl border border-red-200 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Connection Error
          </h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Herosection />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-70">
        {/* Statistics Section */}
        <section className="py-20 ">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
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
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">
                    {data.total_users.toLocaleString()}
                  </h3>
                  <p className="text-gray-600 font-medium">Total Alumni</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">
                    {data.new_users.toLocaleString()}
                  </h3>
                  <p className="text-gray-600 font-medium">New Members</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">
                    {data.chapters.length}
                  </h3>
                  <p className="text-gray-600 font-medium">Active Chapters</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">
                    {data.upcoming_events}
                  </h3>
                  <p className="text-gray-600 font-medium"> Events</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured News Slider */}
        {data.featured_news.length > 0 && (
          <section className="py-20 " id="news-section">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Latest News & Updates
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Stay informed with the latest achievements and stories from
                  our alumni community
                </p>
              </div>

              <div className="relative max-w-6xl mx-auto">
                <div className="overflow-hidden rounded-3xl shadow-2xl">
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                        <div className="relative">
                          <img
                            src={`http://134.209.157.195:8000${news.thumbnail}`}
                            alt={news.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
                              {news.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                          <div className="mb-4">
                            <span className="text-blue-600 font-semibold text-sm">
                              {format(
                                new Date(news.published_on),
                                "MMMM dd yyyy"
                              )}
                            </span>
                          </div>
                          <h3 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                            {news.title}
                          </h3>
                          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                            {news.content}
                          </p>
                          <div className="flex items-center">
                            <img
                              src={`http://134.209.157.195:8000${news.user.profile_photo}`}
                              alt={`${news.user.first_name} ${news.user.last_name}`}
                              className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-blue-200"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{`${news.user.first_name} ${news.user.last_name}`}</p>
                              <p className="text-gray-600 text-sm">
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
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
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
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
                <div className="flex justify-center mt-8 space-x-2">
                  {data.featured_news.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setNewsSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === newsSlide ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {data.upcoming_events.length > 0 && (
          <section className="py-20 " id="events-section">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Events
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Join us for exciting events and networking opportunities
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {data.upcoming_events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      {event.images && event.images.length > 0 ? (
                        <img
                          src={`http://134.209.157.195:8000${event.images[0].image}`}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {event.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(event.from_date_time), "MMM d")}
                        </p>
                      </div>
                    </div>

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-700">
                          <svg
                            className="w-5 h-5 mr-3 text-blue-500"
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
                          <span className="font-medium">{event.venue}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg
                            className="w-5 h-5 mr-3 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">
                            {format(new Date(event.from_date_time), "h:mm a")} -{" "}
                            {format(new Date(event.end_date_time), "h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Members Section */}
        <section className="py-20" id="member-section">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
                Latest Members
              </h2>
              <p className="text-xl text-black max-w-2xl mx-auto">
                Meet our distinguished alumni making a difference worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.latest_members.slice(0, 6).map((member) => (
                <div
                  key={member.id}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-green-100"
                >
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gradient-to-r from-green-300 to-green-400 p-1">
                        <div className="w-full h-full rounded-full overflow-hidden">
                          {member.profile_photo ? (
                            <img
                              src={`http://134.209.157.195:8000${member.profile_photo}`}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-400 flex items-center justify-center">
                              <span className="text-2xl font-bold text-white">
                                {member.first_name.charAt(0)}
                                {member.last_name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-black mb-2">{`${member.first_name} ${member.last_name}`}</h3>
                    <p className="text-black font-semibold mb-2">
                      {member.current_work}
                    </p>
                    <p className="text-black mb-4">
                      {member.city}, {member.state}
                    </p>
                    <p className="text-sm text-black mb-6">
                      Class of {member.passed_out_year}
                    </p>
                    <p className="text-black font-semibold mb-2">
                      {member.role}
                    </p>
                    <div className="flex justify-center space-x-3">
                      {member.social_links?.website_link && (
                        <a
                          href={`https://${member.social_links.website_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 hover:text-green-700 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                            />
                          </svg>
                        </a>
                      )}
                      <button className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 hover:text-green-700 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-full hover:from-green-500 hover:to-green-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  const role = localStorage.getItem("role");
                  if (!token || !role) {
                    window.location.href = "/login";
                  } else if (role === "admin") {
                    window.location.href = "/admin/members";
                  } else if (role === "staff") {
                    window.location.href = "/staff/members";
                  } else if (role === "alumni") {
                    window.location.href = "/alumni/members";
                  } else {
                    window.location.href = "/login";
                  }
                }}
              >
                View All Alumni
              </button>
            </div>
          </div>
        </section>

        {/* Chapters Section */}
        <section className="py-20 " id="chapters-section">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4">
                Global Chapters
              </h2>
              <p className="text-xl text-green-700 max-w-2xl mx-auto">
                Connect with alumni chapters around the world
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.chapters.slice(0, 6).map((chapter, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-300 to-green-300 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-white"
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
                    <div>
                      <h3 className="text-lg font-bold text-green-00 leading-tight">
                        {chapter.chapter.replace("&#039;", "'")}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
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
                      <span className="text-green-700 font-semibold">
                        {chapter.member_count} Members
                      </span>
                    </div>
                    <span className="text-green-700 text-sm font-medium bg-green-100 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section
          className="py-20  text-green-900 relative overflow-hidden"
          id="contact-section"
        >
          <div className="absolute inset-0 bg-green-100/40"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Ready to Connect?
              </h2>
              <p className="text-xl md:text-2xl mb-12 text-green-700 leading-relaxed">
                Join thousands of alumni who are already part of our thriving
                community. Network, learn, and grow together.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-green-700">Community Support</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">100+</div>
                  <div className="text-green-700">Events Annually</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">Global</div>
                  <div className="text-green-700">Network Access</div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full translate-x-48 translate-y-48"></div>
        </section>
        <Footer />
      </div>
    </>
  );
}
