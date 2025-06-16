import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const TOKEN = localStorage.getItem('Token');
const API_BASE = 'http://134.209.157.195:8000/profile/';

export default function SingleMember() {
  const { name } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Fetching specfing member data...');
    fetch(`${API_BASE}${name}`, {
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setMember(data))
      .catch(err => console.error('Error fetching member:', err))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mb-4"></div>
          <p className="text-green-700 text-lg font-medium">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Member Not Found</h2>
          <p className="text-gray-600">The requested member profile could not be found.</p>
        </div>
      </div>
    );
  }

  const {
    username,
    first_name,
    last_name,
    salutation,
    gender,
    date_of_birth,
    email,
    secondary_email,
    phone,
    profile_photo,
    current_location,
    home_town,
    city,
    state,
    country,
    branch,
    course,
    stream,
    start_year,
    end_year,
    college_name,
    chapter,
    role,
    bio,
    current_work,
    worked_in,
    passed_out_year,
    social_links = {},
  } = member;

  return (
    <div className="min-h-screen bg-gradient-to-br w-[118rem]  mt-[2rem] from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Profile Card */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-green-100">
          
          {/* Header Section with Gradient */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-12">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={`http://134.209.157.195:8000${member.profile_photo}`}
                  alt={username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-center md:text-left text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {salutation} {first_name} {last_name}
                </h1>
                <p className="text-green-100 text-xl mb-2">@{username}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {role && (
                    <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      {role}
                    </span>
                  )}
                  {chapter && (
                    <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      {chapter}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800">Personal Information</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700">First Name:</span>
                    <span className="text-gray-700">{first_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700">Last Name:</span>
                    <span className="text-gray-700">{last_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700">Gender:</span>
                    <span className="text-gray-700">{gender}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700">Date of Birth:</span>
                    <span className="text-gray-700">{date_of_birth}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700">Role:</span>
                    <span className="text-gray-700">{role}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-green-700">Chapter:</span>
                    <span className="text-gray-700">{chapter}</span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800">Contact Details</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700">Email:</span>
                    <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{email}</span>
                  </div>
                  {secondary_email && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Secondary Email:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{secondary_email}</span>
                    </div>
                  )}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700">Phone:</span>
                    <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{phone}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700">Location:</span>
                    <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{current_location || `${city}, ${state}, ${country}`}</span>
                  </div>
                  {home_town && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Home Town:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{home_town}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800">Education</h2>
                </div>
                <div className="space-y-3">
                  {college_name && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">College:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{college_name}</span>
                    </div>
                  )}
                  {(course || stream) && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Course:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{[course, stream].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {(start_year || end_year) && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Duration:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{start_year} – {end_year}</span>
                    </div>
                  )}
                  {passed_out_year && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Passed Out:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{passed_out_year}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800">Professional</h2>
                </div>
                <div className="space-y-3">
                  {worked_in && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Worked In:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{worked_in}</span>
                    </div>
                  )}
                  {current_work && !worked_in && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700">Current Work:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg">{current_work}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {bio && (
              <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800">About</h2>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{bio}</p>
                </div>
              </div>
            )}

            {/* Social Links */}
            {Object.keys(social_links).length > 0 && (
              <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800">Social Links</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(social_links).map(([key, url]) => (
                    <a
                      key={key}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-green-50 border border-green-200 hover:border-green-400 text-green-700 hover:text-green-800 px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-medium capitalize shadow-sm hover:shadow-md"
                    >
                      {key.replace('_link', '')}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}