import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Check,
  Trophy,
  Rocket,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { PremiumCard, CardContent } from '@/components/ui-custom/Card';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { LandNavbar } from '@/components/layout/LandNavbar';
import { getFeaturesItems } from '@/components/layout/NavItems';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const features = getFeaturesItems();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HRFlow',
    url: 'https://flowhr.netlify.app',
    logo: 'https://flowhr.netlify.app/lovable-uploads/347f020d-90bf-4f98-9f93-42bae2aa6a8f.png',
    description:
      'HRFlow is an affordable, AI-powered HR management SaaS built for SMEs in Singapore and Malaysia. We help businesses streamline HR, payroll, compliance, and workforce processes with automation and smart insights.',
    sameAs: [
      'https://www.linkedin.com/company/hrflow-saas/',
      'https://twitter.com/hrflowsaas'
    ]
  };

  return (
    <>
      <Helmet>
        <title>HRFlow | AI-Powered HR Software for SMEs</title>
        <meta name="description" content="HRFlow is a smart, affordable HR SaaS platform for SMEs. Automate HR tasks, payroll, and compliance with AI-driven insights." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="HRFlow | AI-Powered HR Software for SMEs" />
        <meta property="og:description" content="Streamline your HR, payroll, and compliance processes with HRFlow. Designed for small and medium businesses in Singapore and Malaysia." />
        <meta property="og:url" content="https://flowhr.netlify.app" />
        <meta property="og:image" content="https://flowhr.netlify.app/lovable-uploads/347f020d-90bf-4f98-9f93-42bae2aa6a8f.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HRFlow | AI-Powered HR Software for SMEs" />
        <meta name="twitter:description" content="Affordable AI-powered HR platform for small and medium businesses in Singapore and Malaysia." />
        <meta name="twitter:image" content="https://flowhr.netlify.app/lovable-uploads/347f020d-90bf-4f98-9f93-42bae2aa6a8f.png" />
        <link rel="canonical" href="https://flowhr.netlify.app/" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gradient-blue">
        <LandNavbar showLogo={true} />

        {/* HERO */}
        <section className="pt-36 pb-28 md:pt-44 md:pb-36 px-6 bg-gradient-to-br from-white via-blue-50 to-indigo-100">
          <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <AnimatedSection className="flex flex-col">
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm mb-8 w-auto">
                <span className="text-white font-semibold tracking-wide">AI-Powered HR Management</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-blue-950 mb-8 leading-tight">
                Simplify your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">HR operations</span> with AI
              </h1>
              <p className="text-xl text-blue-800 mb-10 max-w-xl">
                HRFlow streamlines HR, payroll, and compliance for SMEs in Singapore and Malaysia. Perfect for businesses with 0–100 employees.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="xl" className="rounded-full shadow-button bg-gradient-to-r from-blue-600 to-indigo-600 px-10">
                      Go to Dashboard <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup">
                      <Button size="xl" className="rounded-full shadow-button bg-gradient-to-r from-blue-600 to-indigo-600 px-10">
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
              <div className="relative p-6 glass-card rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/20" />
                <img
                  src="/lovable-uploads/347f020d-90bf-4f98-9f93-42bae2aa6a8f.png"
                  alt="HRFlow Dashboard Preview"
                  className="relative rounded-2xl shadow-xl border w-full"
                />
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-28 px-6 bg-gradient-to-br from-white to-blue-50">
          <div className="container mx-auto max-w-7xl">
            <AnimatedSection className="text-center mb-20">
              <div className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-5 py-2 text-sm font-medium mb-5">
                <Trophy className="h-4 w-4 mr-2" />
                <span>Premium Features</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-6">
                Comprehensive HR Management
              </h2>
              <p className="text-xl text-blue-800 max-w-3xl mx-auto">
                Our platform simplifies every aspect of your HR operations with powerful, easy-to-use tools.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <AnimatedSection key={index} delay={100 * index}>
                  <PremiumCard variant="interactive" className="h-full border-0 overflow-hidden" id={feature.href}>
                    <CardContent className="pt-8 pb-8">
                      <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 inline-block shadow-lg">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-blue-900">{feature.title}</h3>
                      <p className="text-blue-700 leading-relaxed text-lg">{feature.description}</p>
                    </CardContent>
                  </PremiumCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

      {/* Why Choose Section - Completely Redesigned */}
      <section id="pricing" className="py-28 px-6 bg-white relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <AnimatedSection>
              <div className="relative">
                <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-70"></div>
                <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-70"></div>
                <img 
                  src="/lovable-uploads/3bf9aea9-07cc-4942-b0a6-e00cdb531f71.png" 
                  alt="HR Automation Benefits" 
                  className="rounded-3xl shadow-2xl border-0 hover-lift"
                />
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <div className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-5 py-2 text-sm font-medium mb-6">
                <Rocket className="h-4 w-4 mr-2" />
                <span>Why HRFlow?</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-6">
                Designed specifically for SMEs
              </h2>
              <p className="text-xl text-blue-800 mb-10 leading-relaxed">
                We designed HRFlow specifically for SMEs in Singapore and Malaysia to solve the unique challenges they face.
              </p>
              
              <div className="space-y-6">
                {[
                  "Time-saving automation for HR tasks",
                  "Compliance with local regulations (CPF, MOM, IRAS)",
                  "AI-powered insights and analytics",
                  "User-friendly interface with minimal training",
                  "Affordable pricing for growing businesses",
                  "Comprehensive but not overwhelming"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start bg-gradient-card p-5 rounded-xl shadow-sm">
                    <div className="flex-shrink-0 mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-1.5">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <p className="ml-4 text-blue-800 font-medium text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-12">
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  <Button size="xl" className="rounded-full shadow-button hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-700 px-10">
                    {isAuthenticated ? "Go to Dashboard" : "Get Started"} <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials - New Section */}
      <section className="py-28 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 relative">
        <div className="absolute -z-10 top-40 left-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -z-10 bottom-40 right-20 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-6">
                Trusted by businesses like yours
              </h2>
              <p className="text-xl text-blue-800 max-w-3xl mx-auto">
                See what our customers are saying about how HRFlow has transformed their HR operations
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedSection delay={100}>
              <PremiumCard variant="glass" className="h-full">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <p className="text-blue-800 mb-6 leading-relaxed italic">"HRFlow has cut our HR administrative time by 80%. The compliance features alone have saved us from potential regulatory issues multiple times."</p>
                  <div className="mt-4">
                    <p className="font-bold text-blue-900">Sarah Chen</p>
                    <p className="text-blue-700">HR Director, TechVision SG</p>
                  </div>
                </CardContent>
              </PremiumCard>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <PremiumCard variant="glass" className="h-full">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <p className="text-blue-800 mb-6 leading-relaxed italic">"The AI-powered features have transformed how we manage employee performance. It's like having an extra HR team member who works 24/7."</p>
                  <div className="mt-4">
                    <p className="font-bold text-blue-900">Michael Tan</p>
                    <p className="text-blue-700">CEO, GrowthPartners MY</p>
                  </div>
                </CardContent>
              </PremiumCard>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <PremiumCard variant="glass" className="h-full">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <p className="text-blue-800 mb-6 leading-relaxed italic">"As a small business, we couldn't afford a full HR team. HRFlow gives us enterprise-level HR capabilities at a price point that makes sense for our stage."</p>
                  <div className="mt-4">
                    <p className="font-bold text-blue-900">Lisa Wong</p>
                    <p className="text-blue-700">Founder, CreativeHub</p>
                  </div>
                </CardContent>
              </PremiumCard>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Progress Section - New */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-blue-950 mb-6">
                Implementation Timeline
              </h2>
              <p className="text-xl text-blue-800 max-w-3xl mx-auto">
                Get up and running quickly with our streamlined onboarding process
              </p>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">Day 1: Initial Setup</h3>
                  <span className="text-blue-700 font-medium">100%</span>
                </div>
                <Progress value={100} className="h-3" />
                <p className="text-blue-700">Account creation, basic configuration, and importing employee data</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">Day 2-3: Team Training</h3>
                  <span className="text-blue-700 font-medium">80%</span>
                </div>
                <Progress value={80} className="h-3" />
                <p className="text-blue-700">Interactive training sessions for HR team and managers</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">Week 1: Full Implementation</h3>
                  <span className="text-blue-700 font-medium">60%</span>
                </div>
                <Progress value={60} className="h-3" />
                <p className="text-blue-700">Customization of policies, workflows, and approval processes</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">Week 2: Advanced Features</h3>
                  <span className="text-blue-700 font-medium">40%</span>
                </div>
                <Progress value={40} className="h-3" />
                <p className="text-blue-700">Activation of reporting, analytics, and AI-powered features</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section - Completely Redesigned */}
      <section id="contact" className="py-28 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 relative overflow-hidden">
        <div className="absolute -z-10 top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -z-10 bottom-20 right-20 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <AnimatedSection>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-16 text-white text-center shadow-2xl border border-white/20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your HR operations?</h2>
              <p className="text-2xl opacity-95 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join hundreds of SMEs using HRFlow to save time, ensure compliance, and improve employee experience.
              </p>
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                <Button 
                  variant="glass" 
                  size="xl" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full px-10 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Start Your Free Trial"} <ChevronRight className="h-6 w-6 ml-2" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer - Completely Redesigned */}
      <footer id="about" className="py-20 px-6 bg-white border-t border-blue-100">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-display font-bold px-3 py-2 rounded-lg">HR</span>
                <span className="font-display font-bold text-2xl text-blue-950">Flow</span>
              </div>
              <p className="text-blue-800 mb-6 leading-relaxed">
                AI-powered HR management for SMEs in Singapore and Malaysia. Making HR simple, compliant, and efficient.
              </p>
              <div className="flex space-x-4">
                <a href="#" aria-label="Go to Facebook" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" aria-label="Go to twitter" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" aria-label="Go to Instagram" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-blue-900">Product</h3>
              <ul className="space-y-4">
                {['Features', 'Pricing', 'Demo', 'Security'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} aria-label={item} className="text-blue-700 hover:text-blue-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-blue-900">Company</h3>
              <ul className="space-y-4">
                {['About', 'Careers', 'Blog', 'Legal'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} aria-label={item} className="text-blue-700 hover:text-blue-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 text-blue-900">Support</h3>
              <ul className="space-y-4">
                {['Help Center', 'Contact', 'Status', 'Guides'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(' ', '-')}`} aria-label={item} className="text-blue-700 hover:text-blue-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <Separator className="my-12 bg-blue-100" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-700 text-sm">
              © {new Date().getFullYear()} HRFlow. All rights reserved.
            </p>
            <div className="flex space-x-10 mt-6 md:mt-0">
              {['Privacy', 'Terms', 'Cookies'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} aria-label={item} className="text-blue-700 text-sm hover:text-blue-500 transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;
