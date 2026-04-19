import React from "react";
import { Routes, Route } from "react-router-dom";

// Staff UI Components
import StaffHeader from "./StaffHeader";
import Addpost from "./Post/Addpost";
import AddEvent from "./Events/Addevents";
import AlbumsPage from "./Albums/Albums";
import AlbumDetailPage from "./Albums/Albumsdetails";
import StudentImageUpload from "./Albums/Students";
import Map from "./Map.jsx/Map";
import NewsRoom from "./News/News";
import SingleNews from "./News/Singlenews";
import Members from "./Members/Members";
import Singlemember from "./Members/Singlemember";
import Dashboard from "./Dashboard/Dashboard";
import Birthday from "./Birthday/Birthday";
import Singleevents from "./Events/Singleevents";
import BusinessDirectory from "./Business/BusinessDirectory";
import BusinessDetail from "./Business/BusinessDetail";
import BusinessView from "./Business/BusinessView";
import Myprofile from "./Myprofile/Myprofile";
import Mycontribution from "./Mycontribution/Mycontributation";
import Chat from "./Chat/Chat";

const StaffLayout = () => {
  return (
    <div>
      {/* Staff Header */}
      <StaffHeader />

      {/* Main Content */}
      <main className="p-0 pb-14 lg:pb-0">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="event" element={<AddEvent />} />
          <Route path="event/:id" element={<Singleevents />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="students" element={<StudentImageUpload />} />
          <Route path="map" element={<Map />} />
          <Route path="news" element={<NewsRoom />} />
          <Route path="news/:id" element={<SingleNews />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:name" element={<Singlemember />} />
          <Route path="jobs" element={<Addpost />} />
          <Route path="birthday" element={<Birthday />} />
          <Route path="business" element={<BusinessDirectory />} />
          <Route path="business/:id" element={<BusinessDetail />} />
          <Route path="business/view/:id" element={<BusinessView />} />
          <Route path="my-profile" element={<Myprofile />} />
          <Route path="my-contribution" element={<Mycontribution />} />
          <Route path="chat" element={<Chat />} />
          {/* Add more routes as needed */}
        </Routes>
      </main>
    </div>
  );
};

export default StaffLayout;
