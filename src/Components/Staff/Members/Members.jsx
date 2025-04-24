import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TOKEN = localStorage.getItem('Token');
const API_URL = 'http://134.209.157.195:8000/member-profiles/';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [genderFilter, setGenderFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
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
    setFiltered(list);
  }, [genderFilter, cityFilter, members]);

  // derive unique options
  const genders = Array.from(new Set(members.map(m => m.gender))).filter(Boolean);
  const cities = Array.from(new Set(members.map(m => m.city))).filter(Boolean);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Members Directory</h1>
        
        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Filter Members</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <label htmlFor="gender-filter" className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
              <select
                id="gender-filter"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
              >
                <option value="">All Genders</option>
                {genders.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/2">
              <label htmlFor="city-filter" className="block text-sm font-medium text-gray-600 mb-1">City</label>
              <select
                id="city-filter"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {filtered.length} {filtered.length === 1 ? 'member' : 'members'} found
          </p>
          <button 
            onClick={() => {
              setGenderFilter('');
              setCityFilter('');
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
                      <div className="mt-2 space-y-1">
                        {member.gender && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-4 inline-block">👤</span> {member.gender}
                          </p>
                        )}
                        {member.city && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-4 inline-block">📍</span> {member.city}
                          </p>
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