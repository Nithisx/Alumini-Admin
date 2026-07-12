import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores";
import { toast } from "react-toastify";
import kahelogo from "../assets/KAHEAA.svg";
import { consumeLoginRedirect, DEFAULT_AFTER_LOGIN } from "../lib/loginRedirect";

// Landing page Google redirects back to after the Supabase consent screen.
// The Supabase JS SDK (lib/supabaseClient.js, detectSessionInUrl: true) has
// already parsed the ?code=... in this URL and exchanged it for a session
// by the time getSession() resolves below — we only need the raw Supabase
// access_token out of it. Our own backend re-verifies that token
// (GoogleOAuthLoginView) and issues our real JWT/DRF token; the Supabase
// session itself is discarded immediately after.
export default function OAuthComplete() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guards React StrictMode's dev-mode double-invoke
    ran.current = true;

    (async () => {
      let accessToken;
      try {
        accessToken = await authStore.readOAuthSession();
      } catch {
        navigate("/login?oauth=error", { replace: true });
        return;
      }

      try {
        const body = await authStore.completeGoogleOAuth(accessToken);

        if (body.jwt || body.token) {
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
  }, [navigate, authStore]);

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
