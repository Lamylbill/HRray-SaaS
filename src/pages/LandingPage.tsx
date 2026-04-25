import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, DollarSign, Shield,
  CheckCircle, ArrowRight, Menu, X
} from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'Employee Management',
    desc: 'Centralised employee records with contracts, documents, and history in one place.',
  },
  {
    icon: Calendar,
    title: 'Leave Tracking',
    desc: 'Apply, approve, and track leave requests. Apply via Telegram bot or directly in-app.',
  },
  {
    icon: DollarSign,
    title: 'Payroll Automation',
    desc: 'Generate payroll with CPF and SDL calculations. Export payslips in one click.',
  },
  {
    icon: Shield,
    title: 'Singapore Compliance',
    desc: 'Stay on top of MOM, CPF, and IRAS requirements. Work pass expiry alerts built in.',
  },
];

const COMPLIANCE = [
  'CPF contribution calculations',
  'MOM leave entitlement rules',
  'IRAS IR8A filing support',
  'Work pass expiry tracking',
  'Foreign worker quota monitoring',
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            <span className="font-bold text-lg text-blue-900">
              HR<span className="text-orange-500">ray</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-blue-900 transition-colors">Features</a>
            <a href="#compliance" className="text-sm text-gray-600 hover:text-blue-900 transition-colors">Compliance</a>
            <Link to="/login" className="text-sm text-gray-600 hover:text-blue-900 transition-colors">Log in</Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>

          <button className="md:hidden text-gray-700" onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {navOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-gray-600">Features</a>
            <a href="#compliance" className="text-sm text-gray-600">Compliance</a>
            <Link to="/login" className="text-sm text-gray-600">Log in</Link>
            <Link to="/signup" className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg text-center">
              Get started free
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            Built for Singapore SMEs
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-blue-900 leading-tight mb-6">
            HR made simple,<br />
            <span className="text-orange-500">compliance made easy</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            HRray handles your payroll, leave, and compliance so you can focus on growing your team — not chasing paperwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Start free trial <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-gray-200 hover:border-blue-300 text-blue-900 font-semibold rounded-xl transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-blue-900 mb-3">Everything your HR team needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">One platform for all your HR operations — from hiring to payroll to compliance.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={20} className="text-orange-500" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="py-20 px-6 bg-blue-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <div className="inline-block bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Singapore-first
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay compliant without the headache
            </h2>
            <p className="text-blue-200 mb-8 leading-relaxed">
              HRray is built for Singapore's regulatory environment. CPF, MOM, and IRAS compliance is baked in — not bolted on.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Get started <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex-1">
            <ul className="space-y-3">
              {COMPLIANCE.map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-orange-400 flex-shrink-0" />
                  <span className="text-blue-100 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-orange-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Ready to simplify your HR?</h2>
          <p className="text-gray-500 mb-8">Join Singapore businesses managing their teams with HRray.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            Start for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">HR</span>
            </div>
            <span className="font-bold text-blue-900">HR<span className="text-orange-500">ray</span></span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} HRray. Built for Singapore SMEs.</p>
        </div>
      </footer>
    </div>
  );
}
