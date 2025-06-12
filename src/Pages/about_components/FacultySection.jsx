import React from "react";

const FacultySection = () => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700">Faculty</h3>
      <p className="text-gray-600 mb-6">
        Our faculty members are highly qualified with expertise across various disciplines. They bring a rich blend of academic and industry experience to the classroom, ensuring that our students receive both theoretical knowledge and practical insights.
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Over 400 faculty members with PhDs</li>
        <li>Regular national and international conferences</li>
        <li>Strong research culture with funded projects</li>
        <li>Industry collaborations and consultancy</li>
      </ul>
    </div>
  );
};

export default FacultySection;
