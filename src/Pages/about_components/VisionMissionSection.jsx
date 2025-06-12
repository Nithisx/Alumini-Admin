import React from "react";

const VisionMissionSection = () => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-blue-700">Vision & Mission</h3>
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Vision</h4>
        <p className="text-gray-600">
          To become a globally recognized institution of excellence in higher education, research, and innovation that empowers individuals to contribute to society.
        </p>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Mission</h4>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Impart quality education that blends theoretical and practical knowledge.</li>
          <li>Promote research, innovation, and entrepreneurship.</li>
          <li>Foster ethical values and social responsibility among students.</li>
          <li>Collaborate with industries and international institutions for mutual growth.</li>
        </ul>
      </div>
    </div>
  );
};

export default VisionMissionSection;
