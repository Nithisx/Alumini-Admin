import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const Birthday = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTodayBirthdays, setShowTodayBirthdays] = useState(false);
  const token = localStorage.getItem("Token");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("https://api.karpagamalumni.in/api/v1/birthdays/", {
          headers: { Authorization: `Token ${token}` },
        });
        if (!r.ok) throw new Error("Failed to fetch birthdays");
        setBirthdays(await r.json());
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const todayBirthdays = birthdays.filter((u) => u.days_until_birthday === 0);
  const upcomingBirthdays = birthdays
    .filter((u) => u.days_until_birthday > 0)
    .sort((a, b) => a.days_until_birthday - b.days_until_birthday);
  const birthdayDates = birthdays.map((u) => new Date(u.date_of_birth));

  const selectedDateBirthdays = birthdays.filter((u) => {
    const d = new Date(u.date_of_birth);
    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth();
  });

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const has = birthdayDates.some((d) => d.getDate() === date.getDate() && d.getMonth() === date.getMonth());
    return has ? <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full mx-auto mt-0.5" /> : null;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const has = birthdayDates.some((d) => d.getDate() === date.getDate() && d.getMonth() === date.getMonth());
    return has ? "birthday-tile" : null;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading birthdays…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 text-center max-w-sm">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    </div>
  );

  const BirthdayCard = ({ user, showDays = false }) => (
    <div
      onClick={() => navigate(`/alumni/members/${user.username}`)}
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      {user.profile_photo ? (
        <img
          src={`https://api.karpagamalumni.in${user.profile_photo}`}
          alt={user.username}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-200 flex-shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">{user.username?.[0]?.toUpperCase()}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
        {showDays && (
          <p className="text-xs text-emerald-600 font-medium mt-0.5">
            {user.days_until_birthday === 0 ? "🎂 Today!" : `in ${user.days_until_birthday} day${user.days_until_birthday !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>
      <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full flex-shrink-0">
        {new Date(user.date_of_birth).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🎂</span>
          <h1 className="text-base font-bold text-gray-900">Birthday Calendar</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* ── Today's birthdays (Instagram Stories strip if any) ── */}
        {todayBirthdays.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-gray-900">Today's Birthdays</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTodayBirthdays((prev) => !prev)}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors"
              >
                {showTodayBirthdays ? "Hide" : `Show (${todayBirthdays.length})`}
              </button>
            </div>
            {showTodayBirthdays && (
              <div className="space-y-2">
                {todayBirthdays.map((u) => <BirthdayCard key={`today-${u.id}`} user={u} />)}
              </div>
            )}
          </section>
        )}

        {/* ── Calendar + selected date ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-700">Calendar</h2>
          </div>
          <div className="p-4 birthday-calendar">
            <Calendar
              tileContent={tileContent}
              tileClassName={tileClassName}
              onChange={setSelectedDate}
              value={selectedDate}
              className="w-full"
            />
          </div>
          {selectedDateBirthdays.length > 0 && (
            <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Birthdays on {selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
              </p>
              {selectedDateBirthdays.map((u) => <BirthdayCard key={`sel-${u.id}`} user={u} />)}
            </div>
          )}
        </section>

        {/* ── Upcoming birthdays feed ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">Upcoming Birthdays</h2>
          </div>
          {upcomingBirthdays.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">No upcoming birthdays</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBirthdays.map((u) => <BirthdayCard key={`up-${u.id}`} user={u} showDays />)}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .birthday-calendar .react-calendar { width: 100%; border: none; font-size: 0.875rem; }
        .birthday-calendar .react-calendar__tile { padding: 0.6em 0.25em; height: 2.5rem; }
        .birthday-calendar .birthday-tile { background-color: rgba(16,185,129,0.08); border-radius: 0.5rem; }
        .birthday-calendar .react-calendar__tile--active { background: #059669 !important; color: white; border-radius: 0.5rem; }
        .birthday-calendar .react-calendar__tile--now { background: #d1fae5; border-radius: 0.5rem; }
        .birthday-calendar .react-calendar__navigation button { background: none; font-size: 14px; font-weight: bold; color: #374151; min-width: 32px; }
        .birthday-calendar .react-calendar__month-view__weekdays { text-transform: uppercase; font-weight: bold; font-size: 0.6rem; color: #9ca3af; }
      `}</style>
    </div>
  );
};

export default Birthday;
