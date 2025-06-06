import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="about" className="bg-white border-t border-blue-100 text-sm text-blue-800">
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-xl font-semibold text-blue-900 mb-4">HRray</h3>
          <p>
            Smart, scalable HR solutions for SMEs in Singapore and Malaysia.
          </p>
          <div className="flex space-x-4 mt-4 text-blue-700">
            <a href="mailto:hello@hrray.com"><Mail className="w-5 h-5" /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><Linkedin className="w-5 h-5" /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><Facebook className="w-5 h-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-blue-900 mb-3">Product</h4>
          <ul className="space-y-2">
            <li><Link to="/features" className="hover:underline">Features</Link></li>
            <li><Link to="/blog" className="hover:underline">Blog</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-blue-900 mb-3">Compliance</h4>
          <ul className="space-y-2">
            <li>CPF Ready</li>
            <li>IRAS Auto Filing</li>
            <li>MOM Leave Compliance</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-blue-500 border-t border-blue-100 py-4">
        © {new Date().getFullYear()} HRray. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
