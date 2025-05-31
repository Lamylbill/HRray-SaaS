import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WhyHRraySection from '@/components/landing/WhyHRraySection';
import ProductRoadmapSection from '@/components/landing/ProductRoadmapSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CallToActionSection from '@/components/landing/CallToActionSection';
import Footer from '@/components/landing/Footer';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <main>
      <HeroSection isAuthenticated={isAuthenticated} />
      <FeaturesSection />
      <WhyHRraySection />
      <ProductRoadmapSection />
      <TestimonialsSection />
      <CallToActionSection isAuthenticated={isAuthenticated} />
      <Footer />
    </main>
  );
};

export default Index;
