import React from 'react';
import { Routes, Route } from 'react-router-dom';

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
import SingleNews from './News/Singlenews';
import Members from './Members/Members';
import SingleMember from './Members/Singlemember';
import Dashboard from './Dashboard/Dashboard';
import Birthday from "./Birthday/Birthday";
import Singleevents from './Events/Singleevents';
import BusinessDirectory from './Business/BusinessDirectory';
import BusinessDetail from './Business/BusinessDetail';
import BusinessView from './Business/BusinessView';
import Myprofile from "./Myprofile/Myprofile";
import Mycontribution from "./Mycontribution/Mycontributation";
import SendMail from "./mail/sendmail";
import Chart from "./Chat/Chat"
import AuditPage from "./Audit/AuditPage";
const AdminLayout = () => {
  return (
    <div>
      {/* Admin Header */}
      <AdminHeader />

      {/* Main Content */}
      <main className="p-0 pb-14 lg:pb-0">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="register-request" element={<RegisterRequestPage />} />
          <Route path="event" element={<AddEvent />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="students" element={<StudentImageUpload />} />
          <Route path="map" element={<Map />} />
          <Route path="news" element={<NewsRoom />} />
          <Route path="news/:id" element={<SingleNews />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:name" element={<SingleMember />} />
          <Route path="jobs" element={<Addpost />} />
          <Route path="birthday" element={<Birthday />} />
          <Route path="event/:id" element={<Singleevents />} />
          <Route path="business" element={<BusinessDirectory />} />
          <Route path="business/:id" element={<BusinessDetail />} />
          <Route path="business/view/:id" element={<BusinessView />} />
          <Route path="my-profile" element={<Myprofile />} />
          <Route path="my-contribution" element={<Mycontribution />} />
          <Route path="sendmail" element={<SendMail />} />
          <Route path="chat" element={<Chart />} />
          <Route path="audit" element={<AuditPage />} />
          {/* Add more admin routes if needed */}
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;
