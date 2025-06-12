import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faSitemap } from "@fortawesome/free-solid-svg-icons";

const ViceChancellor = ({ isOpen, toggleSection }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button 
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={toggleSection}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={faSitemap} className="text-blue-600 mr-2" />
          <h4 className="text-lg font-medium">Vice Chancellor</h4>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-gray-600"
        />
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-3">
              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Engineering</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Computer Science and Engineering</li>
                <li>Electronics and Communication Engineering</li>
                <li>Electrical and Electronics Engineering</li>
                <li>Civil Engineering</li>
                <li>Mechanical Engineering</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3">
              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Arts & Science</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Mathematics</li>
                <li>Physics</li>
                <li>Chemistry</li>
                <li>Computer Science</li>
                <li>English</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3">
              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Management</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Business Administration</li>
                <li>Commerce</li>
                <li>Financial Studies</li>
                <li>International Business</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3">
              <h5 className="font-semibold text-blue-700 mb-2">Faculty of Health Sciences</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Pharmacy</li>
                <li>Medical Laboratory Technology</li>
                <li>Physiotherapy</li>
                <li>Nursing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViceChancellor;
