import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Birthday = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const token = localStorage.getItem('Token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://134.209.157.195:8000/birthdays/', {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch birthdays');
        const data = await response.json();
        setBirthdays(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBirthdays();
  }, [token]);

  // Separate today's birthdays and upcoming ones
  const todayBirthdays = birthdays.filter(user => user.days_until_birthday === 0);
  const upcomingBirthdays = birthdays
    .filter(user => user.days_until_birthday > 0)
    .sort((a, b) => a.days_until_birthday - b.days_until_birthday);

  // Prepare dates for calendar dots
  const birthdayDates = birthdays.map(user => new Date(user.date_of_birth));

  // Get birthdays for selected date
  const getSelectedDateBirthdays = () => {
    return birthdays.filter(user => {
      const birthDate = new Date(user.date_of_birth);
      return birthDate.getDate() === selectedDate.getDate() && 
             birthDate.getMonth() === selectedDate.getMonth();
    });
  };

  const selectedDateBirthdays = getSelectedDateBirthdays();

  // Helper to render dot on calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasBirthday = birthdayDates.some(d => 
        d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
      );
      
      return hasBirthday ? <div className="h-2 w-2 bg-green-600 rounded-full mx-auto mt-1" /> : null;
    }
    return null;
  };

  // Helper to apply custom class to tiles
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasBirthday = birthdayDates.some(d => 
        d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
      );
      
      return hasBirthday ? 'birthday-tile' : null;
    }
    return null;
  };

  const handleUserClick = (userId) => {
    navigate(`/staff/members/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-8 max-w-3xl mx-auto">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const BirthdayCard = ({ user, showDaysUntil = false }) => (
    <div 
      className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 cursor-pointer"
      onClick={() => handleUserClick(user.username)}
    >
      <div className="flex-shrink-0">
        {user.profile_photo ? (
          <img
            src={`http://134.209.157.195:8000${user.profile_photo}`}
            alt={user.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-green-300 hover:border-green-600 transition-colors"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-grow">
        <span className="text-lg font-medium text-gray-800">{user.username}</span>
        {showDaysUntil && (
          <p className="text-sm text-green-600 font-medium">
            {user.days_until_birthday === 0 
              ? "Today!" 
              : `in ${user.days_until_birthday} day${user.days_until_birthday !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
          {new Date(user.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-green-800">Birthday Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Calendar</h2>
          <div className="birthday-calendar">
            <Calendar 
              tileContent={tileContent}
              tileClassName={tileClassName}
              onChange={setSelectedDate}
              value={selectedDate}
              className="w-full"
            />
          </div>
          
          {/* Selected Date Birthdays */}
          {selectedDateBirthdays.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Birthdays on {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
              </h3>
              <div className="space-y-3">
                {selectedDateBirthdays.map(user => (
                  <BirthdayCard key={`selected-${user.id}`} user={user} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Birthdays Lists Section */}
        <div className="space-y-8">
          {/* Today's Birthdays */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
              Today's Birthdays
            </h2>
            
            {todayBirthdays.length > 0 ? (
              <div className="space-y-3">
                {todayBirthdays.map(user => (
                  <BirthdayCard key={`today-${user.id}`} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No birthdays today</p>
              </div>
            )}
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
              Upcoming Birthdays
            </h2>
            
            {upcomingBirthdays.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {upcomingBirthdays.map(user => (
                  <BirthdayCard key={`upcoming-${user.id}`} user={user} showDaysUntil={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming birthdays</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .birthday-calendar .react-calendar {
          width: 100%;
          border: none;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .birthday-calendar .react-calendar__tile {
          padding: 1em 0.5em;
        }
        
        .birthday-calendar .birthday-tile {
          background-color: rgba(22, 163, 74, 0.1);
          border-radius: 0.25rem;
        }
        
        .birthday-calendar .react-calendar__tile--active {
          background: #16a34a;
          color: white;
        }
        
        .birthday-calendar .react-calendar__tile--now {
          background: #dcfce7;
        }
        
        .birthday-calendar .react-calendar__navigation {
          margin-bottom: 1em;
        }
        
        .birthday-calendar .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          font-weight: bold;
          color: #4b5563;
        }
        
        .birthday-calendar .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
        }
      `}</style>
    </div>
  );
};

export default Birthday;