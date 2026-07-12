import React from "react";
import Header from "./Header";
import Footer from "./about_components/Footer";
import RoleHeader from "../Components/Features/RoleHeader";
import { isAuthenticated } from "../lib/authToken";

const PrivacyPolicy = () => {
  const isAuthorized = isAuthenticated();

  const renderHeader = () => {
    if (!isAuthorized) return <Header />;
    return <RoleHeader />;
  };

  return (
    <>
      {renderHeader()}
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-70">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500 mb-8">Last updated: April 17, 2026</p>

            <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
                <p>
                  Karpagam Academy of Higher Education Alumni Association ("KAHE Alumni", "we", "us", or "our")
                  operates the website <strong>karpagamalumni.in</strong> (the "Service"). This Privacy Policy explains
                  how we collect, use, disclose, and safeguard your information when you use our Service.
                </p>
                <p className="mt-2">
                  By using the Service, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
                <p>We collect the following types of information:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>
                    <strong>Personal Identification Information:</strong> Name, email address, phone number, graduation
                    year, department, current employer, and profile photo when you register or update your profile.
                  </li>
                  <li>
                    <strong>Account Credentials:</strong> Username and hashed password used for authentication.
                  </li>
                  <li>
                    <strong>Google OAuth Data:</strong> If you sign in with Google, we receive your name, email address,
                    and profile picture from Google as permitted by your Google account settings.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Pages visited, time spent, browser type, and IP address for analytics
                    and security purposes.
                  </li>
                  <li>
                    <strong>User-Generated Content:</strong> News, events, albums, or other content you submit through
                    the platform.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To create and manage your alumni account.</li>
                  <li>To display your profile in the alumni directory (visible to verified members).</li>
                  <li>To send event invitations, newsletters, and important announcements.</li>
                  <li>To verify your identity via Google OAuth.</li>
                  <li>To improve and maintain the platform.</li>
                  <li>To comply with legal obligations.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Data Sharing and Disclosure</h2>
                <p>We do <strong>not</strong> sell or rent your personal data. We may share data only in the following circumstances:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>
                    <strong>Service Providers:</strong> Trusted third-party services (e.g., Supabase for authentication,
                    cloud hosting) that process data on our behalf under strict confidentiality agreements.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.
                  </li>
                  <li>
                    <strong>Institution:</strong> Karpagam Academy of Higher Education for official alumni verification
                    purposes.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Google API Services</h2>
                <p>
                  Our use of information received from Google APIs adheres to the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements. We only use Google account data to authenticate users
                  and populate their profile; we do not share Google user data with third parties for advertising
                  or unrelated purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Data Retention</h2>
                <p>
                  We retain your personal data for as long as your account is active. You may request deletion of
                  your account and associated data by contacting us at{" "}
                  <a href="mailto:alumni@kahedu.edu.in" className="text-green-600 hover:underline">
                    alumni@kahedu.edu.in
                  </a>
                  . Certain data may be retained for legal or administrative purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Security</h2>
                <p>
                  We implement industry-standard security measures including HTTPS encryption, hashed passwords, and
                  access controls. However, no method of transmission over the internet is 100% secure and we cannot
                  guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Access and review the personal data we hold about you.</li>
                  <li>Request correction of inaccurate data.</li>
                  <li>Request deletion of your account and personal data.</li>
                  <li>Withdraw consent for data processing where applicable.</li>
                </ul>
                <p className="mt-2">
                  To exercise these rights, contact us at{" "}
                  <a href="mailto:alumni@kahedu.edu.in" className="text-green-600 hover:underline">
                    alumni@kahedu.edu.in
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Cookies</h2>
                <p>
                  We use cookies and similar technologies to maintain session state (e.g., keeping you logged in)
                  and to analyze site usage. You can control cookies through your browser settings, though disabling
                  cookies may affect certain features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Children's Privacy</h2>
                <p>
                  Our Service is not directed to individuals under 18. We do not knowingly collect personal data
                  from minors. If we become aware of such collection, we will delete the data promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify you of significant changes by
                  posting the new policy on this page with an updated date. Continued use of the Service after
                  changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">12. Contact Us</h2>
                <p>If you have questions about this Privacy Policy, please contact:</p>
                <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="font-semibold text-gray-800">KAHE Alumni Association</p>
                  <p>Pollachi Main Road, Eachanari, Coimbatore</p>
                  <p>Tamil Nadu – 641021, India</p>
                  <p>
                    Email: {" "}
                    <a href="mailto:alumni@kahedu.edu.in" className="text-green-600 hover:underline">
                      alumni@kahedu.edu.in
                    </a>
                  </p>
                  <p>Phone: +91 422 2619300</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
