import { useEffect, useState } from "react";
import { API_BASE } from "./media";

/**
 * Fetches the signed-in user's profile once and derives the moderation flags
 * that every detail view needs. Replaces the identical effect that used to be
 * copy-pasted into each Single* component.
 *
 * Returns: { currentUserId, canModerate, isAdmin, role }
 *   - canModerate : true for staff + admin (can moderate engagement / content)
 *   - isAdmin     : true only for admin (gates destructive admin actions)
 */
export default function useViewerProfile() {
  const [profile, setProfile] = useState({
    currentUserId: null,
    canModerate: false,
    isAdmin: false,
    role: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("Token");
    if (!token) return;

    let cancelled = false;
    fetch(`${API_BASE}/profile/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const role = (d.role || "").toLowerCase();
        setProfile({
          currentUserId: d.id ?? null,
          canModerate: Boolean(d.is_staff) || role === "admin" || role === "staff",
          isAdmin: role === "admin",
          role,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
