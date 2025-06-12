// filepath: e:\alumini-admin-panel\Alumini-Admin\src\Pages\about.jsx
import React, { useState } from "react";
import HomeNavbar from "./components/HomeNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronDown, 
  faChevronUp, 
  faBuilding, 
  faLightbulb, 
  faUsers,
  faUserTie,
  faGraduationCap,
  faSitemap
} from "@fortawesome/free-solid-svg-icons";
import kahelogo from "../assets/kahelogo.png";

const About = () => {
  // State for tracking which accordion items are open
  const [openSections, setOpenSections] = useState({
    overview: true,
    visionMission: false,
    administration: false
  });

  // State for tracking which admin sub-sections are open
  const [openAdminSubSections, setOpenAdminSubSections] = useState({
    leadership: false,
    faculty: false,
    departments: false
  });

  // Toggle accordion sections
  const toggleSection = (section) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section]
    });
  };

  // Toggle administration sub-sections
  const toggleAdminSubSection = (subsection) => {
    setOpenAdminSubSections({
      ...openAdminSubSections,
      [subsection]: !openAdminSubSections[subsection]
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />
      
      <div className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-center mb-12">
            <img src={kahelogo} alt="KAHE Logo" className="h-24 mr-4" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-blue-800">About KAHE</h1>
              <h2 className="text-xl text-gray-600">Karpagam Academy of Higher Education</h2>
            </div>
          </div>
          
          {/* Accordion sections */}
          <div className="space-y-6">
            {/* Overview Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
                onClick={() => toggleSection('overview')}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Overview</h3>
                </div>
                <FontAwesomeIcon 
                  icon={openSections.overview ? faChevronUp : faChevronDown}
                  className="text-blue-600"
                />
              </button>
              
              {openSections.overview && (
                <div className="p-5 bg-white border-t border-gray-200">
                  <div className="prose max-w-none">
                    <p className="mb-4">
                      <strong>Karpagam Academy of Higher Education (KAHE)</strong> established under Section 3 of UGC Act 1956 is approved by Ministry of Human Resource Development, Government of India. Dr. R. Vasanthakumar, the president of Karpagam Charity trust (KCT), philanthropist, industrialist, entrepreneur and culture promoter.
                    </p>
                    <p className="mb-4">
                      Contemporary infrastructure, modern teaching methodologies, career oriented training, excellent placements and the finest faculty have always become the Karpagam's hallmark. Besides technical expertise, Karpagam Academy of Higher Education (KAHE) has made a mark since its inception by developing communication and soft skills, ensuring enlightening knowledge, extending holistic education and creating a strong value system. Today, with strength of 8000 students and over 750 teaching & non-teaching staff, Karpagam Academy of Higher Education is setting new benchmarks in the educational sphere.
                    </p>
                    
                    <h4 className="text-lg font-semibold mt-6 mb-3">Merits of Karpagam</h4>
                    <p className="mb-2">
                      Karpagam strives to offer a package of value added benefits that are tailored to nurture the educational experience of the students:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                      <li>Well experienced and trained faculty including 234 doctorates and Post Doctoral Fellows</li>
                      <li>Visiting faculty from premier institutes like IIM, IISc, IIT, NIT etc.</li>
                      <li>A professional placement department enduring training for overall personality development of students.</li>
                      <li>1182 above placement offers were made for 2021-2022 Batch</li>
                      <li>A vibrant Karpagam Research Centre marching towards fruition of innovations and patents. 59 patents were filed and 16 patents are granted. 2 of the granted patents are being commercialized.</li>
                      <li>No.of Copyrights 18 filed 16 registered</li>
                      <li>Scope to work on projects funded by government & other agencies</li>
                      <li>Industrial MoUs and career oriented courses for enhancing employability</li>
                      <li>Exchange, Twinning programme and dual degree with global universities for International exposure</li>
                      <li>Highly vibrant and encouraging academic ambience aiding an enriched education.</li>
                      <li>State of the art laboratories and Wi-fi enabled campus with 1Gbps internet connectivity.</li>
                    </ul>
                    
                    <h4 className="text-lg font-semibold mt-6 mb-3">Recognition</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Deemed to be University – Under Section 3 of UGC Act, 1956.</li>
                      <li>Approved by the Ministry of Human Resource Development, Government of India.</li>
                      <li>Approved by UGC-AICTE, New Delhi</li>
                      <li>Approved by Council of Architecture, New Delhi</li>
                      <li>Approved by Pharmacy Council of India (PCI), New Delhi</li>
                      <li>Accredited with A+ Grade by NAAC in the Second cycle</li>
                      <li>MoMSME, Govt. of India Approved Host Institution/ Business Incubator</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {/* Vision & Mission Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
                onClick={() => toggleSection('visionMission')}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faLightbulb} className="text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Vision & Mission</h3>
                </div>
                <FontAwesomeIcon 
                  icon={openSections.visionMission ? faChevronUp : faChevronDown}
                  className="text-blue-600"
                />
              </button>
              
              {openSections.visionMission && (
                <div className="p-5 bg-white border-t border-gray-200">
                  <div className="prose max-w-none">
                    <h4 className="text-xl text-blue-700 font-semibold mb-4">Vision</h4>
                    <p className="mb-6">
                      To be a center of excellence in teaching and research, producing intellectually well-developed, 
                      morally upright, socially responsible, and globally competent citizens for the benefit of humanity.
                    </p>
                    
                    <h4 className="text-xl text-blue-700 font-semibold mb-4">Mission</h4>
                    <ul className="list-disc pl-5 space-y-3">
                      <li>
                        To provide quality education accessible to all sections of society through innovative teaching, 
                        research, and extension activities.
                      </li>
                      <li>
                        To promote academic excellence through rigorous curriculum, state-of-the-art infrastructure, 
                        and conducive learning environment.
                      </li>
                      <li>
                        To foster industry-academia collaboration for knowledge creation, technology transfer, 
                        and enhancing employability skills.
                      </li>
                      <li>
                        To inculcate ethical values, leadership qualities, and social responsibility among students.
                      </li>
                      <li>
                        To contribute to the sustainable development of society through inclusive education, 
                        community engagement, and environmental consciousness.
                      </li>
                    </ul>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="italic">
                        "At KAHE, we strive for academic excellence and holistic development of our students, 
                        preparing them to be global citizens with strong ethical foundations."
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Administration Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
                onClick={() => toggleSection('administration')}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Administration</h3>
                </div>
                <FontAwesomeIcon 
                  icon={openSections.administration ? faChevronUp : faChevronDown}
                  className="text-blue-600"
                />
              </button>
              
              {openSections.administration && (
                <div className="p-5 bg-white border-t border-gray-200">
                  {/* Nested dropdowns for Administration */}
                  <div className="space-y-4">
                    {/* Leadership Team */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => toggleAdminSubSection('leadership')}
                      >
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUserTie} className="text-blue-600 mr-2" />
                          <h4 className="text-lg font-medium">Leadership Team</h4>
                        </div>
                        <FontAwesomeIcon 
                          icon={openAdminSubSections.leadership ? faChevronUp : faChevronDown}
                          className="text-gray-600"
                        />
                      </button>
                      
                      {openAdminSubSections.leadership && (
                        <div className="p-4 border-t border-gray-200">
                          <div className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                                <h5 className="font-semibold text-blue-700 mb-1">Dr. R. Vasanthakumar</h5>
                                <p className="text-sm text-gray-500 mb-2">President, Karpagam Charity Trust</p>
                                <p className="text-sm">
                                  Philanthropist, industrialist, entrepreneur and culture promoter.
                                </p>
                              </div>
                              
                              <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                                <h5 className="font-semibold text-blue-700 mb-1">Dr. S. Geethalakshmi</h5>
                                <p className="text-sm text-gray-500 mb-2">Vice Chancellor</p>
                                <p className="text-sm">
                                  Leading the institution with over 25 years of academic and administrative experience.
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                                <h5 className="font-semibold text-blue-700 mb-1">Dr. M. Palaniswamy</h5>
                                <p className="text-sm text-gray-500 mb-2">Registrar</p>
                                <p className="text-sm">
                                  Overseeing administrative functions with expertise in educational administration.
                                </p>
                              </div>
                              
                              <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                                <h5 className="font-semibold text-blue-700 mb-1">Dr. P. Balasubramanian</h5>
                                <p className="text-sm text-gray-500 mb-2">Controller of Examinations</p>
                                <p className="text-sm">
                                  Managing examination systems and ensuring transparent evaluation processes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Faculty */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => toggleAdminSubSection('faculty')}
                      >
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600 mr-2" />
                          <h4 className="text-lg font-medium">Faculty</h4>
                        </div>
                        <FontAwesomeIcon 
                          icon={openAdminSubSections.faculty ? faChevronUp : faChevronDown}
                          className="text-gray-600"
                        />
                      </button>
                      
                      {openAdminSubSections.faculty && (
                        <div className="p-4 border-t border-gray-200">
                          <p className="mb-4">
                            The institution boasts of highly qualified and experienced faculty members who are dedicated to academic excellence and research.
                          </p>
                          <div className="bg-blue-50 p-3 rounded-lg mb-4">
                            <h5 className="font-semibold mb-2">Faculty Strength:</h5>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Total faculty members: 750+</li>
                              <li>Faculty with Ph.D: 234</li>
                              <li>Post-Doctoral Fellows</li>
                              <li>Visiting faculty from premier institutes like IIM, IISc, IIT, NIT</li>
                            </ul>
                          </div>
                          <p>
                            Our faculty members actively engage in research, consultancy, and extension activities, contributing significantly to their respective fields of expertise.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Departments */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => toggleAdminSubSection('departments')}
                      >
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faSitemap} className="text-blue-600 mr-2" />
                          <h4 className="text-lg font-medium">Departments</h4>
                        </div>
                        <FontAwesomeIcon 
                          icon={openAdminSubSections.departments ? faChevronUp : faChevronDown}
                          className="text-gray-600"
                        />
                      </button>
                      
                      {openAdminSubSections.departments && (
                        <div className="p-4 border-t border-gray-200">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Engineering</h5>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Computer Science and Engineering</li>
                                <li>Electronics and Communication Engineering</li>
                                <li>Electrical and Electronics Engineering</li>
                                <li>Civil Engineering</li>
                                <li>Mechanical Engineering</li>
                              </ul>
                            </div>
                            
                            <div className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Arts & Science</h5>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Mathematics</li>
                                <li>Physics</li>
                                <li>Chemistry</li>
                                <li>Computer Science</li>
                                <li>English</li>
                              </ul>
                            </div>
                            
                            <div className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Management</h5>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Business Administration</li>
                                <li>Commerce</li>
                                <li>Financial Studies</li>
                                <li>International Business</li>
                              </ul>
                            </div>
                            
                            <div className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Health Sciences</h5>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Pharmacy</li>
                                <li>Medical Laboratory Technology</li>
                                <li>Physiotherapy</li>
                                <li>Nursing</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <img src={kahelogo} alt="KAHE Logo" className="h-8 w-8 mr-2" />
                KAHE Alumni
              </h3>
              <p className="text-gray-400">Connecting graduates and building opportunities together.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="/#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="/#contact" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-white">Alumni Login</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Pollachi Main Road, Eachanari, Coimbatore</li>
                <li>Tamil Nadu - 641021</li>
                <li>alumni@kahedu.edu.in</li>
                <li>+91 422 2619300</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Karpagam Academy of Higher Education. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;