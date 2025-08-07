import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import BoardOfTrustees from "./BoardOfTrustees";
import Chancellor from "./Chancellor";
import ViceChancellor from "./ViceChancellor";
import Registrar from "./Registrar";

const Administration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubSections, setOpenSubSections] = useState({
    boardOfTrustees: false,
    chancellor: false,
    viceChancellor: false,
    registrar: false,
  });

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubSection = (subsection) => {
    setOpenSubSections((prev) => ({
      ...prev,
      [subsection]: !prev[subsection],
    }));
    console.log(`Toggling ${subsection}:`, !openSubSections[subsection]); // Debug log
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
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
              isOpen={openSubSections.boardOfTrustees}
              toggleSection={() => toggleSubSection("boardOfTrustees")}
            />
            <Chancellor
              isOpen={openSubSections.chancellor}
              toggleSection={() => toggleSubSection("chancellor")}
            />
            <ViceChancellor
              isOpen={openSubSections.viceChancellor}
              toggleSection={() => toggleSubSection("viceChancellor")}
            />
            <Registrar
              isOpen={openSubSections.registrar}
              toggleSection={() => toggleSubSection("registrar")}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
