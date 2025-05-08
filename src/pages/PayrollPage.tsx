
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui-custom/Button';
import { 
  Calculator, 
  FileText, 
  History, 
  ChevronDown,
  DollarSign
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
              <p className="mt-1 text-gray-600 text-sm">Manage employee compensation and payroll processing</p>
            </div>
            
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Button 
                onClick={() => handleTabChange('calculate')}
                variant="default"
                className={activeTab === 'calculate' ? 'bg-blue-800' : ''}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Payroll
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    More Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
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
