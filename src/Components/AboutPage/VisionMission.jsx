import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faLightbulb } from "@fortawesome/free-solid-svg-icons";

const VisionMission = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faLightbulb} className="text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold">Vision & Mission</h3>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-blue-600"
        />
      </button>
      
      {isOpen && (
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
  );
};

export default VisionMission;
