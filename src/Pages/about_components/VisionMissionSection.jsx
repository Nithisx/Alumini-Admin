import React from "react";

const VisionMissionSection = () => {
  return (
    <div className="mb-12 bg-white rounded-3xl shadow-lg p-8 border border-green-100">
      <div className="mb-10 text-center">
        <h3 className="text-3xl font-bold text-green-800 mb-4">
          Vision & Mission
        </h3>
        <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto"></div>
      </div>

      {/* Vision Section */}
      <div className="mb-10 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-md">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-green-800">VISION</h4>
        </div>
        <div className="ml-16">
          <p className="text-gray-700 leading-relaxed">
            To impart value based quality education, to undertake scientific,
            socially relevant research and instil creativity among the learners,
            to enable, enlighten and enrich them to serve and lead the society.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mb-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-md">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-blue-800">MISSION</h4>
        </div>
        <div className="ml-16">
          <ul className="space-y-3">
            {[
              "Educating the learners to acquire latest knowledge and skills in their respective domain through e-platforms.",
              "Undertaking research in socially relevant, scientific and technology oriented projects.",
              "Empowering women, rural and marginalised sections of the society.",
              "Imbibing culture of creativity and innovation among learners.",
              "Making the learners to be self-reliant and moulding them as responsible citizens."
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-purple-800">CORE VALUES</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[
            {
              title: "Excellence",
              description: "Institution's commitment to excellence impels the stakeholder to consistently strive for exemplary outcomes from all the ventures of the Institution."
            },
            {
              title: "Integrity",
              description: "Ensuring honesty, fairness and ethical manners in all academic and allied activities."
            },
            {
              title: "Inclusiveness",
              description: "Nurturing an inclusive and learning environment that ensures openness, ideation and systematic approach towards excellence."
            },
            {
              title: "Responsibility",
              description: "Committed to be responsible and accountable in all activities of the Institution."
            },
            {
              title: "Collaboration",
              description: "Collaborating with other Universities, Industries, professional bodies and Society to realize excellence."
            },
            {
              title: "Innovation",
              description: "Encouraging and supporting development of ideas by fostering individual creativity and providing an environment with opportunities for growth."
            },
            {
              title: "Sustainability",
              description: "Creating systems and procedures to upkeep environmental, economic and social sustainability."
            }
          ].map((value, index) => (
            <div key={index} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <h5 className="font-semibold text-purple-700 text-lg mb-2">{value.title}</h5>
              <p className="text-gray-600 text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Policy */}
      <div className="mb-10 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 shadow-md">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-teal-800">QUALITY POLICY</h4>
        </div>
        <div className="ml-16">
          <p className="text-gray-700 leading-relaxed">
            To provide quality and excellence in all its spheres and services that
            exceeds the expectations of the stakeholders.
          </p>
        </div>
      </div>

      {/* Motto Section */}
      <div className="text-center bg-gradient-to-r from-green-600 to-teal-600 text-white py-8 rounded-3xl shadow-lg">
        <h4 className="text-2xl font-semibold mb-4">MOTTO</h4>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {["Enable", "Enlighten", "Enrich"].map((word, index) => (
            <div key={index} className="relative">
              <span className="text-3xl font-bold">{word}</span>
              {index < 2 && <span className="hidden md:inline mx-4 text-3xl">|</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisionMissionSection;