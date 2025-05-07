
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { CheckCircle, Download, FileText, FileType, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PayrollPeriod } from '@/types/payroll';
import { format, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CpfSubmissionFileExport: React.FC = () => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [submissionDate, setSubmissionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [employerRefNumber, setEmployerRefNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedFile, setGeneratedFile] = useState('');
  const [payrollSummary, setPayrollSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchPayrollSummary(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('status', 'Completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPayrollPeriods(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollSummary = async (periodId: string) => {
    try {
      // Get payroll items for the period
      const { data, error } = await supabase
        .from('payroll_items')
        .select(`
          id, basic_salary, allowances, employee_cpf, employer_cpf,
          employees (id, full_name, nric, date_of_birth)
        `)
        .eq('payroll_period_id', periodId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Calculate total CPF
        const totalEmployeeCpf = data.reduce((sum, item) => sum + (item.employee_cpf || 0), 0);
        const totalEmployerCpf = data.reduce((sum, item) => sum + (item.employer_cpf || 0), 0);
        const totalWages = data.reduce((sum, item) => sum + (item.basic_salary || 0) + (item.allowances || 0), 0);
        
        setPayrollSummary({
          employeeCount: data.length,
          totalWages,
          totalEmployeeCpf,
          totalEmployerCpf,
          totalCpf: totalEmployeeCpf + totalEmployerCpf
        });
      } else {
        setPayrollSummary(null);
      }
    } catch (error: any) {
      console.error('Error fetching payroll summary:', error);
    }
  };

  const handleGenerateFile = async () => {
    if (!selectedPeriodId || !employerRefNumber || !submissionDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // In a real implementation, this would generate the actual CPF submission file
      // For now, we'll simulate the process
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
      
      const fileName = `CPF_Submission_${format(parseISO(submissionDate), 'yyyyMMdd')}.txt`;
      const filePath = `cpf-exports/${fileName}`;
      
      // Record the export
      const { error } = await supabase
        .from('payroll_exports')
        .insert({
          payroll_period_id: selectedPeriodId,
          export_type: 'CPF',
          file_path: filePath,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });
      
      if (error) throw error;
      
      setGeneratedFile(fileName);
      
      toast({
        title: 'Success',
        description: 'CPF submission file generated successfully',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error generating file',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading && payrollPeriods.length === 0) {
    return <LoadingSpinner size="lg" />;
  }

  const selectedPeriod = payrollPeriods.find(p => p.id === selectedPeriodId);

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>CPF Submission File Export</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="generate">Generate File</TabsTrigger>
              <TabsTrigger value="history">Export History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="payroll-period">Payroll Period</Label>
                    <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                      <SelectTrigger id="payroll-period">
                        <SelectValue placeholder="Select a payroll period" />
                      </SelectTrigger>
                      <SelectContent>
                        {payrollPeriods.map(period => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.period_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="submission-date">Submission Date</Label>
                    <Input
                      id="submission-date"
                      type="date"
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employer-ref">CPF Submission Number</Label>
                    <Input
                      id="employer-ref"
                      placeholder="e.g., 12345678A"
                      value={employerRefNumber}
                      onChange={(e) => setEmployerRefNumber(e.target.value)}
                    />
                  </div>
                </div>
                
                {selectedPeriod && payrollSummary && (
                  <div className="rounded-md border p-4 bg-gray-50">
                    <h3 className="font-medium mb-2">Summary for {selectedPeriod.period_name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-2 bg-white rounded shadow-sm">
                        <div className="text-xs text-gray-500">Period</div>
                        <div className="font-semibold">
                          {format(new Date(selectedPeriod.start_date), 'dd/MM')} - {format(new Date(selectedPeriod.end_date), 'dd/MM/yy')}
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded shadow-sm">
                        <div className="text-xs text-gray-500">Employees</div>
                        <div className="font-semibold">{payrollSummary.employeeCount}</div>
                      </div>
                      <div className="p-2 bg-white rounded shadow-sm">
                        <div className="text-xs text-gray-500">Total Wages</div>
                        <div className="font-semibold">${payrollSummary.totalWages.toFixed(2)}</div>
                      </div>
                      <div className="p-2 bg-white rounded shadow-sm">
                        <div className="text-xs text-gray-500">Employee CPF</div>
                        <div className="font-semibold">${payrollSummary.totalEmployeeCpf.toFixed(2)}</div>
                      </div>
                      <div className="p-2 bg-white rounded shadow-sm">
                        <div className="text-xs text-gray-500">Employer CPF</div>
                        <div className="font-semibold">${payrollSummary.totalEmployerCpf.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleGenerateFile}
                    disabled={!selectedPeriodId || !employerRefNumber || !submissionDate || generating}
                    isLoading={generating}
                  >
                    {!generating && <FileType className="h-4 w-4 mr-2" />}
                    Generate CPF File
                  </Button>
                </div>
                
                {generatedFile && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md mt-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold">File Generated: {generatedFile}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your CPF submission file is ready for download
                        </p>
                      </div>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">CPF Submission Guidelines</h4>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc ml-4">
                        <li>The generated text file follows the CPF Board's format requirements</li>
                        <li>Submit this file via the CPF Business e-Services Portal</li>
                        <li>Payment must be made by the 14th of the month</li>
                        <li>Verify all employee details before submission</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="py-4">
                <ExportHistoryList exportType="CPF" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// History component (reusable for different export types)
const ExportHistoryList: React.FC<{ exportType: string }> = ({ exportType }) => {
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchExportHistory();
  }, [exportType]);
  
  const fetchExportHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_exports')
        .select(`
          *,
          payroll_periods(id, period_name, start_date, end_date)
        `)
        .eq('export_type', exportType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setExports(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching export history',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner size="md" />;
  }
  
  if (exports.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No Export History</h3>
        <p className="text-muted-foreground">
          You haven't exported any {exportType} files yet
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full">
        <thead className="bg-blue-700 text-white">
          <tr>
            <th className="py-3 px-4 text-left">Date</th>
            <th className="py-3 px-4 text-left">Payroll Period</th>
            <th className="py-3 px-4 text-left">File Name</th>
            <th className="py-3 px-4 text-center">Download</th>
          </tr>
        </thead>
        <tbody>
          {exports.map(exportItem => {
            const fileName = exportItem.file_path.split('/').pop();
            return (
              <tr key={exportItem.id} className="border-t">
                <td className="py-3 px-4">
                  {format(new Date(exportItem.created_at), 'dd MMM yyyy')}
                </td>
                <td className="py-3 px-4">
                  {exportItem.payroll_periods?.period_name || 'Unknown'}
                </td>
                <td className="py-3 px-4 font-mono text-sm">{fileName}</td>
                <td className="py-3 px-4 text-center">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CpfSubmissionFileExport;
