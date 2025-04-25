import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Staff UI Components
import AdminHeader from './StaffHeader';
import Addpost from './Post/Addpost';
import AddEvent from './Events/Addevents';
import AlbumsPage from './Albums/Albums';
import AlbumDetailPage from './Albums/Albumsdetails';
import StudentImageUpload from './Albums/Students';
import Map from './Map.jsx/Map';
import NewsRoom from './News/News';
import SingleNews from './News/Singlenews';
import Members from './Members/Members';
import Singlemember from './Members/Singlemember';
import Dashboard from './Dashboard/Dashboard';
import Birthday from "./Birthday/Birthday"
import Singleevents from './Events/Singleevents';
const AdminLayout = () => {
  return (
    <div className="flex">
      {/* Admin Header (Sidebar) */}
      <AdminHeader />

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100 ml-64">
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
          {/* Add more routes as needed */}
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;
