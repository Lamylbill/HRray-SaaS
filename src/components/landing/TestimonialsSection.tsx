import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Amira L.',
    role: 'Office Manager, Kuala Lumpur',
    quote: 'HRray helped us automate payroll and leave tracking seamlessly. The Telegram bot is a game-changer!',
    rating: 5
  },
  {
    name: 'Daniel T.',
    role: 'Startup Founder, Singapore',
    quote: 'No more compliance headaches — HRray makes CPF and IRAS reporting a breeze. Totally worth it.',
    rating: 5
  },
  {
    name: 'Michelle K.',
    role: 'HR Executive, JB',
    quote: 'User-friendly, affordable, and backed by amazing support. Our HR workflow has never been smoother.',
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-blue-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-12 text-blue-900">What our users say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="flex items-center mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 mr-1" />
                ))}
              </div>
              <p className="text-blue-900 font-medium mb-2">"{t.quote}"</p>
              <p className="text-sm text-blue-800">— {t.name}, {t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
