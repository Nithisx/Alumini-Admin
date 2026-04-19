import React, { useState } from "react";
import { Briefcase, Calendar, Newspaper, Building, Image } from "lucide-react";
import Jobs from "./Jobcontribution";
import Events from "./Eventcontributation";
import News from "./Newscontribution";
import Bussiness from "./Businesscontribution";
import Albums from "./Albumscontribution";

const tabs = [
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "events", label: "Events", icon: Calendar },
  { key: "news", label: "News", icon: Newspaper },
  { key: "bussiness", label: "Business", icon: Building },
  { key: "albums", label: "Albums", icon: Image },
];

const MyContributions = () => {
  const [activeTab, setActiveTab] = useState("jobs");

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-gray-900 mb-3">My Contributions</h1>
          {/* Tab bar */}
          <div className="flex overflow-x-auto scrollbar-hide gap-1 pb-0.5">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  activeTab === key
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
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
