
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { AlertTriangle, CheckCircle, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Year {
  value: string;
  label: string;
}

const IrasSubmissionFileExport: React.FC = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [employerRefNumber, setEmployerRefNumber] = useState('');
  const [isAR8Present, setIsAR8Present] = useState(true);
  const [isAppendixPresent, setIsAppendixPresent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const { toast } = useToast();

  // Generate past 5 years for selection
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    
    // Add previous years (for tax filing)
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      yearOptions.push({
        value: year.toString(),
        label: `Year ${year}`,
      });
    }
    
    setYears(yearOptions);
    // Default to previous year as that's typically what's being filed
    setSelectedYear((currentYear - 1).toString());
  }, []);

  const handleGenerateFiles = async () => {
    if (!selectedYear || !employerRefNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      const generatedFileNames = [];
      
      // In a real implementation, this would generate the actual IRAS submission files
      // For now, we'll simulate the process
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Always generate IR8A file
      const ir8aFileName = `IR8A_${selectedYear}_${employerRefNumber}.txt`;
      generatedFileNames.push(ir8aFileName);
      
      // Generate Appendix 8A/8B if selected
      if (isAppendixPresent) {
        const appendixFileName = `Appendix8A_${selectedYear}_${employerRefNumber}.txt`;
        generatedFileNames.push(appendixFileName);
      }
      
      // Generate IR8S if selected
      if (isAR8Present) {
        const ir8sFileName = `IR8S_${selectedYear}_${employerRefNumber}.txt`;
        generatedFileNames.push(ir8sFileName);
      }
      
      // Record the exports
      for (const fileName of generatedFileNames) {
        const filePath = `iras-exports/${fileName}`;
        
        await supabase
          .from('payroll_exports')
          .insert({
            payroll_period_id: null, // IRAS files are annual, not tied to a specific payroll period
            export_type: 'IRAS',
            file_path: filePath,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
      }
      
      setGeneratedFiles(generatedFileNames);
      
      toast({
        title: 'Success',
        description: `Generated ${generatedFileNames.length} IRAS files successfully`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error generating IRAS files',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>IRAS Submission File Export</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="generate">Generate Files</TabsTrigger>
              <TabsTrigger value="history">Export History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate">
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year of Assessment</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employer-ref">Employer Reference Number</Label>
                    <Input
                      id="employer-ref"
                      placeholder="e.g., 12345678-9"
                      value={employerRefNumber}
                      onChange={(e) => setEmployerRefNumber(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">File Types to Generate</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="ir8a" checked disabled />
                      <label htmlFor="ir8a" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        IR8A (Employment Income) - Required
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="ir8s" 
                        checked={isAR8Present} 
                        onCheckedChange={(checked) => setIsAR8Present(!!checked)} 
                      />
                      <label htmlFor="ir8s" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        IR8S (Cessation of Employment)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="appendix" 
                        checked={isAppendixPresent} 
                        onCheckedChange={(checked) => setIsAppendixPresent(!!checked)} 
                      />
                      <label htmlFor="appendix" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Appendix 8A/8B (Benefits-in-kind)
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleGenerateFiles}
                    disabled={!selectedYear || !employerRefNumber || generating}
                    isLoading={generating}
                  >
                    {!generating && <FileText className="h-4 w-4 mr-2" />}
                    Generate IRAS Files
                  </Button>
                </div>
                
                {generatedFiles.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md mt-4">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold">Files Generated Successfully</h4>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-2">
                          {generatedFiles.map((file, index) => (
                            <li key={index} className="flex justify-between items-center">
                              <span className="font-mono">{file}</span>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">IRAS Filing Guidelines</h4>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc ml-4">
                        <li>IR8A forms must be submitted for all employees who were employed during the previous year</li>
                        <li>IR8S forms are required for employees who ceased employment during the year</li>
                        <li>Appendix 8A/8B is required if you provided benefits-in-kind to employees</li>
                        <li>File submission deadline is March 1st every year</li>
                        <li>Submit these files via the IRAS Auto-Inclusion Scheme (AIS)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="py-4">
                <ExportHistoryList exportType="IRAS" />
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
        .select('*')
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
            <th className="py-3 px-4 text-left">File Name</th>
            <th className="py-3 px-4 text-center">Actions</th>
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

export default IrasSubmissionFileExport;
