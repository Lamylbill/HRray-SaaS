import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';

const CallToActionSection = () => {
  return (
    <section className="py-20 bg-white text-center border-t border-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-blue-900 mb-6">
          Ready to streamline your HR processes?
        </h2>
        <p className="text-lg text-blue-800 mb-10 max-w-2xl mx-auto">
          Join the growing number of SMEs in Singapore and Malaysia using HRray to manage payroll, compliance, and leave — all in one place.
        </p>
        <Link to="/signup">
          <Button size="xl" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-full shadow-lg">
            Get Started Free <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CallToActionSection;
