import React from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah T.',
    role: 'HR Manager',
    quote:
      "HRray has transformed how we manage HR tasks. From leave tracking to payroll, it's seamless and compliant with CPF & MOM."
  },
  {
    name: 'Daniel L.',
    role: 'Co-founder',
    quote:
      "The Telegram leave bot is a game changer for our team. Our staff love how simple it is to apply for leave."
  },
  {
    name: 'Mei Yi C.',
    role: 'Operations Director',
    quote:
      "Setup was fast, and the interface is intuitive. The peace of mind knowing we’re IRAS-compliant is priceless."
  }
];

const TestimonialSection = () => {
  return (
    <section className="py-20 bg-blue-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-12 text-blue-900">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md text-left hover:shadow-lg transition"
            >
              <Quote className="text-blue-300 w-6 h-6 mb-4" />
              <p className="text-blue-900 italic mb-4">“{t.quote}”</p>
              <p className="font-semibold text-blue-800">{t.name}</p>
              <p className="text-sm text-blue-600">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
