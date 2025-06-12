import React from "react";
import LeadershipSection from "./LeadershipSection";
import FacultySection from "./FacultySection";
import DepartmentsSection from "./DepartmentsSection";

const AdministrationSection = ({ isOpen, toggle }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2
        onClick={toggle}
        className="text-2xl font-semibold mb-4 cursor-pointer flex items-center justify-between"
      >
        Administration
        <span className="text-blue-700">{isOpen ? "-" : "+"}</span>
      </h2>

      {isOpen && (
        <div className="space-y-6">
          <LeadershipSection />
          <FacultySection />
          <DepartmentsSection />
        </div>
      )}
    </div>
  );
};

export default AdministrationSection;
