
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { AlertTriangle, FileInput, FileSpreadsheet, FileUp, Trash, Upload } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { BankTemplate } from '@/types/payroll';
import { useBankTemplates } from '@/hooks/use-payroll';
import { supabase } from '@/integrations/supabase/client';

const BankTemplates: React.FC = () => {
  const { templates, loading, createBankTemplate, deleteBankTemplate } = useBankTemplates();
  const [isUploading, setIsUploading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [bankName, setBankName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const banks = [
    { id: 'dbs', name: 'DBS Bank' },
    { id: 'ocbc', name: 'OCBC Bank' },
    { id: 'uob', name: 'UOB Bank' },
    { id: 'standard_chartered', name: 'Standard Chartered Bank' },
    { id: 'hsbc', name: 'HSBC Bank' },
    { id: 'citibank', name: 'Citibank' },
    { id: 'maybank', name: 'Maybank' },
    { id: 'posb', name: 'POSB' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }

    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Read and preview the Excel file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Limit preview to first 5 rows
        setPreviewData(jsonData.slice(0, 5));
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse the Excel file. Please ensure it\'s a valid Excel file.',
          variant: 'destructive'
        });
        setPreviewData(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTemplateUpload = async () => {
    if (!templateName || !bankName || !selectedFile) {
      toast({
        title: 'Missing Information',
        description: 'Please provide template name, bank, and select a file.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsUploading(true);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `bank-templates/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payroll-files')
        .upload(filePath, selectedFile);
      
      if (uploadError) {
        throw uploadError;
      }

      // Create database entry
      await createBankTemplate({
        bank_name: bankName,
        template_name: templateName,
        file_path: filePath,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      // Reset form
      setTemplateName('');
      setBankName('');
      setSelectedFile(null);
      setPreviewData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setShowAddDialog(false);
      
      toast({
        title: 'Success',
        description: 'Bank template uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error uploading template',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteBankTemplate(templateId);
      toast({
        title: 'Success',
        description: 'Bank template deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting template',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bank Templates</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Upload Bank Template</DialogTitle>
                <DialogDescription>
                  Upload an Excel template file for bank payment processing
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input 
                      id="template-name"
                      placeholder="e.g., Monthly Payroll Template"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank</Label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger id="bank-name">
                        <SelectValue placeholder="Select a bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Template File (Excel)</Label>
                  <div className="border-2 border-dashed rounded-md border-gray-300 p-6 text-center">
                    <Input 
                      id="file-upload"
                      ref={fileInputRef}
                      type="file" 
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileSpreadsheet className="h-10 w-10 text-blue-700 mx-auto mb-2" />
                      <span className="text-sm font-medium block">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-xs text-muted-foreground block mt-1">
                        XLSX or XLS (max. 2MB)
                      </span>
                    </label>
                  </div>
                </div>
                
                {previewData && previewData.length > 0 && (
                  <div className="space-y-2">
                    <Label>File Preview (First 5 rows)</Label>
                    <div className="border rounded-md max-h-40 overflow-auto">
                      <table className="w-full">
                        <thead className="bg-blue-700 text-white text-xs sticky top-0">
                          <tr>
                            {Object.keys(previewData[0]).map((header, i) => (
                              <th key={i} className="p-2 text-left">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {previewData.map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).map((cell: any, j) => (
                                <td key={j} className="p-2">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleTemplateUpload} 
                  disabled={isUploading || !selectedFile || !templateName || !bankName}
                  isLoading={isUploading}
                >
                  Upload Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Template Name</th>
                    <th className="py-3 px-4 text-left">Bank</th>
                    <th className="py-3 px-4 text-right">Uploaded On</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-t">
                      <td className="py-3 px-4 font-medium">{template.template_name}</td>
                      <td className="py-3 px-4">
                        {banks.find(b => b.id === template.bank_name)?.name || template.bank_name}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {new Date(template.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${supabase.storageUrl}/object/public/payroll-files/${template.file_path}`} target="_blank" rel="noopener noreferrer">
                              <FileSpreadsheet className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash className="h-4 w-4 mr-1 text-red-500" />
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this template? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <FileInput className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No Templates Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload bank templates to generate payment files
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Template
              </Button>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Template Guidelines</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Bank templates should be Excel files containing the expected column structure for your bank's payment file format. Typically, these include employee name, bank account number, amount, and payment reference fields.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankTemplates;
