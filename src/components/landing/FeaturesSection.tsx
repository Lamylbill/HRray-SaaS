import React from 'react';
import { CheckCircle } from 'lucide-react';

const features = [
  {
    title: 'Employee Self-Service via Telegram',
    description: 'Let employees apply for leave directly through Telegram, reducing admin load.',
    icon: <CheckCircle className="text-orange-500" />
  },
  {
    title: 'CPF, MOM, IRAS Compliance',
    description: 'Ensure every payroll and HR process meets Singapore regulations.',
    icon: <CheckCircle className="text-orange-500" />
  },
  {
    title: 'Leave & Attendance Tracking',
    description: 'Track leave balances and work hours accurately with built-in compliance.',
    icon: <CheckCircle className="text-orange-500" />
  },
  {
    title: 'Payroll Automation',
    description: 'Calculate monthly salaries with CPF deductions handled automatically.',
    icon: <CheckCircle className="text-orange-500" />
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white text-center border-t border-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-blue-700 mb-12">What HRray Can Do</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition bg-white">
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="font-semibold text-lg text-blue-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-blue-700 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
