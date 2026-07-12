import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissionStore } from "../stores";
import { toast } from "react-toastify";
import kahelogo from "../assets/KAHEAA.svg";
import axios from "../lib/axiosInstance";
import { API_BASE } from "../config/api";
import { storeLoginCredential } from "../lib/authToken";

import { getSupabaseClient } from "../lib/supabaseClient";
import { consumeLoginRedirect, DEFAULT_AFTER_LOGIN } from "../lib/loginRedirect";

const roleMap = { Admin: "admin", Staff: "staff", Alumni: "alumni", Student: "student" };

// Landing page Google redirects back to after the Supabase consent screen.
// The Supabase JS SDK (lib/supabaseClient.js, detectSessionInUrl: true) has
// already parsed the ?code=... in this URL and exchanged it for a session
// by the time getSession() resolves below — we only need the raw Supabase
// access_token out of it. Our own backend re-verifies that token
// (GoogleOAuthLoginView) and issues our real JWT/DRF token; the Supabase
// session itself is discarded immediately after.
export default function OAuthComplete() {
  const navigate = useNavigate();
  const permissionStore = usePermissionStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guards React StrictMode's dev-mode double-invoke
    ran.current = true;

    (async () => {
      let accessToken;
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        accessToken = data?.session?.access_token;
        if (error || !accessToken) {
          navigate("/login?oauth=error", { replace: true });
          return;
        }
      } catch {
        navigate("/login?oauth=error", { replace: true });
        return;
      }

      try {
        const { data: body } = await axios.post(`${API_BASE}/auth/google/`, {
          access_token: accessToken,
        });

        if (body.jwt || body.token) {
          const roleKey = roleMap[body.role] || "alumni";
          storeLoginCredential(body, roleKey);
          permissionStore.seedFromLogin(body);
          toast.success("Signed in with Google successfully!");
          // Honour the page the user was originally trying to reach (stashed
          // before we bounced them to /login). sessionStorage survives the
          // round-trip out to Google and back.
          navigate(consumeLoginRedirect() || DEFAULT_AFTER_LOGIN, { replace: true });
          return;
        }

        if (body.status === "pending") {
          navigate("/login?oauth=pending", { replace: true });
          return;
        }

        if (body.status === "new_user") {
          navigate("/oauth-signup", {
            replace: true,
            state: {
              accessToken,
              email: body.email,
              first_name: body.first_name,
              last_name: body.last_name,
              avatar_url: body.avatar_url,
            },
          });
          return;
        }

        navigate("/login?oauth=error", { replace: true });
      } catch {
        navigate("/login?oauth=error", { replace: true });
      }
    })();
  }, [navigate, permissionStore]);

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
