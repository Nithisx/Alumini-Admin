import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PageTransition from "../Shared/PageTransition";

// Staff UI Components
import StaffHeader from "./StaffHeader";
import Addpost from "./Post/Addpost";
import AddEvent from "./Events/Addevents";
import AlbumsPage from "./Albums/Albums";
import AlbumDetailPage from "./Albums/Albumsdetails";
import StudentImageUpload from "./Albums/Students";
import Map from "./Map.jsx/Map";
import NewsRoom from "./News/News";
import Members from "./Members/Members";
import Dashboard from "./Dashboard/Dashboard";
import Birthday from "./Birthday/Birthday";
import EditEvent from "./Events/Editevent";
import BusinessDirectory from "./Business/BusinessDirectory";
import BusinessDetail from "./Business/BusinessDetail";
import Myprofile from "./Myprofile/Myprofile";
import Mycontribution from "./Mycontribution/Mycontributation";
import Chat from "./Chat/Chat";
import {
  EventDetailView,
  NewsDetailView,
  MemberDetailView,
  BusinessDetailView,
  JobDetailView,
} from "../Shared/detail";
import ChapterDetail from "../Shared/ChapterDetail";
import { NotificationProvider } from "../Shared/NotificationProvider.jsx";
import NotificationPromptModal from "../Shared/NotificationPromptModal.jsx";

const StaffLayout = () => {
  const location = useLocation();
  return (
    <NotificationProvider>
      <NotificationPromptModal />
      <div>
        {/* Staff Header */}
        <StaffHeader />

        {/* Main Content */}
        <main className="role-content w-full min-w-0 p-0 pb-14 lg:pb-0">
          <PageTransition transitionKey={location.pathname}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event" element={<AddEvent />} />
            <Route path="event/:id" element={<EventDetailView basePath="/staff" />} />
            <Route path="event/:id/edit" element={<EditEvent />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/:albumId" element={<AlbumDetailPage />} />
            <Route path="students" element={<StudentImageUpload />} />
            <Route path="map" element={<Map />} />
            <Route path="news" element={<NewsRoom />} />
            <Route path="news/:id" element={<NewsDetailView basePath="/staff" />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:name" element={<MemberDetailView basePath="/staff" />} />
            <Route path="jobs" element={<Addpost />} />
            <Route path="jobs/:id" element={<JobDetailView basePath="/staff" />} />
            <Route path="birthday" element={<Birthday />} />
            <Route path="business" element={<BusinessDirectory />} />
            <Route path="business/add" element={<BusinessDetail />} />
            <Route path="business/edit/:id" element={<BusinessDetail />} />
            <Route path="business/:id" element={<BusinessDetail />} />
            <Route path="business/view/:id" element={<BusinessDetailView basePath="/staff" />} />
            <Route path="my-profile" element={<Myprofile />} />
            <Route path="my-contribution" element={<Mycontribution />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chapters/:type/:value" element={<ChapterDetail />} />
            {/* Add more routes as needed */}
          </Routes>
          </PageTransition>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default StaffLayout;
