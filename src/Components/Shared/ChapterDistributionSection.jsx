import React, { useState } from "react";

const CITY_INITIAL_VISIBLE = 4;

const normalizeCountryItems = (countryDistribution) => {
  if (Array.isArray(countryDistribution)) {
    return countryDistribution;
  }
  if (Array.isArray(countryDistribution?.chapters)) {
    return countryDistribution.chapters;
  }
  return [];
};

const sectionConfigs = [
  {
    key: "country",
    title: "By Country",
    subtitle: "Global alumni communities",
    emptyLabel: "No country chapters available right now.",
    getItems: (countryDistribution) => normalizeCountryItems(countryDistribution),
    getName: (item) => item.country,
  },
  {
    key: "city",
    title: "By City",
    subtitle: "Most active city chapters",
    emptyLabel: "No city chapters available right now.",
    getItems: (_, cityStateDistribution) =>
      cityStateDistribution?.city_chapters ?? [],
    getName: (item) => item.city,
  },
  {
    key: "state",
    title: "By State",
    subtitle: "Regional alumni networks",
    emptyLabel: "No state chapters available right now.",
    getItems: (_, cityStateDistribution) =>
      cityStateDistribution?.state_chapters ?? [],
    getName: (item) => item.state,
  },
];

const LocationIcon = () => (
  <svg
    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const MembersIcon = () => (
  <svg
    className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ChapterCard = ({ name, count }) => (
  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100">
    <div className="flex items-center mb-4 sm:mb-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-300 to-green-400 rounded-full flex items-center justify-center mr-3 sm:mr-4">
        <LocationIcon />
      </div>
      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-bold text-green-800 leading-tight line-clamp-2">
          {name}
        </h3>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center">
        <MembersIcon />
        <span className="text-green-700 font-semibold text-sm sm:text-base">
          {count} Members
        </span>
      </div>
      <span className="text-green-700 text-xs sm:text-sm font-medium bg-green-100 px-2 py-1 rounded-full">
        Active
      </span>
    </div>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="col-span-full rounded-xl border border-dashed border-green-200 bg-white/80 px-6 py-8 text-center text-green-700">
    {label}
  </div>
);

export default function ChapterDistributionSection({
  countryDistribution,
  cityStateDistribution,
  sectionClassName = "py-12 sm:py-16 lg:py-20",
}) {
  const [isCityExpanded, setIsCityExpanded] = useState(false);

  return (
    <section className={sectionClassName} id="chapters-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900 mb-3 sm:mb-4">
            Global Chapters
          </h2>
          <p className="text-lg sm:text-xl text-green-700 max-w-2xl mx-auto">
            Explore alumni chapters by country, city, and state.
          </p>
        </div>

        <div className="space-y-12">
          {sectionConfigs.map((config) => {
            const items = config.getItems(
              countryDistribution,
              cityStateDistribution
            );
            const isCitySection = config.key === "city";
            const canToggleCityItems =
              isCitySection && items.length > CITY_INITIAL_VISIBLE;
            const visibleItems =
              canToggleCityItems && !isCityExpanded
                ? items.slice(0, CITY_INITIAL_VISIBLE)
                : items;

            return (
              <div key={config.key}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-green-900">
                      {config.title}
                    </h3>
                    <p className="text-sm sm:text-base text-green-700">
                      {config.subtitle}
                    </p>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {items.length} chapter{items.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                  {items.length > 0 ? (
                    visibleItems.map((item, index) => (
                      <ChapterCard
                        key={`${config.key}-${config.getName(item)}-${index}`}
                        name={config.getName(item)}
                        count={item.count}
                      />
                    ))
                  ) : (
                    <EmptyState label={config.emptyLabel} />
                  )}
                </div>

                {canToggleCityItems && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      aria-expanded={isCityExpanded}
                      onClick={() => setIsCityExpanded((prev) => !prev)}
                      className="inline-flex items-center rounded-full border border-green-300 bg-white px-5 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50"
                    >
                      {isCityExpanded
                        ? "Show Less"
                        : `Show More (${items.length - CITY_INITIAL_VISIBLE})`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
