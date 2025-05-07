
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBankTemplates } from '@/hooks/use-payroll';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Trash2, Download, Plus, FileUp } from 'lucide-react';
import { format } from 'date-fns';

const BankTemplates: React.FC = () => {
  const { templates, loading, error, createBankTemplate, deleteBankTemplate } = useBankTemplates();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankName || !templateName || !selectedFile) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields and select a file',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${bankName.toLowerCase()}_${Date.now()}.${fileExt}`;
      const filePath = `bank-templates/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payroll-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Create template record in database
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      await createBankTemplate({
        bank_name: bankName,
        template_name: templateName,
        file_path: filePath,
        created_by: userId || ''
      });
      
      // Reset form
      setBankName('');
      setTemplateName('');
      setSelectedFile(null);
      setUploadDialogOpen(false);
      
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
  
  const handleDelete = async (templateId: string, filePath: string) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('payroll-files')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete template record
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
  
  const handleDownload = async (template: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('payroll-files')
        .download(template.file_path);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.template_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Error downloading template',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Function to get public URL for a file
  const getFileUrl = useCallback((path: string) => {
    return `${process.env.SUPABASE_URL || 'https://ezvdmuahwliqotnbocdd.supabase.co'}/storage/v1/object/public/${path}`;
  }, []);
  
  if (loading) {
    return <LoadingSpinner size="lg" />;
  }
  
  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bank Templates</CardTitle>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Bank Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="bank-name" className="text-sm font-medium">Bank Name</label>
                  <Select value={bankName} onValueChange={setBankName} required>
                    <SelectTrigger id="bank-name">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dbs">DBS</SelectItem>
                      <SelectItem value="ocbc">OCBC</SelectItem>
                      <SelectItem value="uob">UOB</SelectItem>
                      <SelectItem value="standard_chartered">Standard Chartered</SelectItem>
                      <SelectItem value="hsbc">HSBC</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="template-name" className="text-sm font-medium">Template Name</label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. DBS Ideal GIRO Format"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="template-file" className="text-sm font-medium">Template File</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="template-file"
                      type="file"
                      accept=".csv,.txt,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="flex-1"
                      required
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isUploading}
                    disabled={isUploading || !bankName || !templateName || !selectedFile}
                  >
                    {!isUploading && <FileUp className="h-4 w-4 mr-2" />}
                    Upload Template
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.template_name}</TableCell>
                    <TableCell>{template.bank_name.toUpperCase()}</TableCell>
                    <TableCell>{format(new Date(template.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(template)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(template.id, template.file_path)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No templates found</h3>
              <p className="text-muted-foreground">
                Upload a bank template to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankTemplates;
