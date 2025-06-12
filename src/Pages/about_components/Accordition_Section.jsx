import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AccordionSection = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <button
      className="w-full flex items-center justify-between p-5 bg-blue-50 hover:bg-blue-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center">
        <FontAwesomeIcon icon={icon} className="text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <FontAwesomeIcon icon={isOpen ? 'chevron-up' : 'chevron-down'} className="text-blue-600" />
    </button>

    {isOpen && (
      <div className="p-5 bg-white border-t border-gray-200">
        {children}
      </div>
    )}
  </div>
);

export default AccordionSection;
