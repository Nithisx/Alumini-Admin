import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PageTransition from '../Shared/PageTransition';

// Admin UI Components
import AdminHeader from './AdminHeader';
import RegisterRequestPage from './Auth/LoginRequest';
import Addpost from './Post/Addpost';
import AddEvent from './Events/Addevents';
import AlbumsPage from './Albums/Albums';
import AlbumDetailPage from './Albums/Albumsdetails';
import StudentImageUpload from './Albums/Students';
import Map from './Map.jsx/Map';
import NewsRoom from './News/News';
import Members from './Members/Members';
import Dashboard from './Dashboard/Dashboard';
import Birthday from "./Birthday/Birthday";
import EditEvent from './Events/Editevent';
import BusinessDirectory from './Business/BusinessDirectory';
import BusinessDetail from './Business/BusinessDetail';
import Myprofile from "./Myprofile/Myprofile";
import {
  EventDetailView,
  NewsDetailView,
  MemberDetailView,
  BusinessDetailView,
  JobDetailView,
} from "../Shared/detail";
import Mycontribution from "./Mycontribution/Mycontributation";
import SendMail from "./mail/sendmail";
import Chart from "./Chat/Chat"
import AuditPage from "./Audit/AuditPage";
import ChapterDetail from "../Shared/ChapterDetail";
import MemberImport from "./MemberImport/MemberImport";
import { NotificationProvider } from "../Shared/NotificationProvider.jsx";
import NotificationPromptModal from "../Shared/NotificationPromptModal.jsx";
const AdminLayout = () => {
  const location = useLocation();
  return (
    <NotificationProvider>
      <NotificationPromptModal />
      <div>
        {/* Admin Header */}
        <AdminHeader />

        {/* Main Content */}
        <main className="role-content w-full min-w-0 p-0 pb-14 lg:pb-0">
          <PageTransition transitionKey={location.pathname}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="register-request" element={<RegisterRequestPage />} />
            <Route path="event" element={<AddEvent />} />
            <Route path="albums" element={<AlbumsPage />} />
            <Route path="albums/:albumId" element={<AlbumDetailPage />} />
            <Route path="students" element={<StudentImageUpload />} />
            <Route path="map" element={<Map />} />
            <Route path="news" element={<NewsRoom />} />
            <Route path="news/:id" element={<NewsDetailView basePath="/admin" />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:name" element={<MemberDetailView basePath="/admin" />} />
            <Route path="jobs" element={<Addpost />} />
            <Route path="jobs/:id" element={<JobDetailView basePath="/admin" />} />
            <Route path="birthday" element={<Birthday />} />
            <Route path="event/:id" element={<EventDetailView basePath="/admin" />} />
            <Route path="event/:id/edit" element={<EditEvent />} />
            <Route path="business" element={<BusinessDirectory />} />
            <Route path="business/add" element={<BusinessDetail />} />
            <Route path="business/edit/:id" element={<BusinessDetail />} />
            <Route path="business/:id" element={<BusinessDetail />} />
            <Route path="business/view/:id" element={<BusinessDetailView basePath="/admin" />} />
            <Route path="my-profile" element={<Myprofile />} />
            <Route path="my-contribution" element={<Mycontribution />} />
            <Route path="sendmail" element={<SendMail />} />
            <Route path="chat" element={<Chart />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="chapters/:type/:value" element={<ChapterDetail />} />
            <Route path="import-members" element={<MemberImport />} />
            {/* Add more admin routes if needed */}
          </Routes>
          </PageTransition>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default AdminLayout;
