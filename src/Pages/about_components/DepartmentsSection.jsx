import React from "react";

const DepartmentsSection = () => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-blue-700">Departments</h3>
      <p className="text-gray-600 mb-6">
        KAHE offers a wide range of departments and programs designed to meet the needs of students and industries.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          "Computer Science & Engineering",
          "Information Technology",
          "Electronics & Communication Engineering",
          "Mechanical Engineering",
          "Civil Engineering",
          "Management Studies",
          "Commerce",
          "Physics",
          "Chemistry",
          "Mathematics",
          "English",
          "Biotechnology"
        ].map((dept, idx) => (
          <div key={idx} className="bg-white p-4 rounded shadow">
            <p className="text-gray-700">{dept}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsSection;
