import React, { useState } from "react";
import Header from "./Header";
import Footer from "./about_components/Footer";
import AdminHeader from "../Components/Admin/AdminHeader";
import StaffHeader from "../Components/Staff/StaffHeader";
import AlumniHeader from "../Components/Alumni/AluminiHeader";
import { normalizeRoleForBase } from "../lib/authRole";

const ADMIN_EMAIL = "alumni@kahedu.edu.in";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("Token");
  const roleBase = normalizeRoleForBase(localStorage.getItem("Role"));
  const isAuthorized = Boolean(token && roleBase);

  const renderHeader = () => {
    if (!isAuthorized) return <Header />;
    if (roleBase === "admin") return <AdminHeader />;
    if (roleBase === "staff") return <StaffHeader />;
    return <AlumniHeader />;
  };

  const buildComposeLinks = () => {
    const finalSubject = subject.trim() || "Contact request from KAHE Alumni portal";
    const bodyLines = [
      `Name: ${name.trim() || "N/A"}`,
      `Email: ${email.trim() || "N/A"}`,
      "",
      "Message:",
      message.trim() || "N/A",
    ];
    const finalBody = bodyLines.join("\n");

    const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ADMIN_EMAIL)}&su=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;

    return { mailto, gmailCompose };
  };

  const handleOpenMailApp = (e) => {
    e.preventDefault();
    const { mailto } = buildComposeLinks();
    window.location.assign(mailto);
  };

  const handleOpenGmail = (e) => {
    e.preventDefault();
    const { gmailCompose } = buildComposeLinks();
    window.open(gmailCompose, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {renderHeader()}
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-70">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
            <p className="text-gray-600 mb-8">
              Send your message to the KAHE Alumni admin team. We will get back to you soon.
            </p>

            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                  <h2 className="text-xl font-semibold text-green-800 mb-4">Admin Contact</h2>
                  <ul className="space-y-3 text-gray-700">
                    <li>
                      <span className="font-medium">Email:</span>{" "}
                      <a className="text-green-700 hover:underline" href={`mailto:${ADMIN_EMAIL}`}>
                        {ADMIN_EMAIL}
                      </a>
                    </li>
                    <li>
                      <span className="font-medium">Phone:</span> +91 422 2619300
                    </li>
                    <li>
                      <span className="font-medium">Address:</span> Pollachi Main Road, Eachanari, Coimbatore, Tamil Nadu - 641021
                    </li>
                  </ul>
                </div>
              </div>

              <div className="md:col-span-3">
                <form onSubmit={handleOpenGmail} className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can we help?"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows="6"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition"
                    >
                      Open Gmail Compose
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenMailApp}
                      className="inline-flex items-center justify-center rounded-xl border border-green-600 px-6 py-3 font-semibold text-green-700 hover:bg-green-50 transition"
                    >
                      Open Mail App
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    If one option does not open, try the other based on your device/browser setup.
                  </p>
                </form>
              </div>
            </div>

            {/* About This Portal Section */}
            <div className="mt-8 bg-green-50 rounded-2xl border border-green-100 p-6">
              <h3 className="text-xl font-bold text-green-800 mb-2">
                About This Portal
              </h3>
              <p className="text-gray-700 mb-4">
                This alumni portal was developed by KAHE alumni developers who are passionate
                about connecting our community. Want to know more about the team behind this platform?
              </p>
              <a
                href="/developers"
                className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition"
              >
                Meet the Developers
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;