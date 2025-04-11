import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminHeader from "./Components/AdminHeader";
import RegisterRequestPage from "./Components/Auth/LoginRequest";
import Addpost from "./Components/Post/Addpost";
import AddEvent from "./Components/Events/Addevents";
import AlbumsPage from "./Components/Albums/Albums";
import AlbumDetailPage from "./Components/Albums/Albumsdetails";
import StudentImageUpload from "./Components/Albums/Students";
import Login from "./Login"
import Map from "./Components/Map.jsx/Map"

export default function App() {
  return (
    <Router>
      <div className="flex">
        {/* Sidebar */}
        <AdminHeader />

        {/* Main Content Area with left padding to avoid overlap with the sidebar */}
        <main className="flex-1 p-6 bg-gray-100 ml-64">
          <Routes>
            <Route path="/" element={<Addpost />} />
            <Route path="/register-request" element={<RegisterRequestPage />} />
            <Route path="/event" element={<AddEvent />} />
            <Route path="/albums" element={<AlbumsPage />} /> 
            <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
            <Route path="/students" element={<StudentImageUpload />} />
            <Route path="/login" element={<Login/>} />
            <Route path="/map" element={<Map />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}
