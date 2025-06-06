import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';

interface HeroSectionProps {
  isAuthenticated: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isAuthenticated }) => {
  return (
    <section id="home" className="pt-36 pb-28 md:pt-44 md:pb-36 px-6 bg-white">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <AnimatedSection className="flex flex-col">
          <div className="inline-flex items-center rounded-full bg-orange-100 px-5 py-2.5 text-sm mb-8 w-auto">
            <span className="text-orange-600 font-semibold tracking-wide">
              Smart HR Software for SMEs
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-8 leading-tight">
            Streamline your <span className="text-orange-500">HR tasks</span> with confidence
          </h1>
          <p className="text-xl text-blue-800 mb-10 max-w-xl">
            HRFlow simplifies payroll, leave, and compliance for small businesses in Singapore & Malaysia. One dashboard, endless possibilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="xl" className="rounded-full shadow-button bg-blue-800 px-10 text-white">
                  Go to Dashboard <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="xl" className="rounded-full shadow-button bg-blue-800 px-10 text-white">
                    Get Started <ChevronRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="xl" className="rounded-full border-2 border-blue-200 px-10">
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={300} className="hidden md:block relative">
          <div className="relative p-6 bg-white border rounded-3xl overflow-hidden shadow-lg">
            <img
              src="/lovable-uploads/347f020d-90bf-4f98-9f93-42bae2aa6a8f.png"
              alt="HRFlow Dashboard Preview"
              className="relative rounded-2xl shadow-xl w-full"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default HeroSection;
