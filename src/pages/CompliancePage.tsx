
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Users, 
  UserCheck, 
  Briefcase,
  CalendarCheck
} from 'lucide-react';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useComplianceData } from '@/hooks/use-compliance';
import ComplianceScore from '@/components/compliance/ComplianceScore';
import CPFValidation from '@/components/compliance/CPFValidation';
import IRASSubmission from '@/components/compliance/IRASSubmission';
import WorkPassExpiry from '@/components/compliance/WorkPassExpiry';
import MissingDataChecks from '@/components/compliance/MissingDataChecks';
import LeavePolicyViolations from '@/components/compliance/LeavePolicyViolations';
import OvertimeBreaches from '@/components/compliance/OvertimeBreaches';
import ForeignWorkerQuota from '@/components/compliance/ForeignWorkerQuota';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CompliancePage: React.FC = () => {
  const { 
    complianceScore,
    cpfValidation,
    irasSubmission,
    workPassExpiry,
    missingDataChecks,
    leavePolicyViolations,
    overtimeBreaches,
    foreignWorkerQuota,
    refreshComplianceData
  } = useComplianceData();

  useEffect(() => {
    // Load compliance data on initial page load
    refreshComplianceData();
  }, [refreshComplianceData]);

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Helmet>
          <title>Compliance Management - HRFlow</title>
        </Helmet>
        
        <AnimatedSection>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Management</h1>
              <p className="mt-1 text-gray-600 text-sm">Monitor and manage regulatory compliance requirements</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Compliance Dashboard</CardTitle>
                  <CardDescription>
                    Overview of all compliance measures and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="cpf" className="w-full">
                    <TabsList className="w-full mb-4 flex flex-wrap">
                      <TabsTrigger value="cpf" className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>CPF Validation</span>
                      </TabsTrigger>
                      <TabsTrigger value="iras" className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>IRAS Submission</span>
                      </TabsTrigger>
                      <TabsTrigger value="workpass" className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Work Pass Expiry</span>
                      </TabsTrigger>
                      <TabsTrigger value="missingdata" className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Missing Data</span>
                      </TabsTrigger>
                      <TabsTrigger value="leave" className="flex items-center">
                        <CalendarCheck className="h-4 w-4 mr-1" />
                        <span>Leave Policies</span>
                      </TabsTrigger>
                      <TabsTrigger value="overtime" className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Overtime</span>
                      </TabsTrigger>
                      <TabsTrigger value="quota" className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>FW Quota</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="cpf">
                      <CPFValidation data={cpfValidation} onRefresh={refreshComplianceData} />
                    </TabsContent>
                    
                    <TabsContent value="iras">
                      <IRASSubmission data={irasSubmission} onRefresh={refreshComplianceData} />
                    </TabsContent>
                    
                    <TabsContent value="workpass">
                      <WorkPassExpiry data={workPassExpiry} onRefresh={refreshComplianceData} />
                    </TabsContent>
                    
                    <TabsContent value="missingdata">
                      <MissingDataChecks data={missingDataChecks} onRefresh={refreshComplianceData} />
                    </TabsContent>
                    
                    <TabsContent value="leave">
                      <LeavePolicyViolations data={leavePolicyViolations} onRefresh={refreshComplianceData} />
                    </TabsContent>
                    
                    <TabsContent value="overtime">
                      <OvertimeBreaches data={overtimeBreaches} onRefresh={refreshComplianceData} />
                    </TabsContent>
                    
                    <TabsContent value="quota">
                      <ForeignWorkerQuota data={foreignWorkerQuota} onRefresh={refreshComplianceData} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <ComplianceScore score={complianceScore} />
              
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button 
                      onClick={refreshComplianceData} 
                      className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 w-full text-left"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Run Compliance Check</span>
                    </button>
                    <button 
                      className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 w-full text-left"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Export Compliance Report</span>
                    </button>
                    <button 
                      className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 w-full text-left"
                    >
                      <Users className="h-4 w-4" />
                      <span>Update Foreign Worker Quotas</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default CompliancePage;
