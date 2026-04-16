"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Jobs from "./Jobcontribution";
import Events from "./Eventcontributation";
import News from "./Newscontribution";
import Bussiness from "./Businesscontribution";
import Albums from "./Albumscontribution";

// Mock COLORS object since we don't have the theme file
const COLORS = {
  primary: "#3b82f6",
  text: "#1f2937",
};

const MyContributions = () => {
  const [activeTab, setActiveTab] = useState("jobs");

  const handleGoBack = () => {
    // In a real app, this would use router.back() or navigate(-1)
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold ml-2 text-gray-900">
          My Contributions
        </h1>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 text-center ${
            activeTab === "jobs"
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("jobs")}
        >
          Jobs
        </button>
        <button
          className={`flex-1 py-3 text-center ${
            activeTab === "events"
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("events")}
        >
          Events
        </button>
        <button
          className={`flex-1 py-3 text-center ${
            activeTab === "news"
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("news")}
        >
          News
        </button>
          <button
          className={`flex-1 py-3 text-center ${
            activeTab === "bussiness"
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("bussiness")}
        >
          Bussiness
        </button>
        <button
          className={`flex-1 py-3 text-center ${
            activeTab === "albums"
              ? "border-b-2 border-blue-500 text-blue-500 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("albums")}
        >
          Albums
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "jobs" && <Jobs />}
        {activeTab === "events" && <Events />}
        {activeTab === "news" && <News />}
        {activeTab === "bussiness" && <Bussiness />}
        {activeTab === "albums" && <Albums />}
      </div>
    </div>
  );
};

export default MyContributions;
