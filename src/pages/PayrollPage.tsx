
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui-custom/Button';
import { 
  Calculator, 
  FileText, 
  History, 
  ChevronDown,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PayrollDashboard from '@/components/payroll/PayrollDashboard';
import PayrollCalculator from '@/components/payroll/PayrollCalculator';
import PayrollHistory from '@/components/payroll/PayrollHistory';
import PayslipGenerator from '@/components/payroll/PayslipGenerator';
import BankTemplates from '@/components/payroll/BankTemplates';
import BankPaymentFileGenerator from '@/components/payroll/BankPaymentFileGenerator';
import CpfSubmissionFileExport from '@/components/payroll/CpfSubmissionFileExport';
import IrasSubmissionFileExport from '@/components/payroll/IrasSubmissionFileExport';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';

const PayrollPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Set the active tab based on the URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (tabParam && ['dashboard', 'calculate', 'history', 'payslips', 'bank-templates', 'bank-files', 'cpf-files', 'iras-files'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Update the URL when the active tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/payroll?tab=${value}`, { replace: true });
  };

  // Helper function to render the active content based on the tab
  const renderActiveContent = () => {
    switch(activeTab) {
      case 'calculate':
        return <PayrollCalculator />;
      case 'history':
        return <PayrollHistory />;
      case 'payslips':
        return <PayslipGenerator />;
      case 'bank-templates':
        return <BankTemplates />;
      case 'bank-files':
        return <BankPaymentFileGenerator />;
      case 'cpf-files':
        return <CpfSubmissionFileExport />;
      case 'iras-files':
        return <IrasSubmissionFileExport />;
      case 'dashboard':
      default:
        return <PayrollDashboard />;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
        <Helmet>
          <title>Payroll Management - HRFlow</title>
        </Helmet>
        
        <AnimatedSection>
          <div className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
              <p className="mt-1 text-blue-200 text-sm">Manage employee compensation and payroll processing</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleTabChange('calculate')}
                className="bg-orange-500 hover:bg-orange-600 text-white border-0"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Payroll
              </Button>

              <Button
                onClick={() => navigate('/compliance')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                variant="outline"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Compliance
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    More Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50 bg-white">
                  <DropdownMenuItem onClick={() => handleTabChange('history')}>
                    <History className="mr-2 h-4 w-4" />
                    <span>Payroll History</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange('payslips')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Generate Payslips</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange('bank-templates')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Bank Templates</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange('bank-files')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Bank Payment Files</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange('cpf-files')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>CPF Submission</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTabChange('iras-files')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>IRAS Submission</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="mt-4">
            {renderActiveContent()}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default PayrollPage;
