import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import kahelogo from "../assets/KAHEAA.svg";
import { storeLoginCredential } from "../lib/authToken";

const roleMap = { Admin: "admin", Staff: "staff", Alumni: "alumni", Student: "student" };

function defaultDashboard() {
  return "/dashboard";
}

// Landing page for the backend-driven Google OAuth redirect. The httpOnly
// auth cookie is already set by the time the browser gets here (the
// callback view set it before redirecting) — the JWT/role in the URL are
// the same values, just handed to the frontend once so it can populate
// localStorage for the existing route guards, exactly like the password
// login path does via storeLoginCredential.
export default function OAuthComplete() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const jwt = params.get("jwt");
    const role = params.get("role");
    const roleKey = roleMap[role] || "alumni";

    if (jwt && storeLoginCredential({ jwt }, roleKey)) {
      toast.success("Signed in with Google successfully!");
      navigate(defaultDashboard(roleKey), { replace: true });
    } else {
      toast.error("Could not complete sign-in. Please try logging in again.");
      navigate("/login", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <img src={kahelogo} alt="Logo" className="mx-auto h-20 sm:h-24 w-auto max-w-[260px] object-contain mb-4" />
        <p className="text-green-600 font-semibold text-lg">Finishing sign-in...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );
}
