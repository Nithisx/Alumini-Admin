import React, { useState } from 'react';
import Header from './about_components/Header';
import Footer from './about_components/Footer';
import AccordionSection from './about_components/Accordition_Section';
import AdminSubSection from './about_components/AdminSubSection';
import Leadership from './about_components/LeadershipSection';
import Faculty from './about_components/FacultySection';
import Departments from './about_components/DepartmentsSection';
import { faBuilding, faLightbulb, faUsers, faUserTie, faGraduationCap, faSitemap, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import OverviewSection from './about_components/OverviewSection';
import VisionMissionSection from './about_components/VisionMissionSection';

library.add(faChevronDown, faChevronUp, faBuilding, faLightbulb, faUsers, faUserTie, faGraduationCap, faSitemap);

const About = () => {
  const [openSections, setOpenSections] = useState({
    overview: true,
    visionMission: false,
    administration: false,
  });

  const [openAdminSubSections, setOpenAdminSubSections] = useState({
    leadership: false,
    faculty: false,
    departments: false,
  });

  const toggleSection = (section) => {
    setOpenSections({ ...openSections, [section]: !openSections[section] });
  };

  const toggleAdminSubSection = (subsection) => {
    setOpenAdminSubSections({ ...openAdminSubSections, [subsection]: !openAdminSubSections[subsection] });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-center mb-12">
            <div className="w-24 h-24 bg-blue-100 rounded-full mr-4 flex items-center justify-center">
              <span className="text-blue-800 font-bold text-xl">KAHE</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-blue-800">About KAHE</h1>
              <h2 className="text-xl text-gray-600">Karpagam Academy of Higher Education</h2>
            </div>
          </div>

          {/* Overview */}
          <AccordionSection
            title="Overview"
            icon={faBuilding}
            isOpen={openSections.overview}
            onToggle={() => toggleSection('overview')}
          >
           <OverviewSection/>
          </AccordionSection>

          {/* Vision & Mission */}
          <AccordionSection
            title="Vision & Mission"
            icon={faLightbulb}
            isOpen={openSections.visionMission}
            onToggle={() => toggleSection('visionMission')}
          >
            <VisionMissionSection/>
          </AccordionSection>

          {/* Administration */}
          <AccordionSection
            title="Administration"
            icon={faUsers}
            isOpen={openSections.administration}
            onToggle={() => toggleSection('administration')}
          >
            {/* Nested Sub Sections */}
            <AdminSubSection
              title="Board of Trustees"
              icon={faUserTie}
              isOpen={openAdminSubSections.leadership}
              onToggle={() => toggleAdminSubSection('leadership')}
            >
              <Leadership />
            </AdminSubSection>

            <AdminSubSection
              title="Chancellor"
              icon={faGraduationCap}
              isOpen={openAdminSubSections.faculty}
              onToggle={() => toggleAdminSubSection('faculty')}
            >
              <Faculty />
            </AdminSubSection>

            <AdminSubSection
              title="Vice Chancellor"
              icon={faSitemap}
              isOpen={openAdminSubSections.departments}
              onToggle={() => toggleAdminSubSection('departments')}
            >
              <Departments />
            </AdminSubSection>
          </AccordionSection>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
