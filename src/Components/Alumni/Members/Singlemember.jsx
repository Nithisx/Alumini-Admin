import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const TOKEN = localStorage.getItem('Token');
const API_BASE = 'https://xyndrix.me/api/profile/';

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-green-600 border-t-transparent mb-4"></div>
          <p className="text-green-700 text-base sm:text-lg font-medium">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-lg border-l-4 border-red-500 max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Member Not Found</h2>
          <p className="text-gray-600 text-sm sm:text-base">The requested member profile could not be found.</p>
          <Link
            to="/alumni/members"
            className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Members
          </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-4 sm:py-6 lg:py-8">
      <div className="max-w-full lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            to="/staff/members"
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors group"
          >
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm sm:text-base">Back to Members</span>
          </Link>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white shadow-lg sm:shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden border border-green-100">
          
          {/* Header Section with Gradient */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative flex flex-col items-center gap-4 sm:gap-6">
              <div className="relative">
                <img
                  src={`https://xyndrix.me/api${member.profile_photo}`}
                  alt={username}
                  className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 text-white rounded-full p-1.5 sm:p-2 shadow-lg">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-center text-white">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">
                  {salutation} {first_name} {last_name}
                </h1>
                <p className="text-green-100 text-base sm:text-lg lg:text-xl mb-2 sm:mb-3">@{username}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {role && (
                    <span className="bg-white text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                      {role}
                    </span>
                  )}
                  {chapter && (
                    <span className="bg-white text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                      {chapter}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">Personal Information</h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">First Name:</span>
                    <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">{first_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Last Name:</span>
                    <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">{last_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Gender:</span>
                    <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">{gender}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Date of Birth:</span>
                    <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">{date_of_birth}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Role:</span>
                    <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">{role}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Chapter:</span>
                    <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">{chapter}</span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">Contact Details</h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Email:</span>
                    <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">{email}</span>
                  </div>
                  {secondary_email && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Secondary Email:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">{secondary_email}</span>
                    </div>
                  )}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Phone:</span>
                    <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{phone}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">Location:</span>
                    <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{current_location || `${city}, ${state}, ${country}`}</span>
                  </div>
                  {home_town && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Home Town:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{home_town}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">Education</h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {college_name && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">College:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{college_name}</span>
                    </div>
                  )}
                  {(course || stream) && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Course:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{[course, stream].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {(start_year || end_year) && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Duration:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{start_year} – {end_year}</span>
                    </div>
                  )}
                  {passed_out_year && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Passed Out:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{passed_out_year}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">Professional</h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {worked_in && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Worked In:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{worked_in}</span>
                    </div>
                  )}
                  {current_work && !worked_in && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">Current Work:</span>
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">{current_work}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {bio && (
              <div className="mt-6 sm:mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">About</h2>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">{bio}</p>
                </div>
              </div>
            )}

            {/* Social Links */}
            {Object.keys(social_links).length > 0 && (
              <div className="mt-6 sm:mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">Social Links</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {Object.entries(social_links).map(([key, url]) => (
                    <a
                      key={key}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-green-50 border border-green-200 hover:border-green-400 text-green-700 hover:text-green-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-medium capitalize shadow-sm hover:shadow-md text-sm"
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