
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PayrollDashboard from '@/components/payroll/PayrollDashboard';
import PayrollCalculator from '@/components/payroll/PayrollCalculator';
import PayrollHistory from '@/components/payroll/PayrollHistory';
import PayslipGenerator from '@/components/payroll/PayslipGenerator';
import BankTemplates from '@/components/payroll/BankTemplates';
import BankPaymentFileGenerator from '@/components/payroll/BankPaymentFileGenerator';
import CpfSubmissionFileExport from '@/components/payroll/CpfSubmissionFileExport';
import IrasSubmissionFileExport from '@/components/payroll/IrasSubmissionFileExport';
import { useLocation, useNavigate } from 'react-router-dom';

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

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Payroll Management - HRFlow</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-gray-500 mt-1">Manage employee compensation and payroll processing</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calculate">Calculate Payroll</TabsTrigger>
          <TabsTrigger value="history">Payroll History</TabsTrigger>
          <TabsTrigger value="payslips">Generate Payslips</TabsTrigger>
          <TabsTrigger value="bank-templates">Bank Templates</TabsTrigger>
          <TabsTrigger value="bank-files">Bank Payment Files</TabsTrigger>
          <TabsTrigger value="cpf-files">CPF Submission</TabsTrigger>
          <TabsTrigger value="iras-files">IRAS Submission</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <PayrollDashboard />
        </TabsContent>

        <TabsContent value="calculate" className="mt-0">
          <PayrollCalculator />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <PayrollHistory />
        </TabsContent>

        <TabsContent value="payslips" className="mt-0">
          <PayslipGenerator />
        </TabsContent>

        <TabsContent value="bank-templates" className="mt-0">
          <BankTemplates />
        </TabsContent>

        <TabsContent value="bank-files" className="mt-0">
          <BankPaymentFileGenerator />
        </TabsContent>

        <TabsContent value="cpf-files" className="mt-0">
          <CpfSubmissionFileExport />
        </TabsContent>

        <TabsContent value="iras-files" className="mt-0">
          <IrasSubmissionFileExport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollPage;
