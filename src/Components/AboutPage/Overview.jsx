import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faBuilding } from "@fortawesome/free-solid-svg-icons";

const Overview = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faBuilding} className="text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold">Overview</h3>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-blue-600"
        />
      </button>
      
      {isOpen && (
        <div className="p-5 bg-white border-t border-gray-200">
          <div className="prose max-w-none">
            <p className="mb-4">
              <strong>Karpagam Academy of Higher Education (KAHE)</strong> established under Section 3 of UGC Act 1956 is approved by Ministry of Human Resource Development, Government of India. Dr. R. Vasanthakumar, the president of Karpagam Charity trust (KCT), philanthropist, industrialist, entrepreneur and culture promoter.
            </p>
            <p className="mb-4">
              Contemporary infrastructure, modern teaching methodologies, career oriented training, excellent placements and the finest faculty have always become the Karpagam's hallmark. Besides technical expertise, Karpagam Academy of Higher Education (KAHE) has made a mark since its inception by developing communication and soft skills, ensuring enlightening knowledge, extending holistic education and creating a strong value system. Today, with strength of 8000 students and over 750 teaching & non-teaching staff, Karpagam Academy of Higher Education is setting new benchmarks in the educational sphere.
            </p>
            
            <h4 className="text-lg font-semibold mt-6 mb-3">Merits of Karpagam</h4>
            <p className="mb-2">
              Karpagam strives to offer a package of value added benefits that are tailored to nurture the educational experience of the students:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Well experienced and trained faculty including 234 doctorates and Post Doctoral Fellows</li>
              <li>Visiting faculty from premier institutes like IIM, IISc, IIT, NIT etc.</li>
              <li>A professional placement department enduring training for overall personality development of students.</li>
              <li>1182 above placement offers were made for 2021-2022 Batch</li>
              <li>A vibrant Karpagam Research Centre marching towards fruition of innovations and patents. 59 patents were filed and 16 patents are granted. 2 of the granted patents are being commercialized.</li>
              <li>No.of Copyrights 18 filed 16 registered</li>
              <li>Scope to work on projects funded by government & other agencies</li>
              <li>Industrial MoUs and career oriented courses for enhancing employability</li>
              <li>Exchange, Twinning programme and dual degree with global universities for International exposure</li>
              <li>Highly vibrant and encouraging academic ambience aiding an enriched education.</li>
              <li>State of the art laboratories and Wi-fi enabled campus with 1Gbps internet connectivity.</li>
            </ul>
            
            <h4 className="text-lg font-semibold mt-6 mb-3">Recognition</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Deemed to be University – Under Section 3 of UGC Act, 1956.</li>
              <li>Approved by the Ministry of Human Resource Development, Government of India.</li>
              <li>Approved by UGC-AICTE, New Delhi</li>
              <li>Approved by Council of Architecture, New Delhi</li>
              <li>Approved by Pharmacy Council of India (PCI), New Delhi</li>
              <li>Accredited with A+ Grade by NAAC in the Second cycle</li>
              <li>MoMSME, Govt. of India Approved Host Institution/ Business Incubator</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
