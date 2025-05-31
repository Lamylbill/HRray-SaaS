import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = ({ isAuthenticated }) => {
  return (
    <section className="pt-36 pb-28 md:pt-44 md:pb-36 px-6 bg-white">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <div className="flex flex-col">
          <div className="inline-flex items-center rounded-full bg-blue-700 px-5 py-2.5 text-sm mb-8 w-auto">
            <span className="text-white font-semibold tracking-wide">HR Made Simple</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-blue-800 mb-8 leading-tight">
            Smarter <span className="text-orange-500">HR software</span> for growing teams
          </h1>
          <p className="text-xl text-blue-700 mb-10 max-w-xl">
            Manage employees, leave, payroll and compliance — all in one AI-powered platform, built for SMEs in Singapore & Malaysia.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            {isAuthenticated ? (
              <Link to="/dashboard" className="bg-blue-700 text-white rounded-full px-10 py-4 font-semibold hover:bg-blue-900">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="bg-blue-700 text-white rounded-full px-10 py-4 font-semibold hover:bg-blue-900">
                  Get Started Free
                </Link>
                <Link to="/login" className="border border-blue-300 text-blue-700 rounded-full px-10 py-4 font-semibold hover:bg-blue-100">
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hidden md:block relative">
          <div className="relative p-6 rounded-3xl overflow-hidden border border-blue-200 shadow-xl bg-white">
            <img
              src="/lovable-uploads/347f020d-90bf-4f98-9f93-42bae2aa6a8f.png"
              alt="HRray Dashboard Preview"
              className="rounded-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
