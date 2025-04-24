import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TOKEN = localStorage.getItem('Token');
const API_URL = 'http://134.209.157.195:8000/member-profiles/';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [genderFilter, setGenderFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [currentWorkFilter, setCurrentWorkFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(API_URL, {
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        setMembers(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let list = [...members];
    if (genderFilter) {
      list = list.filter(m => m.gender === genderFilter);
    }
    if (cityFilter) {
      list = list.filter(m => m.city === cityFilter);
    }
    if (currentWorkFilter) {
      list = list.filter(m => m.current_work === currentWorkFilter);
    }
    if (searchQuery) {
      list = list.filter(m => m.username.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFiltered(list);
  }, [genderFilter, cityFilter, currentWorkFilter, searchQuery, members]);

  // derive unique options
  const genders = Array.from(new Set(members.map(m => m.gender))).filter(Boolean);
  const cities = Array.from(new Set(members.map(m => m.city))).filter(Boolean);
  const currentWorks = Array.from(new Set(members.map(m => m.current_work))).filter(Boolean);

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
              <label htmlFor="current-work-filter" className="text-sm font-medium text-gray-600 mr-2">Current Work:</label>
              <select
                id="current-work-filter"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentWorkFilter}
                onChange={e => setCurrentWorkFilter(e.target.value)}
              >
                <option value="">All</option>
                {currentWorks.map(work => (
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
            {filtered.length} {filtered.length === 1 ? 'member' : 'members'} found
          </p>
          <button 
            onClick={() => {
              setGenderFilter('');
              setCityFilter('');
              setCurrentWorkFilter('');
              setSearchQuery('');
            }}
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
          <>
            {filtered.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No members found with the selected filters.</p>
              </div>
            ) : (
              /* Members Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filtered.map(member => (
                  <Link
                    to={`/staff/members/${member.username}`}
                    key={member.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={`http://134.209.157.195:8000${member.profile_photo}`}
                        alt={member.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300?text=No+Image';
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
                        )}
                        {member.current_work && (
                          <div className="text-sm text-gray-600">
                            <span className="block">💼 {member.current_work}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}