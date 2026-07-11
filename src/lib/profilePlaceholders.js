export const MALE_PROFILE_PLACEHOLDER =
  "https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg";

export const FEMALE_PROFILE_PLACEHOLDER =
  "https://phlebotomycareertraining.com/wp-content/uploads/2023/11/default-avatar-photo-placeholder-icon-grey-vector-38519922-e1699300466746.jpg";

export const OTHER_PROFILE_PLACEHOLDER =
  "https://pngtree.com/freepng/user-avatar-placeholder_6796225.html";

export const getProfilePlaceholderByGender = (gender) => {
  const normalizedGender = String(gender || "").trim().toLowerCase();

  if (["male", "m", "man", "boy"].includes(normalizedGender)) {
    return MALE_PROFILE_PLACEHOLDER;
  }

  if (["female", "f", "woman", "girl"].includes(normalizedGender)) {
    return FEMALE_PROFILE_PLACEHOLDER;
  }

  return OTHER_PROFILE_PLACEHOLDER;
};
