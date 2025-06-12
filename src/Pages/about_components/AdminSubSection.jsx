import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AdminSubSection = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center">
        <FontAwesomeIcon icon={icon} className="text-blue-600 mr-2" />
        <h4 className="text-lg font-medium">{title}</h4>
      </div>
      <FontAwesomeIcon icon={isOpen ? 'chevron-up' : 'chevron-down'} className="text-gray-600" />
    </button>

    {isOpen && (
      <div className="p-4 border-t border-gray-200">
        {children}
      </div>
    )}
  </div>
);

export default AdminSubSection;
