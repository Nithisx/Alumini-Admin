import React from "react";

const LeadershipSection = () => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700">Leadership</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Dr. R. Vasanthakumar</h4>
          <p className="text-gray-600 mb-1">Chairman</p>
          <p className="text-gray-500">Visionary leader with a passion for education and innovation.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Dr. S. Sundar Manoharan</h4>
          <p className="text-gray-600 mb-1">Vice Chancellor</p>
          <p className="text-gray-500">Expert in materials science leading KAHE towards academic excellence.</p>
        </div>
      </div>
    </div>
  );
};

export default LeadershipSection;
