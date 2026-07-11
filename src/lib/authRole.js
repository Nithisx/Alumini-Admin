export function normalizeRoleKey(role) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "student") return "student";
  if (value === "alumni") return "alumni";
  if (value === "staff") return "staff";
  if (value === "admin") return "admin";

  return null;
}

