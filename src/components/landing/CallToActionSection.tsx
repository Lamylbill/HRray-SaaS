import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';

const CallToActionSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section id="get-started" className="py-20 bg-orange-50 text-center">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-blue-900 mb-6">
          Ready to simplify your HR?
        </h2>
        <p className="text-lg text-blue-800 mb-10 max-w-2xl mx-auto">
          HRray helps small teams do big HR things — leave, payroll, compliance, and more.
        </p>
        {isAuthenticated ? (
          <Link to="/dashboard">
            <Button
              size="xl"
              className="bg-blue-800 text-white px-10 py-4 rounded-full hover:bg-blue-900 shadow-lg"
            >
              Go to Dashboard <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        ) : (
          <Link to="/signup">
            <Button
              size="xl"
              className="bg-blue-800 text-white px-10 py-4 rounded-full hover:bg-blue-900 shadow-lg"
            >
              Get Started Free <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
};

export default CallToActionSection;
