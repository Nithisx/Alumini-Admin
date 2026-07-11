import React, { useEffect, useState } from "react";
import { roleBase } from "../../../lib/useBasePath";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { PageHeader, PageHero, StatPill, EmptyState, LoadingScreen, ErrorScreen, MotionList, MotionItem } from "../../Shared/ui";
import { API_BIRTHDAYS, API_ORIGIN } from "../../../config/api";

const Birthday = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSelectedBirthdays, setShowSelectedBirthdays] = useState(true);
  const token = localStorage.getItem("Token");
  const navigate = useNavigate();

  const getMonthDay = (dateLike) => {
    if (!dateLike) return { month: null, day: null };

    if (typeof dateLike === "string") {
      // support both date-only (YYYY-MM-DD) and ISO datetimes (YYYY-MM-DDTHH:MM:SSZ)
      const datePart = dateLike.slice(0, 10); // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [, month, day] = datePart.split("-");
        return { month: Number(month) - 1, day: Number(day) };
      }
    }

    const parsed = new Date(dateLike);
    if (Number.isNaN(parsed.getTime())) return { month: null, day: null };
    return { month: parsed.getMonth(), day: parsed.getDate() };
  };

  const isSameMonthDay = (dateLike, targetDate) => {
    const { month, day } = getMonthDay(dateLike);
    return month === targetDate.getMonth() && day === targetDate.getDate();
  };

const computeDaysUntilBirthday = (dateLike) => {
  const { month, day } = getMonthDay(dateLike);


  if (month == null || day == null) return Infinity;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let target = new Date(
    startOfToday.getFullYear(),
    month,
    day
  );

  

  if (target < startOfToday) {
    target = new Date(
      startOfToday.getFullYear() + 1,
      month,
      day
    );
  }


  const diff = Math.round(
    (target - startOfToday) /
      (1000 * 60 * 60 * 24)
  );


  return diff;
};

  const getDisplayName = (user) => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return fullName || user?.username || "Unknown User";
  };

  const getGenderBadge = (gender) => {
    const normalizedGender = (gender || "").toLowerCase();

    if (normalizedGender === "male") {
      return { label: "Male Birthday", iconUrl: "https://cdn-icons-png.flaticon.com/128/6521/6521590.png" };
    }

    if (normalizedGender === "female") {
      return { label: "Female Birthday", iconUrl: "https://cdn-icons-png.flaticon.com/128/1320/1320930.png" };
    }

    return { label: "Other Birthday", iconUrl: "https://cdn-icons-png.flaticon.com/128/6794/6794503.png" };
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(API_BIRTHDAYS, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!r.ok) throw new Error("Failed to fetch birthdays");
        const data = await r.json();
        const items = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
        const mapped = items.map((u) => ({ ...u, days_until_birthday: computeDaysUntilBirthday(u.date_of_birth) }));
        // debug: show how many items were loaded in dev tools
        // eslint-disable-next-line no-console
        console.debug("birthdays fetched:", mapped.length, mapped.slice(0,3));
        setBirthdays(mapped);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const upcomingBirthdays = birthdays
    .filter((u) => typeof u.days_until_birthday === "number" && u.days_until_birthday >= 0)
    .sort((a, b) => a.days_until_birthday - b.days_until_birthday);
  const birthdayDates = birthdays.map((u) => getMonthDay(u.date_of_birth));

  const selectedDateBirthdays = birthdays.filter((u) => isSameMonthDay(u.date_of_birth, selectedDate));
  const isTodaySelected = isSameMonthDay(selectedDate, new Date());

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const has = birthdayDates.some((d) => d.day === date.getDate() && d.month === date.getMonth());
    return has ? <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full mx-auto mt-0.5" /> : null;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const has = birthdayDates.some((d) => d.day === date.getDate() && d.month === date.getMonth());
    return has ? "birthday-tile" : null;
  };

  if (loading) return <LoadingScreen message="Loading birthdays…" />;

  if (error) return <ErrorScreen message={error} />;

  const BirthdayCard = ({ user, showDays = false }) => {
    const displayName = getDisplayName(user);
    const hasNameParts = Boolean([user?.first_name, user?.last_name].filter(Boolean).join(" ").trim());
    const genderBadge = getGenderBadge(user?.gender);

    return (
    <div
      onClick={() => navigate(`${roleBase()}/members/${user.username}`)}
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="relative w-11 h-11 flex-shrink-0">
        {user.profile_photo ? (
          <img
            src={`${API_ORIGIN}${user.profile_photo}`}
            alt={displayName}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-200"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-base">{displayName?.[0]?.toUpperCase()}</span>
          </div>
        )}
        <img
          src={genderBadge.iconUrl}
          alt={genderBadge.label}
          title={genderBadge.label}
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white bg-white shadow-sm"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
        </div>
        {hasNameParts && user.username && (
          <p className="text-xs text-gray-500 truncate mt-0.5">@{user.username}</p>
        )}
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
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <PageHeader
        section="birthday"
        icon={<span>🎂</span>}
        title="Birthdays" 
        maxWidth="max-w-4xl"
      />

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <PageHero
          section="birthday"
          icon={<span>🎂</span>}
          title="Birthday Calendar"
          subtitle="Celebrate your fellow alumni — never miss a special day."
          stats={<StatPill value={upcomingBirthdays.length} label="Upcoming" />}
        />
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
          <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {isTodaySelected
                  ? "Today's Birthday"
                  : `Birthdays on ${selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`}
              </p>
              <button
                type="button"
                onClick={() => setShowSelectedBirthdays((prev) => !prev)}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors"
              >
                {showSelectedBirthdays ? "Hide" : `Show (${selectedDateBirthdays.length})`}
              </button>
            </div>
            {showSelectedBirthdays ? (
              selectedDateBirthdays.length > 0 ? (
                selectedDateBirthdays.map((u) => <BirthdayCard key={`sel-${u.id}`} user={u} />)
              ) : (
                <p className="text-sm text-gray-400">No birthdays on this date.</p>
              )
            ) : (
              <p className="text-sm text-gray-400">Birthdays are hidden for this date.</p>
            )}
          </div>
        </section>

        {/* ── Upcoming birthdays feed ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">Upcoming Birthdays</h2>
          </div>
          {upcomingBirthdays.length === 0 ? (
            <EmptyState
              section="birthday"
              icon={<span>🎂</span>}
              title="No upcoming birthdays"
              description="Check back soon for upcoming celebrations."
            />
          ) : (
            <div className="space-y-2">
  {upcomingBirthdays.map((u) => (
    <BirthdayCard
      key={`up-${u.id}`}
      user={u}
      showDays
    />
  ))}
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
