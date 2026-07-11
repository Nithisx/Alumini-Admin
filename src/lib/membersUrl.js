const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const pickFirstValue = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = pickFirstValue(...value);
      if (hasValue(nested)) return nested;
      continue;
    }

    if (hasValue(value)) return String(value).trim();
  }

  return "";
};

export const buildMembersUrl = (basePath, filters = {}) => {
  const params = new URLSearchParams();

  const setParam = (key, value) => {
    const normalized = pickFirstValue(value);
    if (normalized) params.set(key, normalized);
  };

  setParam("course", filters.course);
  setParam("branch", filters.branch);
  setParam("passed_out_year", filters.passedOutYear ?? filters.passed_out_year);
//   setParam("college_name", filters.collegeName ?? filters.college_name);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};

export const buildBatchMateMembersUrl = (basePath, batchMate) => {
  const primaryCourse = batchMate?.user_courses?.[0] || {};

  return buildMembersUrl(basePath, {
    course: primaryCourse.course ?? batchMate?.educational_course,
    branch: primaryCourse.branch ?? primaryCourse.stream ?? batchMate?.branch,
    passedOutYear:
      primaryCourse.passed_out_year ??
      primaryCourse.course_end_year ??
      batchMate?.passed_out_year ??
      batchMate?.end_year,
    collegeName: primaryCourse.college_name ?? batchMate?.college_name,
  });
};