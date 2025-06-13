import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './about_components/Footer';
import { faBuilding, faLightbulb, faUsers, faUserTie, faGraduationCap, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import OverviewSection from './about_components/OverviewSection';
import VisionMissionSection from './about_components/VisionMissionSection';
import Leadership from './about_components/LeadershipSection';
import Faculty from './about_components/FacultySection';
import Departments from './about_components/DepartmentsSection';
import Logo from "../images/logo.png"; // Assuming you have a logo image
const About = () => {
  // Track the active section based on URL hash
  const [activeSection, setActiveSection] = useState('overview');
  const [activeAdminSection, setActiveAdminSection] = useState(null);

  // Handle URL hash changes
  useEffect(() => {
    // Default to overview if no hash
    const hash = window.location.hash.replace('#', '') || 'overview';
    setActiveSection(hash);
    
    // If administration section is active, set default admin subsection
    if (hash === 'administration') {
      setActiveAdminSection('leadership');
    }
    
    // Add event listener for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '') || 'overview';
      setActiveSection(newHash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle admin sub-section changes
  const handleAdminSectionChange = (section) => {
    setActiveAdminSection(section);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
      <Header />
      <div className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-center mb-12">
            <img
              src={Logo}
              alt="KAHE Logo"
              className="w-28 h-28 rounded-lg mr-4 object-contain bg-white shadow"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-800">About KAHE</h1>
              <h2 className="text-xl text-green-600">Karpagam Academy of Higher Education</h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex mb-8 overflow-x-auto pb-2">
            <button 
              onClick={() => {window.location.hash = 'overview'; setActiveSection('overview');}}
              className={`px-5 py-2 mx-1 rounded-full font-medium ${activeSection === 'overview' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-700 hover:bg-green-50'}`}
            >
              <FontAwesomeIcon icon={faBuilding} className="mr-2" />
              Overview
            </button>
            
            <button 
              onClick={() => {window.location.hash = 'vision-mission'; setActiveSection('vision-mission');}}
              className={`px-5 py-2 mx-1 rounded-full font-medium ${activeSection === 'vision-mission' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-700 hover:bg-green-50'}`}
            >
              <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
              Vision & Mission
            </button>
            
            <button 
              onClick={() => {window.location.hash = 'administration'; setActiveSection('administration'); setActiveAdminSection('leadership');}}
              className={`px-5 py-2 mx-1 rounded-full font-medium ${activeSection === 'administration' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-700 hover:bg-green-50'}`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              Administration
            </button>
          </div>
          
          {/* Content Sections */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            {activeSection === 'overview' && (
              <div id="overview">
                <h2 className="text-2xl font-bold text-green-800 mb-6">Overview</h2>
                <OverviewSection />
              </div>
            )}
            
            {activeSection === 'vision-mission' && (
              <div id="vision-mission">
                <h2 className="text-2xl font-bold text-green-800 mb-6">Vision & Mission</h2>
                <VisionMissionSection />
              </div>
            )}
            
            {activeSection === 'administration' && (
              <div id="administration">
                <h2 className="text-2xl font-bold text-green-800 mb-6">Administration</h2>
                
                {/* Admin Sub-navigation */}
                <div className="flex mb-8 overflow-x-auto pb-2 border-b border-green-100">
                  <button 
                    onClick={() => handleAdminSectionChange('leadership')}
                    className={`px-4 py-2 mr-2 ${activeAdminSection === 'leadership' ? 'border-b-2 border-green-600 text-green-700 font-medium' : 'text-gray-600 hover:text-green-700'}`}
                  >
                    <FontAwesomeIcon icon={faUserTie} className="mr-2" />
                    Board of Trustees
                  </button>
                  
                  <button 
                    onClick={() => handleAdminSectionChange('faculty')}
                    className={`px-4 py-2 mr-2 ${activeAdminSection === 'faculty' ? 'border-b-2 border-green-600 text-green-700 font-medium' : 'text-gray-600 hover:text-green-700'}`}
                  >
                    <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                    Chancellor
                  </button>
                  
                  <button 
                    onClick={() => handleAdminSectionChange('departments')}
                    className={`px-4 py-2 mr-2 ${activeAdminSection === 'departments' ? 'border-b-2 border-green-600 text-green-700 font-medium' : 'text-gray-600 hover:text-green-700'}`}
                  >
                    <FontAwesomeIcon icon={faSitemap} className="mr-2" />
                    Vice Chancellor
                  </button>
                </div>
                
                {/* Admin Content */}
                {activeAdminSection === 'leadership' && <Leadership />}
                {activeAdminSection === 'faculty' && <Faculty />}
                {activeAdminSection === 'departments' && <Departments />}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;