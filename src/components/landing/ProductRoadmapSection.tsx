import React from 'react';
import { Hammer } from 'lucide-react';

const roadmapItems = [
  {
    title: 'Site Live',
    description: 'Our platform is live and operational.',
  },
  {
    title: 'Employee Management',
    description: 'Secure database for employee records with full edit and view features.'
  },
  {
    title: 'Leave Module',
    description: 'Full-featured leave tracking, including MOM-compliant policies.'
  },
  {
    title: 'Leave Bot on Telegram',
    description: 'Employees can apply and check leave via Telegram integration.'
  },
  {
    title: 'Payroll Module',
    description: 'Automated CPF-calculated payroll processing.',
    statusIcon: <Hammer className="animate-bounce text-orange-500 w-5 h-5" />
  },
  {
    title: 'Admin Analytics',
    description: 'Get quick HR insights with built-in dashboards.',
    statusIcon: <Hammer className="animate-bounce text-orange-500 w-5 h-5" />
  },
  {
    title: 'Onboarding & Recruitment',
    description: 'Smart applicant tracking and onboarding workflows.',
    statusIcon: <Hammer className="animate-bounce text-orange-500 w-5 h-5" />
  },
];

const ProductRoadmapSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-10 text-blue-900">Product Roadmap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {roadmapItems.map((item, index) => (
            <div
              key={index}
              className="p-6 border border-blue-100 rounded-xl shadow-md hover:shadow-lg text-left transition bg-white"
            >
              <div className="flex items-center mb-2 gap-2">
                <h3 className="font-semibold text-lg text-blue-900">{item.title}</h3>
                {item.statusIcon}
              </div>
              <p className="text-sm text-blue-800">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductRoadmapSection;
