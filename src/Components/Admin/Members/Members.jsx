import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Pagination from '../../Shared/Pagination';
import placeholderImage from '../../../assets/placeholder_image.jpg'; // Adjust the path as needed

const TOKEN = localStorage.getItem('Token');
const BASE_URL = 'http://134.209.157.195:8000';
const API_URL = `${BASE_URL}/admin-members/`;

// Predefined roles
const ROLES = ['Student', 'Staff', 'Admin'];

// Placeholder image service
const getPlaceholderImage = (name) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=white&size=400&font-size=0.4`;
};

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [cityFilter, setCityFilter] = useState(''); 
  const [workedInFilter, setWorkedInFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMembers = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    
    // Build query parameters
    const params = new URLSearchParams({
      page,
      page_size: size
    });
    
    if (roleFilter) params.append('role', roleFilter);
    if (cityFilter) params.append('city', cityFilter);
    if (workedInFilter) params.append('worked_in', workedInFilter);
    if (searchQuery) params.append('search', searchQuery);
    
    try {
      const response = await axios.get(`${API_URL}?${params.toString()}`, {
        headers: {
          'Authorization': `Token ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      const { results, count, next, previous } = response.data;
      
      setMembers(results);
      setFilteredTotal(count);
      setTotalPages(Math.ceil(count / size));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMembers(1, pageSize);
  }, [pageSize]);
  
  // Fetch when filters change
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    fetchMembers(1, pageSize);
  }, [roleFilter, cityFilter, workedInFilter, searchQuery]);

  // Derive unique options from current result set
  const cities = Array.from(new Set(members.map(m => m.city))).filter(Boolean);
  const workedInOptions = Array.from(new Set(members.map(m => m.worked_in))).filter(Boolean);
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchMembers(page, pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
    fetchMembers(1, size);
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    setRoleFilter('');
    setCityFilter('');
    setWorkedInFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">Members Directory</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and explore our community members</p>
        </div>
        
        {/* Filters Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 mb-4 sm:mb-8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center mb-2 sm:mb-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate">Filter & Search</span>
            </h2>
            <button 
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Role Filter */}
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="role-filter" className="block text-xs sm:text-sm font-medium text-gray-700">Role</label>
              <select
                id="role-filter"
                className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-ellipsis"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="city-filter" className="block text-xs sm:text-sm font-medium text-gray-700">City</label>
              <select
                id="city-filter"
                className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-ellipsis"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city} className="truncate">{city}</option>
                ))}
              </select>
            </div>

            {/* Worked In Filter */}
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="worked-in-filter" className="block text-xs sm:text-sm font-medium text-gray-700">Experience</label>
              <select
                id="worked-in-filter"
                className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-ellipsis"
                value={workedInFilter}
                onChange={e => setWorkedInFilter(e.target.value)}
              >
                <option value="">All Experience</option>
                {workedInOptions.map(work => (
                  <option key={work} value={work} className="truncate">{work}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="search-box" className="block text-xs sm:text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <input
                  id="search-box"
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 pl-8 sm:pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors truncate"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base mb-2 sm:mb-0 w-full sm:w-auto">
            <p className="text-gray-700 font-medium">
              {filteredTotal} {filteredTotal === 1 ? 'member' : 'members'} found
            </p>
            {(roleFilter || cityFilter || workedInFilter || searchQuery) && (
              <span className="text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 py-0.5 sm:py-1 rounded-full">
                Filtered
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm sm:text-base text-gray-600 font-medium">Loading members...</span>
            </div>
          </div>
        ) : (
          <>
            {members.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">No members found</h3>
                <p className="text-xs sm:text-sm text-gray-600">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              /* Members Grid - With overflow fixes */
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                {members.map(member => (
                  <Link
                    to={`/admin/members/${member.username}`}
                    key={member.id}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 group flex flex-col"
                  >
                              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative w-full">
                                <img
                                src={placeholderImage}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getPlaceholderImage();
                        }}
                      />
                      {/* Role Badge */}
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                    
                    {/* Member Info */}
                    <div className="p-3 sm:p-4 md:p-5 w-full">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors truncate">
                        {member.first_name} {member.last_name}
                      </h3>
                      
                      <div className="space-y-1 sm:space-y-2 w-full">
                        {member.city && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600 w-full">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate max-w-[calc(100%-1.5rem)]">{member.city}</span>
                          </div>
                        )}
                        
                        {member.worked_in && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600 w-full">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                            </svg>
                            <span className="truncate max-w-[calc(100%-1.5rem)]">{member.worked_in}</span>
                          </div>
                        )}
                        
                        {member.course_name && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600 w-full">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="truncate max-w-[calc(100%-1.5rem)]">{member.course_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Pagination - with overflow fix */}
            {members.length > 0 && (
              <div className="mt-6 sm:mt-8 overflow-x-auto">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredTotal}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}