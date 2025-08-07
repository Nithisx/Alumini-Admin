import React from "react";

const RegistrarSection = () => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-purple-700">Registrar</h3>
      
      {/* Photo Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0">
          <img
            src="https://kahedu.edu.in/n/wp-content/uploads/2025/06/Pradeep-B-V_Registr.jpg"
            alt="Prof. Dr. B. V. Pradeep"
            className="w-48 h-60 object-cover rounded-lg shadow-lg border-4 border-purple-100"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/200x250/8b5cf6/ffffff?text=Prof.+Dr.+B.V.+Pradeep";
            }}
          />
          <div className="text-center mt-3">
            <p className="font-semibold text-gray-800">Prof. Dr. B. V. Pradeep</p>
            <p className="text-purple-600 font-medium">Registrar</p>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex-1">
          <p className="text-gray-600 mb-4">
            Prof. Dr. B. V. Pradeep, Registrar, Karpagam Academy of Higher Education is a person with caliber who manages the resources, responsibly, effectively and efficiently. He has started his career in the year 1999 as Lecturer, currently he has more than 25 years of experience. He has taught students in the B.Sc. / M.Sc. / M.Phil. / Ph.D. in Microbiology, M.Sc. in Biotechnology and M.Sc. in Industrial Biotechnology.
          </p>
          <p className="text-gray-600 mb-4">
            He is basically a Microbiologist, did his M.Sc. Applied Microbiology from University of Madras, and Ph.D., in Microbiology from Bharathiar University. He has published more than fifty-two research articles/ book chapters in various SCI/Scopus/Peer reviewed International and National journals, one patent has been granted. He has published four books as editors.
          </p>
          <p className="text-gray-600 mb-4">
            Google Scholar citation of 1201, h-index of 16 and i10-index of 21. His areas of specializations are Microbial secondary metabolites, probiotics and microbial pigments. He has organized more than fifteen National / International conference / seminars.
          </p>
        </div>
      </div>

      {/* Continued Content */}
      <div className="space-y-4">
        <p className="text-gray-600">
          He has presented more than 115 papers in various Conferences / Seminars. He has guided eleven candidates for their Ph.D. / M.Phil., and more than hundred students for their Masters. He is a Life member of "Association of Microbiologist in India" (AMI), "Indian Association of Applied Microbiologist" (IAAM), and Indian Immunology Society (IIS).
        </p>
        
        <div>
          <p className="text-gray-600 mb-3 font-medium">Administrative Positions held:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Head of the Department of Microbiology</li>
            <li>Deputy Registrar</li>
            <li>Director of Research</li>
            <li>Member in Planning and Monitoring Board</li>
            <li>Member in Board of Management</li>
            <li>Member in Academic Council</li>
            <li>Member in Board of Studies in Microbiology</li>
            <li>Convenor in Research advisory Committee</li>
            <li>Chairperson in Admissions and Admissions Review Committee</li>
            <li>Coordinator of Training & Placement cell and admissions cell</li>
          </ul>
        </div>
        
        <p className="text-gray-600">
          He has organized various academic programs and academic support functions of the Institution, demonstrating his commitment to excellence in higher education administration and research.
        </p>
      </div>
    </div>
  );
};

export default RegistrarSection;