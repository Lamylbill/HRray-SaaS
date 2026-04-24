import React from 'react';
import { Building2, Bell, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const sections = [
  {
    icon: Building2,
    title: 'Company profile',
    description: 'Company name, logo, address, and business registration details.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure email alerts for leave approvals, work pass expiries, and payroll.',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Password, two-factor authentication, and active sessions.',
  },
  {
    icon: CreditCard,
    title: 'Billing',
    description: 'Subscription plan, payment method, and invoices.',
  },
];

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Administrator</p>
          </div>
        </div>
      </div>

      {/* Settings sections — placeholder cards */}
      <div className="space-y-3">
        {sections.map(({ icon: Icon, title, description }) => (
          <button
            key={title}
            className="w-full bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:border-orange-200 hover:shadow-sm transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <div className="text-xs text-orange-500 font-medium flex-shrink-0">Coming soon</div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">HRray v2 · Built for Singapore SMEs</p>
    </div>
  );
}
