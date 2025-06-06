import React from 'react';
import { ShieldCheck, Zap, Globe, BadgeDollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const valuePoints = [
  {
    icon: <ShieldCheck className="text-blue-800 w-6 h-6" />,
    title: 'Built for SG & MY Compliance',
    description: 'Stay compliant with CPF, MOM, and IRAS requirements out of the box.'
  },
  {
    icon: <Zap className="text-blue-800 w-6 h-6" />,
    title: 'Simple, Fast Setup',
    description: 'Go live in minutes — no training, no downtime.'
  },
  {
    icon: <BadgeDollarSign className="text-blue-800 w-6 h-6" />,
    title: 'Affordable & Transparent Pricing',
    description: 'Flat monthly fees with no hidden charges, perfect for 0–100 employee teams.'
  },
  {
    icon: <TrendingUp className="text-blue-800 w-6 h-6" />,
    title: 'Smart, Scalable HR Automation',
    description: 'Powerful AI-driven insights to support your company as it grows.'
  },
  {
    icon: <Globe className="text-blue-800 w-6 h-6" />,
    title: 'Local Support, Global Standards',
    description: 'Support that understands your market — with best-in-class tech under the hood.'
  }
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: 'easeOut'
    }
  })
};

const WhyHRraySection = () => {
  return (
    <section id="why-hrray" className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-10 text-blue-900">Why HRray?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {valuePoints.map((point, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-left"
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
            >
              <div className="mb-4">{point.icon}</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{point.title}</h3>
              <p className="text-sm text-blue-800">{point.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyHRraySection;
