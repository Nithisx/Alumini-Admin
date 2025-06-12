import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faUserTie } from "@fortawesome/free-solid-svg-icons";

const BoardOfTrustees = ({ isOpen, toggleSection }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faUserTie} className="text-blue-600 mr-2" />
          <h4 className="text-lg font-medium">Board of Trustees</h4>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-gray-600"
        />
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-6">
            {/* President Section - Detailed */}
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs text-center">Photo placeholder</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="text-2xl font-bold text-blue-800 mb-2">Dr. R. Vasanthakumar</h5>
                  <p className="text-lg text-blue-600 font-semibold mb-4">President, Karpagam Charity Trust</p>
                  
                  <div className="prose max-w-none text-sm">
                    <p className="mb-3">
                      Dr. R. Vasanthakumar, a philanthropist par excellence and our founder promoter, is the President of Karpagam Academy of Higher Education. An enterprising industrialist, he is the Chairman and Managing Director of Karpagam Industries Private Limited, Bannariamman Engineering Industries Private Limited, Karpagam Yarns Private Limited, Karpagambigai Investments Limited and Karpagam Infrastructure Private Limited that together employ over 700 personnel.
                    </p>
                    
                    <p className="mb-3">
                      A Gold Medalist from Madras University, he graduated with Honours in Electrical & Electronics Engineering. It is probably his deep-rooted academic interest that has fuelled Dr. R. Vasanthakumar's endeavours in the field of education.
                    </p>
                    
                    <p className="mb-3">
                      Besides education, Dr. R. Vasanthakumar is a renowned name in myriad philanthropic causes. His contribution to temple maintenance and renovation of dilapidated temples is priceless. He has also been instrumental in incepting the Panniru Thirumurai Aaivu Mayyam which is involved in Research of Ancient Tamil Saivism Literature like Thevaram, Thiruvasagam & Saiva Siddantham and spreading Saivism by conducting conferences and seminars once in 2 months.
                    </p>
                    
                    <div className="bg-white p-4 rounded-lg mb-3">
                      <h6 className="font-semibold text-blue-700 mb-2">Notable Achievements & Recognitions:</h6>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Honorary Doctorate conferred by Avinashilingam University in 2004</li>
                        <li>Awarded "Kongu Nattu Sathanaiyalar" title by NIA Institutions, Pollachi on the 51st Founder's day of Shri. Nachimuthu Gounder</li>
                        <li>President of COSIEMA (Coimbatore Sidco Industrial Estate Management Association) during 1998 and 2000</li>
                        <li>President of Tamil Nadu Private College Management Association (Coimbatore Chapter) during 2000-2002</li>
                        <li>President of ENFUSE (Energy & fuel User's Association) Coimbatore Chapter</li>
                        <li>Corporate Member of the Coimbatore Stock Exchange</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg mb-3">
                      <h6 className="font-semibold text-blue-700 mb-2">Professional Memberships:</h6>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Confederation of Indian Industry</li>
                        <li>Indian Chamber of Commerce</li>
                        <li>Indo-German Chamber of Commerce</li>
                        <li>COSIEMA (Coimbatore Sidco Industrial Estate Management Association)</li>
                        <li>CODISSIA (Coimbatore District Small Scale Industries Association)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <h6 className="font-semibold text-blue-700 mb-2">Educational Leadership:</h6>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Governing Council Member of Sri Ramakrishna Mission Vidyalaya Polytechnic College</li>
                        <li>Governing Council Member of Sri Dhandayuthapani Polytechnic College</li>
                        <li>Governing Council Member of Thavathiru Santhalinga Adigalar Tamil College</li>
                        <li>Active in Renovation Committees of many SHIVA Temples</li>
                      </ul>
                    </div>
                    
                    <p className="mt-3 italic text-blue-700">
                      Dr. R. Vasanthakumar's extensive travelling has taken him around the world, primarily to the United States of America, Germany, Italy, Turkey, Japan, Malaysia, Singapore and Switzerland. His rich experience and expertise continues to be a source of great inspiration to everyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Other Leadership Members */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-semibold text-blue-700 mb-1">Dr. S. Geethalakshmi</h5>
                <p className="text-sm text-gray-500 mb-2">Vice Chancellor</p>
                <p className="text-sm">
                  Leading the institution with over 25 years of academic and administrative experience.
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-semibold text-blue-700 mb-1">Dr. M. Palaniswamy</h5>
                <p className="text-sm text-gray-500 mb-2">Registrar</p>
                <p className="text-sm">
                  Overseeing administrative functions with expertise in educational administration.
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
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
  );
};

export default BoardOfTrustees;
