import React from 'react';
import { Hammer } from 'lucide-react';
import { motion } from 'framer-motion';

const roadmapItems = [
  {
    title: 'Site Launch',
    description: 'HRray.com is live with essential HR tools for SMEs.',
  },
  {
    title: 'Employee Management',
    description: 'Complete staff records, job roles, and secure data management.',
  },
  {
    title: 'Leave Management',
    description: 'Employees can apply for leave. Admins can track and approve leave requests.',
  },
  {
    title: 'Telegram Leave Bot',
    description: 'Let employees apply for leave using Telegram – lightweight and fast.',
  },
  {
    title: 'Payroll (In Progress)',
    description: 'Automated salary calculation with CPF deductions.'
  },
  {
    title: 'Admin Analytics (In Progress)',
    description: 'Insights and reports to monitor HR activity and trends.',
  },
  {
    title: 'Onboarding & Recruitment (In Progress)',
    description: 'Simplify the hiring process and new employee setup.',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

const ProductRoadmapSection = () => {
  return (
    <section id="roadmap" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-12 text-blue-900">Product Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roadmapItems.map((item, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-left relative"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
            >
              {item.title.toLowerCase().includes('in progress') && (
                <div className="absolute -top-3 -right-3">
                  <Hammer className="text-orange-500 animate-bounce w-6 h-6" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{item.title}</h3>
              <p className="text-sm text-blue-800">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductRoadmapSection;
