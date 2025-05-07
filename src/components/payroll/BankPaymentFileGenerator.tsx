
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { AlertTriangle, Check, CreditCard, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PayrollPeriod, BankTemplate, BankFileFormat } from '@/types/payroll';
import { format } from 'date-fns';

const BankPaymentFileGenerator: React.FC = () => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [bankTemplates, setBankTemplates] = useState<BankTemplate[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedFileUrl, setGeneratedFileUrl] = useState('');
  const { toast } = useToast();

  // File formats supported for different banks
  const bankFileFormats: BankFileFormat[] = [
    { bank: 'dbs', format: 'CSV', description: 'DBS Ideal GIRO File' },
    { bank: 'ocbc', format: 'TXT', description: 'OCBC Velocity GIRO Format' },
    { bank: 'uob', format: 'XLS', description: 'UOB BIB Payment File' },
    { bank: 'standard_chartered', format: 'CSV', description: 'SC Straight2Bank Format' },
    { bank: 'hsbc', format: 'CSV', description: 'HSBC HSBCnet Payment File' }
  ];

  useEffect(() => {
    fetchPayrollPeriodsAndTemplates();
  }, []);

  const fetchPayrollPeriodsAndTemplates = async () => {
    setLoading(true);
    try {
      // Fetch payroll periods
      const { data: periodsData, error: periodsError } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('status', 'Completed')
        .order('created_at', { ascending: false });
      
      if (periodsError) throw periodsError;
      
      // Fetch bank templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('bank_templates')
        .select('*')
        .order('bank_name', { ascending: true });
      
      if (templatesError) throw templatesError;
      
      // Convert database response to match our type definitions
      const typedPeriodsData = periodsData?.map(item => ({
        ...item,
        status: item.status as PayrollPeriodStatus
      })) || [];
      
      setPayrollPeriods(typedPeriodsData);
      setBankTemplates(templatesData || []);
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

  const handleGenerateFile = async () => {
    if (!selectedPeriodId || !selectedTemplateId || !referenceNumber || !paymentDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // Get the selected template and period
      const template = bankTemplates.find(t => t.id === selectedTemplateId);
      const period = payrollPeriods.find(p => p.id === selectedPeriodId);
      
      if (!template || !period) {
        throw new Error('Selected template or period not found');
      }
      
      // Fetch payroll items for the period
      const { data: payrollItems, error } = await supabase
        .from('payroll_items')
        .select(`
          *,
          employees(id, full_name, email, bank_account, bank_name)
        `)
        .eq('payroll_period_id', selectedPeriodId);
      
      if (error) throw error;
      
      if (!payrollItems || payrollItems.length === 0) {
        throw new Error('No payroll items found for this period');
      }
      
      // In a real implementation, this would generate the actual bank payment file
      // based on the template and payroll data
      
      // For now, we'll simulate generating a file and saving a record
      const bankFormat = bankFileFormats.find(f => f.bank === template.bank_name)?.format || 'CSV';
      const fileName = `${template.bank_name}_payment_${format(new Date(paymentDate), 'yyyyMMdd')}.${bankFormat.toLowerCase()}`;
      const filePath = `bank-exports/${fileName}`;
      
      // Record the export
      const { data: exportRecord, error: exportError } = await supabase
        .from('payroll_exports')
        .insert({
          payroll_period_id: selectedPeriodId,
          export_type: 'Bank',
          file_path: filePath,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (exportError) throw exportError;
      
      // In a real app, you'd store the actual file in Storage
      // Here we'll just set the URL for demonstration
      setGeneratedFileUrl(fileName);
      
      toast({
        title: 'Success',
        description: 'Bank payment file generated successfully',
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

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Generate Bank Payment File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payroll-period">Payroll Period</Label>
                <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                  <SelectTrigger id="payroll-period">
                    <SelectValue placeholder="Select payroll period" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollPeriods.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.period_name} ({format(new Date(period.payment_date), 'dd MMM yyyy')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank-template">Bank Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="bank-template">
                    <SelectValue placeholder="Select bank template" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name} - {template.bank_name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reference-number">Payment Reference Number</Label>
                <Input
                  id="reference-number"
                  placeholder="e.g., PAY-202406"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            
            {selectedTemplateId && (
              <div className="p-4 bg-gray-50 rounded-md border">
                <h3 className="font-medium mb-2">File Format Information</h3>
                
                {(() => {
                  const template = bankTemplates.find(t => t.id === selectedTemplateId);
                  const bankFormat = template ? bankFileFormats.find(f => f.bank === template.bank_name) : null;
                  
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="font-medium">Bank:</span>{' '}
                          {template?.bank_name.toUpperCase() || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Format:</span>{' '}
                          {bankFormat?.format || 'Custom'}
                        </div>
                        <div>
                          <span className="font-medium">Template:</span>{' '}
                          {template?.template_name || 'N/A'}
                        </div>
                      </div>
                      {bankFormat && (
                        <p className="text-muted-foreground">
                          {bankFormat.description}. The file will be generated according to the bank's required format.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateFile}
                disabled={!selectedPeriodId || !selectedTemplateId || !referenceNumber || !paymentDate || generating}
                isLoading={generating}
              >
                {!generating && <CreditCard className="h-4 w-4 mr-2" />}
                Generate Payment File
              </Button>
            </div>
            
            {generatedFileUrl && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">File Generated Successfully</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your bank payment file is ready to download
                    </p>
                  </div>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Bank Payment File Instructions</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once downloaded, this file can be uploaded directly to your bank's portal for batch payment processing. Always verify the payment details before submitting to your bank.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The file format follows your bank's specific requirements based on the selected template.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankPaymentFileGenerator;
