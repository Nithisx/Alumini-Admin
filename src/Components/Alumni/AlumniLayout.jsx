import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PageTransition from "../Shared/PageTransition";

// Staff UI Components
import AdminHeader from "./AluminiHeader";
import Addpost from "./Post/Addpost";
import AddEvent from "./Events/Addevents";
import AlbumsPage from "./Albums/Albums";
import AlbumDetailPage from "./Albums/Albumsdetails";
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
import StudentImageUpload from "./Albums/Albums";
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

const AlumniLayout = () => {
  const location = useLocation();
  const isChat = location.pathname.includes("/chat");
  return (
    <NotificationProvider>
      <NotificationPromptModal />
      <div>
        {/* Admin Header (Sidebar) */}
        <AdminHeader />

        {/* Main Content */}
        <main className={`role-content w-full min-w-0 p-0 ${isChat ? "" : "pb-14 lg:pb-0"}`}>
          <PageTransition transitionKey={location.pathname} className={isChat ? "h-full" : undefined}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event" element={<AddEvent />} />
            <Route path="event/:id" element={<EventDetailView basePath="/alumni" />} />
            <Route path="event/:id/edit" element={<EditEvent />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/:albumId" element={<AlbumDetailPage />} />
            <Route path="students" element={<StudentImageUpload />} />
            <Route path="map" element={<Map />} />
            <Route path="news" element={<NewsRoom />} />
            <Route path="news/:id" element={<NewsDetailView basePath="/alumni" />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:name" element={<MemberDetailView basePath="/alumni" />} />
            <Route path="jobs" element={<Addpost />} />
            <Route path="jobs/:id" element={<JobDetailView basePath="/alumni" />} />
            <Route path="birthday" element={<Birthday />} />
            <Route path="business" element={<BusinessDirectory />} />
            <Route path="business/:id" element={<BusinessDetail />} />
            <Route path="business/view/:id" element={<BusinessDetailView basePath="/alumni" />} />
            <Route path="my-profile" element={<Myprofile />} />
            <Route path="my-contribution" element={<Mycontribution />} />
            <Route path="chat" element={<Chat/>} />
            <Route path="chapters/:type/:value" element={<ChapterDetail />} />
            {/* Add more routes as needed */}
          </Routes>
          </PageTransition>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default AlumniLayout;