import React, { useState } from "react";

const LeadershipSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Leader data
  const leaders = [
    {
      id: 1,
      name: "Dr. R. Vasanthakumar",
      position: "President",
      shortDescription: "Leading the strategic vision and mission of KAHE.",
      fullBio: `Dr. R. Vasanthakumar, a philanthropist par excellence and our founder promoter, is the President of Karpagam Academy of Higher Education. An enterprising industrialist, he is the Chairman and Managing Director of Karpagam Industries Private Limited, Bannariamman Engineering Industries Private Limited, Karpagam Yarns Private Limited, Karpagambigai Investments Limited and Karpagam Infrastructure Private Limited that together employ over 700 personnel.

A Gold Medalist from Madras University, he graduated with Honours in Electrical & Electronics Engineering. It is probably his deep-rooted academic interest that has fuelled Dr. R. Vasanthakumar's endeavours in the field of education.

Besides education, Dr. R. Vasanthakumar is a renowned name in myriad philanthropic causes. His contribution to temple maintenance and renovation of dilapidated temples is priceless. He has also been instrumental in incepting the Panniru Thirumurai Aaivu Mayyam which is involved in Research of Ancient Tamil Saivism Literature like Thevaram, Thiruvasagam & Saiva Siddantham and spreading Saivism by conducting conferences and seminars once in 2 months.

Dr. R. Vasanthakumar's noteworthy contributions have been rightly commended through several titles and recognitions. An Honorary Doctorate conferred on him by Avinashilingam University in 2004 stands testimony to his role as an exemplary academician and an extraordinary philanthropist. NIA Institutions, Pollachi has awarded the title "Kongu Nattu Sathanaiyalar" on the occasion of the 51st Founder's day of Shri. Nachimuthu Gounder. He has served as President, COSIEMA (Coimbatore Sidco Industrial Estate Management Association) during 1998 and 2000 and Tamil Nadu Private College Management Association (Coimbatore Chapter) during 2000-2002. He is also the President of ENFUSE (Energy & fuel User's Association) Coimbatore Chapter and Renovation Committees of many SHIVA Temples. He is the Governing Council Member of Sri Ramakrishna Mission Vidyalaya Polytechnic College, Sri Dhandayuthapani Polytechnic College and Thavathiru Santhalinga Adigalar Tamil College.

Dr. R. Vasanthakumar is Corporate Member of the Coimbatore Stock Exchange. He is also a member of various professional bodies like the Confederation of Indian Industry, Indian Chamber of Commerce, Indo-German Chamber of Commerce, COSIEMA (Coimbatore Sidco Industrial Estate Management Association) and CODISSIA (Coimbatore District Small Scale Industries Association).

Dr. R. Vasanthakumar's extensive travelling has taken him around the world, primarily to the United States of America, Germany, Italy, Turkey, Japan, Malaysia, Singapore and Switzerland. His rich experience and expertise continues to be a source of great inspiration to everyone.`,
    },
    {
      id: 2,
      name: "Shrimathi V. Damayanthi",
      position: "Trustee",
      shortDescription: "Contributing to institutional governance and oversight.",
    },
    {
      id: 3,
      name: "Shri V. Karthick",
      position: "Trustee",
      shortDescription: "Supporting the strategic initiatives of KAHE.",
    },
    {
      id: 4,
      name: "Er. K. Murugaiah",
      position: "CEO",
      shortDescription: "CEO for Karpagam Educational Institutions",
      fullBio: `Er. K. Murugaiah, is the Chief Executive Officer of Karpagam Academy of Higher Education. A Member of the Board of Management of Karpagam Charity Trust / Karpagam Academy of Higher Education, he joined as Administrative Officer in the Trust and since 1994, and he has been designated as the Chief Executive Officer. A Gold Medalist from Madras University, his efforts have always been instrumental in uplifting Karpagam to greater heights.

A keen advisor, Er. K. Murugaiah's expertise is always solicited for creative and constructive implementation of new techniques in teaching-learning process and other academic activities in all the institutions. He is also a member in Governing council of Karpagam Educational Institutions.

Er. K. Murugaiah is known for his cordial rapport with higher officials of the State and Central Government and Private Sector. His exposure and expertise in the theoretical and practical aspects of engineering are highly revered. His engineering and administrative acumen will continue to be a guiding force to Karpagam Institutions.`
    },
  ];

  const openModal = (leader) => {
    setSelectedLeader(leader);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeader(null);
    document.body.style.overflow = "auto"; // Re-enable scrolling
  };

  return (
    <div className="mb-8 relative">
      <h3 className="text-xl font-semibold mb-4 text-green-700">
        Board of Trustees
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {leaders.map((leader) => (
          <div
            key={leader.id}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openModal(leader)}
          >
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              {leader.name}
            </h4>
            <p className="text-gray-600 mb-1">{leader.position}</p>
            <p className="text-gray-500">{leader.shortDescription}</p>
            <div className="mt-3 text-green-600 text-sm font-medium flex items-center">
              View Details
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedLeader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedLeader.name}
                  </h3>
                  <p className="text-green-600 font-medium">
                    {selectedLeader.position}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="mt-6">
                {selectedLeader.fullBio ? (
                  selectedLeader.fullBio
                    .split("\n\n")
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-gray-700 mb-4 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))
                ) : (
                  <p className="text-gray-700">
                    No detailed information available.
                  </p>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadershipSection;