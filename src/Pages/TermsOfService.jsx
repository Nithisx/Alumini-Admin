import React from "react";
import Header from "./Header";
import Footer from "./about_components/Footer";
import RoleHeader from "../Components/Features/RoleHeader";
import { isAuthenticated } from "../lib/authToken";

const TermsOfService = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-500 mb-8">Last updated: April 17, 2026</p>

            <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using the Karpagam Academy of Higher Education Alumni Portal
                  ("Service") at <strong>karpagamalumni.in</strong>, you agree to be bound by these
                  Terms of Service. If you do not agree, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Eligibility</h2>
                <p>The Service is available to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Verified alumni of Karpagam Academy of Higher Education (KAHE).</li>
                  <li>Current students of KAHE with valid institutional credentials.</li>
                  <li>Faculty and staff authorized by the KAHE Alumni Association.</li>
                </ul>
                <p className="mt-2">You must be at least 18 years old to use this Service.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Account Registration</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                  <li>You must provide accurate and truthful information during registration.</li>
                  <li>You are responsible for all activities that occur under your account.</li>
                  <li>Notify us immediately at <a href="mailto:alumni@kahedu.edu.in" className="text-green-600 hover:underline">alumni@kahedu.edu.in</a> if you suspect unauthorized access.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Acceptable Use</h2>
                <p>You agree <strong>not</strong> to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Post false, misleading, or defamatory content.</li>
                  <li>Harass, abuse, or harm other users.</li>
                  <li>Use the platform for commercial solicitation without prior written approval.</li>
                  <li>Attempt to gain unauthorized access to other accounts or systems.</li>
                  <li>Upload malicious code, spam, or harmful content.</li>
                  <li>Impersonate any person or entity.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. User Content</h2>
                <p>
                  By submitting content (news, events, photos, comments) to the platform, you grant
                  KAHE Alumni Association a non-exclusive, royalty-free license to display and distribute
                  that content within the Service. You retain ownership of your content and are solely
                  responsible for its accuracy and legality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Google Sign-In</h2>
                <p>
                  When you choose to sign in with Google, you authorize us to access your basic Google
                  profile information (name, email, profile picture) solely for authentication and
                  account creation purposes. Our use of Google user data complies with the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    Google API Services User Data Policy
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Intellectual Property</h2>
                <p>
                  All content, branding, logos, and software on the Service are the property of
                  Karpagam Academy of Higher Education or its licensors. You may not copy, reproduce,
                  or distribute any part of the Service without prior written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Termination</h2>
                <p>
                  We reserve the right to suspend or terminate your account at any time if you violate
                  these Terms or engage in conduct harmful to the community. You may delete your account
                  at any time by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Disclaimer of Warranties</h2>
                <p>
                  The Service is provided "as is" without warranties of any kind. We do not guarantee
                  uninterrupted or error-free operation. Use the Service at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Limitation of Liability</h2>
                <p>
                  KAHE Alumni Association shall not be liable for any indirect, incidental, or
                  consequential damages arising from your use of or inability to use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Changes to Terms</h2>
                <p>
                  We may update these Terms periodically. Continued use of the Service after changes
                  are posted constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">12. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of India. Any disputes shall be subject to the
                  exclusive jurisdiction of courts in Coimbatore, Tamil Nadu.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">13. Contact Us</h2>
                <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="font-semibold text-gray-800">KAHE Alumni Association</p>
                  <p>Pollachi Main Road, Eachanari, Coimbatore</p>
                  <p>Tamil Nadu – 641021, India</p>
                  <p>
                    Email:{" "}
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

export default TermsOfService;
