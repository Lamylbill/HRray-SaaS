import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, DollarSign, Shield,
  CheckCircle, ArrowRight, Menu, X, Tag
} from 'lucide-react';
import { blogService } from '@/integrations/supabase/blog-service';
import { BlogPost } from '@/integrations/supabase/blog-types';

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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    blogService.getPosts(1, 3, 'false').then(result => {
      setBlogPosts(result.posts || []);
    }).catch(() => {});
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
            <Link to="/blog" className="text-sm text-gray-600 hover:text-blue-900 transition-colors">Blog</Link>
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
            <Link to="/blog" className="text-sm text-gray-600">Blog</Link>
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

      {/* Blog */}
      <section id="blog" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                From the blog
              </div>
              <h2 className="text-3xl font-bold text-blue-900">HR insights for Singapore SMEs</h2>
            </div>
            <Link
              to="/blog"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              View all articles <ArrowRight size={15} />
            </Link>
          </div>

          {blogPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {blogPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/post/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                      <span className="text-white/30 text-5xl font-bold">HR</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-blue-900 text-base leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">
                            <Tag size={10} />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Tips, guides, and updates on HR in Singapore.</p>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Visit the blog <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link to="/blog" className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
              View all articles →
            </Link>
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
