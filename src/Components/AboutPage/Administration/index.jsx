import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faUsers } from "@fortawesome/free-solid-svg-icons";
import BoardOfTrustees from "./BoardOfTrustees";
import Chancellor from "./Chancellor";
import ViceChancellor from "./ViceChancellor";

const Administration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubSections, setOpenSubSections] = useState({
    leadership: false,
    faculty: false,
    departments: false
  });

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubSection = (subsection) => {
    setOpenSubSections({
      ...openSubSections,
      [subsection]: !openSubSections[subsection]
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faUsers} className="text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold">Administration</h3>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-blue-600"
        />
      </button>
      
      {isOpen && (
        <div className="p-5 bg-white border-t border-gray-200">
          <div className="space-y-4">
            <BoardOfTrustees 
              isOpen={openSubSections.leadership} 
              toggleSection={() => toggleSubSection('leadership')} 
            />
            <Chancellor 
              isOpen={openSubSections.faculty} 
              toggleSection={() => toggleSubSection('faculty')} 
            />
            <ViceChancellor 
              isOpen={openSubSections.departments} 
              toggleSection={() => toggleSubSection('departments')} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
