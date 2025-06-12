import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faGraduationCap } from "@fortawesome/free-solid-svg-icons";

const Chancellor = ({ isOpen, toggleSection }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600 mr-2" />
          <h4 className="text-lg font-medium">Chancellor</h4>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-gray-600"
        />
      </button>
      
      {isOpen && (
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
  );
};

export default Chancellor;
