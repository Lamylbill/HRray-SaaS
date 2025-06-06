import React from 'react';
import { CheckCircle } from 'lucide-react';

const features = [
  {
    title: 'Leave Management via Telegram',
    description: 'Apply and approve leave requests through a smart Telegram bot.',
  },
  {
    title: 'CPF, MOM, IRAS Compliance',
    description: 'Stay compliant with Singapore’s payroll and HR regulations.',
  },
  {
    title: 'Employee Database',
    description: 'Centralised record keeping with secure data handling.',
  },
  {
    title: 'Payroll Automation',
    description: 'Generate payroll with CPF calculations and downloadable payslips.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-blue-900 mb-10">Core Features</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 bg-white border border-blue-100 rounded-xl shadow hover:shadow-md transition"
            >
              <CheckCircle className="text-orange-500 mb-4 mx-auto w-6 h-6" />
              <h3 className="font-semibold text-lg text-blue-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-blue-800">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
