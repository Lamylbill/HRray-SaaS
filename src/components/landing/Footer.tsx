import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white text-blue-700 border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-xl mb-4 text-blue-800">HRray</h3>
          <p className="text-sm text-blue-700">
            Smart, compliant HR software built for SMEs in Singapore and Malaysia.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-md mb-3 text-blue-800">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="#features" className="hover:text-orange-500">Features</Link></li>
            <li><Link to="#roadmap" className="hover:text-orange-500">Roadmap</Link></li>
            <li><Link to="#contact" className="hover:text-orange-500">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-md mb-3 text-blue-800">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="#about" className="hover:text-orange-500">About</Link></li>
            <li><Link to="#blog" className="hover:text-orange-500">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-md mb-3 text-blue-800">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="#privacy" className="hover:text-orange-500">Privacy Policy</Link></li>
            <li><Link to="#terms" className="hover:text-orange-500">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 text-center text-sm text-blue-800">
        &copy; {new Date().getFullYear()} HRray. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
