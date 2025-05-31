import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Pagination from '../../Shared/Pagination';
import placeholderImg from '../../../assets/placeholder.svg';

const TOKEN = localStorage.getItem('Token');
const BASE_URL = 'http://134.209.157.195:8000';
const API_URL = `${BASE_URL}/admin-members/`;

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [genderFilter, setGenderFilter] = useState('');
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
      if (genderFilter) params.append('gender', genderFilter);
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
  }, [genderFilter, cityFilter, workedInFilter, searchQuery]);  // derive unique options from current result set
  const genders = Array.from(new Set(members.map(m => m.gender))).filter(Boolean);
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
    setGenderFilter('');
    setCityFilter('');
    setWorkedInFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Members Directory</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Filter Members</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <label htmlFor="gender-filter" className="text-sm font-medium text-gray-600 mr-2">Gender:</label>
              <select
                id="gender-filter"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
              >
                <option value="">All</option>
                {genders.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label htmlFor="city-filter" className="text-sm font-medium text-gray-600 mr-2">City:</label>
              <select
                id="city-filter"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              >
                <option value="">All</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>         
               <div className="flex items-center">
              <label htmlFor="worked-in-filter" className="text-sm font-medium text-gray-600 mr-2">Worked In:</label>
              <select
                id="worked-in-filter"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={workedInFilter}
                onChange={e => setWorkedInFilter(e.target.value)}
              >
                <option value="">All</option>
                {workedInOptions.map(work => (
                  <option key={work} value={work}>{work}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label htmlFor="search-box" className="text-sm font-medium text-gray-600 mr-2">Search:</label>
              <input
                id="search-box"
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
          <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {filteredTotal} {filteredTotal === 1 ? 'member' : 'members'} found
          </p>
          <button 
            onClick={handleResetFilters}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear Filters
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading members...</div>
          </div>
        ) : (
          <>            {members.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No members found with the selected filters.</p>
              </div>
            ) : (
              /* Members Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {members.map(member => (
                  <Link
                    to={`/admin/members/${member.username}`}
                    key={member.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={`http://134.209.157.195:8000${member.profile_photo}`}
                        alt={member.username}
                        className="w-full h-full object-cover"                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImg;
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800">{member.username}</h3>
                      <div className="mt-2 space-y-2">
                        {member.gender && (
                          <div className="text-sm text-gray-600">
                            <span className="block">👤 {member.gender}</span>
                          </div>
                        )}
                        {member.city && (
                          <div className="text-sm text-gray-600">
                            <span className="block">📍 {member.city}</span>
                          </div>
                        )}                        {member.worked_in && (
                          <div className="text-sm text-gray-600">
                            <span className="block">💼 {member.worked_in}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}              </div>
            )}
            
            {/* Pagination component */}
            {members.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTotal}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}