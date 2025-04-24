tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { UpgradeButton } from '@/components/Pricing/UpgradeButton';
import { Link } from 'react-router-dom';
import { prices } from "@/lib/prices";

const PricingPage: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Compare our Plans & Pricing
        </h2>
        <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto">
          Clear, affordable subscriptions for every SME size
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {/* Basic Plan */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Basic</h3>
            <p className="mt-2 text-sm text-gray-500">Free</p>
            <p className="mt-4 text-sm text-gray-700">For micro teams needing simple HR.</p>
            <ul className="mt-6 space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Employee records</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Leave management</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Payroll export (CSV)</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">CPF/EPF calculator</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Email support</span>
              </li>
            </ul>
          </div>
          <div className="mt-8">            
          
            <Link to="/signup">
            
              <Button>Start for Free</Button>
            </Link>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="rounded-lg border-2 border-[#1d4ED8] bg-white p-8 shadow-lg flex flex-col justify-between">
        <div className="text-center">
            <span className="bg-[#1d4ED8] text-white text-sm font-medium px-3 py-1 rounded-full">Most Popular</span>
          </div>
          <div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Pro</h3>
            <p className="mt-2 text-sm text-gray-500">S$19/mo</p>
            <p className="mt-4 text-sm text-gray-700">For growing SMEs (most popular)</p>
            <ul className="mt-6 space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">All Basic features</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Payroll automation & payslips</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Performance tracking</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">AI-powered analytics</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Priority email/chat support</span>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <UpgradeButton priceId={prices.find((price) => price.name === "pro")?.priceIds.monthly || ""}>
            Upgrade to Pro
            </UpgradeButton>
          </div>
        </div>
            
        {/* Enterprise Plan */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
            <p className="mt-2 text-sm text-gray-500">S$49/mo</p>
            <p className="mt-4 text-sm text-gray-700">For teams needing customization</p>
            <ul className="mt-6 space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">All Pro features</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Custom workflows</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">HR analytics dashboards</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">Dedicated onboarding</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-sm text-gray-500">SLA/enterprise support</span>
              </li>
            </ul>
          </div>
          <div className="mt-8">
              <a href="mailto:sales@hrray.com">
                <Button variant="outline">Contact Sales</Button>
              </a>
          </div>
        </div>
      </div>
      <div className='mt-8 text-center'>
        <p className="text-xs text-gray-500">All paid plans include a free 14-day trial. No credit card required to start.</p>
      </div>
    </div>
  );
};

export default PricingPage;