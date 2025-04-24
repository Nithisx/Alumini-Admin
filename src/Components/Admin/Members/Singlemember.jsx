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

  if (loading) return <div className="text-center py-20">Loading…</div>;
  if (!member) return <div className="text-center py-20 text-red-500">Member not found</div>;

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
    passed_out_year,
    social_links = {},
  } = member;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center p-6 border-b">
          <img
            src={`http://134.209.157.195:8000${member.profile_photo}`}
            alt={username}
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
          <h1 className="text-2xl font-bold">{salutation} {first_name} {last_name}</h1>
          <p className="text-gray-500">@{username}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* personal */}
                <section>
                <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                  <div><span className="font-medium">First Name:</span> {first_name}</div>
                  <div><span className="font-medium">Last Name:</span> {last_name}</div>
                  <div><span className="font-medium">Gender:</span> {gender}</div>
                  <div><span className="font-medium">Date of Birth:</span> {date_of_birth}</div>
                  <div><span className="font-medium">Role:</span> {role}</div>
                  <div><span className="font-medium">Chapter:</span> {chapter}</div>
                </div>
                </section>

                {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Details</h2>
            <div className="space-y-2 text-gray-700">
              <div><span className="font-medium">Email:</span> {email}</div>
              {secondary_email && <div><span className="font-medium">Secondary Email:</span> {secondary_email}</div>}
              <div><span className="font-medium">Phone:</span> {phone}</div>
              <div><span className="font-medium">Location:</span> {current_location || `${city}, ${state}, ${country}`}</div>
              {home_town && <div><span className="font-medium">Home Town:</span> {home_town}</div>}
            </div>
          </section>

          {/* Education */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Education</h2>
            <div className="space-y-2 text-gray-700">
              {college_name && <div><span className="font-medium">College:</span> {college_name}</div>}
              {(course || stream) && <div><span className="font-medium">Course:</span> {[course, stream].filter(Boolean).join(', ')}</div>}
              {(start_year || end_year) && <div><span className="font-medium">Duration:</span> {start_year} &ndash; {end_year}</div>}
              {passed_out_year && <div><span className="font-medium">Passed Out:</span> {passed_out_year}</div>}
            </div>
          </section>

          {/* Work */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Professional</h2>
            <div className="space-y-2 text-gray-700">
              {current_work && <div><span className="font-medium">Current Work:</span> {current_work}</div>}
            </div>
          </section>

          {/* Bio */}
          {bio && (
            <section>
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{bio}</p>
            </section>
          )}

          {/* Social Links */}
          {Object.keys(social_links).length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Social Links</h2>
              <ul className="space-y-1">
                {Object.entries(social_links).map(([key, url]) => (
                  <li key={key}>
                    <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 hover:underline capitalize">{key.replace('_link','')}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
