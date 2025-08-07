import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

const Registrar = ({ isOpen, toggleSection }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button 
        onClick={toggleSection}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800">Registrar</h3>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-blue-600"
        />
      </button>
      
      {isOpen && (
        <div className="p-5 bg-white border-t border-gray-200">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <img
                src="https://kahedu.edu.in/n/wp-content/uploads/2025/06/Pradeep-B-V_Registr.jpg"
                alt="Prof. Dr. B. V. Pradeep"
                className="w-48 h-60 object-cover rounded-lg shadow-lg border-4 border-purple-100"
                onError={(e) => {
                  console.log("Image failed to load:", e.target.src);
                  e.target.src = "https://via.placeholder.com/200x250/8b5cf6/ffffff?text=Prof.+Dr.+B.V.+Pradeep";
                }}
              />
              <div className="text-center mt-3">
                <p className="font-semibold text-gray-800">Prof. Dr. B. V. Pradeep</p>
                <p className="text-purple-600 font-medium">Registrar</p>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Prof. Dr. B. V. Pradeep, Registrar, Karpagam Academy of Higher Education is a person with caliber who manages the resources, responsibly, effectively and efficiently. He has started his career in the year 1999 as Lecturer, currently he has more than 25 years of experience.
              </p>
              <p className="text-gray-600 mb-4">
                He is basically a Microbiologist, did his M.Sc. Applied Microbiology from University of Madras, and Ph.D., in Microbiology from Bharathiar University. He has published more than fifty-two research articles/ book chapters in various SCI/Scopus/Peer reviewed International and National journals.
              </p>
              <p className="text-gray-600 mb-4">
                Google Scholar citation of 1201, h-index of 16 and i10-index of 21. His areas of specializations are Microbial secondary metabolites, probiotics and microbial pigments.
              </p>
              
              <div className="mt-6">
                <p className="text-gray-600 mb-3 font-medium">Administrative Positions held:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Head of the Department of Microbiology</li>
                  <li>Deputy Registrar</li>
                  <li>Director of Research</li>
                  <li>Member in Planning and Monitoring Board</li>
                  <li>Member in Board of Management</li>
                  <li>Member in Academic Council</li>
                  <li>Member in Board of Studies in Microbiology</li>
                  <li>Convenor in Research advisory Committee</li>
                  <li>Chairperson in Admissions and Admissions Review Committee</li>
                  <li>Coordinator of Training & Placement cell and admissions cell</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registrar;