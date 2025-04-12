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

const AdminLayout = () => {
  return (
    <div className="flex">
      {/* Admin Header (Sidebar) */}
      <AdminHeader />

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100 ml-64">
        <Routes>
          <Route path="dashboard" element={<Addpost />} />
          
          <Route path="event" element={<AddEvent />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="students" element={<StudentImageUpload />} />
          <Route path="map" element={<Map />} />
          {/* Add more admin routes if needed */}
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;
