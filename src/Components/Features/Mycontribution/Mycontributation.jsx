import React, { useEffect, useState } from "react";
import { Briefcase, Calendar, Newspaper, Building, Image, Upload } from "lucide-react";
import Jobs from "./Jobcontribution";
import Events from "./Eventcontributation";
import News from "./Newscontribution";
import Bussiness from "./Businesscontribution";
import Albums from "./Albumscontribution";
import { clearMyPostsCache } from "../../../lib/mypostsCache";
import { PageHeader } from "../../Shared/ui";

const tabs = [
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "events", label: "Events", icon: Calendar },
  { key: "news", label: "News", icon: Newspaper },
  { key: "bussiness", label: "Business", icon: Building },
  { key: "albums", label: "Albums", icon: Image },
];

const MyContributions = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("Token");
    clearMyPostsCache(token);
    setCacheReady(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <PageHeader
        section="uploads"
        icon={<Upload className="w-4 h-4" />}
        title="My Uploads"
        maxWidth="max-w-3xl"
        below={
          <div className="flex overflow-x-auto scrollbar-hide gap-1 pb-0.5">
            {tabs.map(({ key, label, icon: Icon }) => ( // eslint-disable-line no-unused-vars
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
        }
      />

      <div className="max-w-3xl mx-auto">
        {cacheReady && (
          <>
            <div className={activeTab === "jobs" ? "block" : "hidden"}>
              <Jobs />
            </div>
            <div className={activeTab === "events" ? "block" : "hidden"}>
              <Events />
            </div>
            <div className={activeTab === "news" ? "block" : "hidden"}>
              <News />
            </div>
            <div className={activeTab === "bussiness" ? "block" : "hidden"}>
              <Bussiness />
            </div>
            <div className={activeTab === "albums" ? "block" : "hidden"}>
              <Albums />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyContributions;
