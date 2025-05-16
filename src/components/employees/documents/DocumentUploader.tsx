import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, Check, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DocumentSelector } from './DocumentSelector';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { STORAGE_BUCKET, ensureStorageBucket, getAuthorizedClient } from '@/integrations/supabase/client';
import { DialogFooter } from '@/components/ui/dialog';
import { DocumentCategoryKey } from './DocumentCategoryTypes';

interface DocumentUploaderProps {
  employeeId: string;
  onUploadComplete: () => void;
}

interface UploadingFileState {
  id: string;
  file: File;
  progress: number;
  status: 'waiting' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  category: DocumentCategoryKey | '';
  documentType: string;
  fileName: string;
  notes?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ employeeId, onUploadComplete }) => {
  const [files, setFiles] = useState<UploadingFileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFileState[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      progress: 0,
      status: 'waiting',
      category: '',
      documentType: '',
      fileName: file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name,
      notes: ''
    }));
    setFiles(prev => {
      const existing = new Set(prev.map(f => `${f.file.name}-${f.file.size}`));
      return [...prev, ...newFiles.filter(f => !existing.has(`${f.file.name}-${f.file.size}`))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const updateFileMetadata = (id: string, field: 'category' | 'documentType' | 'fileName' | 'notes', value: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (!user?.id) {
      toast({ title: 'Auth Error', description: 'Please log in.', variant: 'destructive' });
      return;
    }

    const toUpload = files.filter(f => f.status === 'waiting' || f.status === 'error');
    if (toUpload.length === 0) {
      toast({ title: 'No Files to Upload' });
      return;
    }

    const incomplete = toUpload.filter(f => !f.category || !f.documentType || !f.fileName.trim());
    if (incomplete.length > 0) {
      toast({ title: 'Missing Info', description: 'All fields are required.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const supabase = getAuthorizedClient();
    const bucketReady = await ensureStorageBucket(STORAGE_BUCKET);
    if (!bucketReady) {
      toast({ title: 'Bucket Error', variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    for (const f of toUpload) {
      setFiles(prev => prev.map(x => x.id === f.id ? { ...x, status: 'uploading', progress: 0 } : x));
      try {
        const ext = f.file.name.split('.').pop()?.toLowerCase() || 'bin';
        const safeName = f.file.name.substring(0, f.file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const fileName = `${Date.now()}_${safeName}.${ext}`;
        const filePath = `${employeeId}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, f.file, {
          cacheControl: '3600',
          upsert: false
        });
        if (uploadError) throw uploadError;

        const insert = {
          employee_id: employeeId,
          user_id: user.id,
          original_file_name: f.file.name,
          file_name: f.fileName.trim(),
          file_type: f.file.type,
          file_size: f.file.size,
          file_path: filePath,
          category: f.category,
          document_type: f.documentType,
          notes: f.notes?.trim(),
          uploaded_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase.from('employee_documents').insert(insert);
        if (dbError) throw dbError;

        setFiles(prev => prev.map(x => x.id === f.id ? { ...x, status: 'success', progress: 100 } : x));
      } catch (err: any) {
        setFiles(prev => prev.map(x => x.id === f.id ? { ...x, status: 'error', errorMessage: err.message || 'Upload failed' } : x));
      }
    }

    setIsUploading(false);
    onUploadComplete();
  };

  return (
    <div className="space-y-6 py-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700">Drag & drop files here, or click to select</h3>
          <p className="text-sm text-gray-500">Max 5MB. Supported: PDF, JPG, PNG, DOC(X), XLS(X)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="border rounded-md max-h-[calc(100vh-30rem)] sm:max-h-[calc(100vh-25rem)] overflow-y-auto">
          <div className="bg-gray-50 px-4 py-3 border-b sticky top-0 z-10">
            <h3 className="font-semibold text-gray-700">Files Queued ({files.length})</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {files.map(file => (
              <li key={file.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center min-w-0 mr-2">
                    <FileText className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate" title={file.file.name}>{file.file.name}</p>
                      <p className="text-xs text-gray-500">{(file.file.size / 1024).toFixed(1)} KB • {file.file.type}</p>
                    </div>
                  </div>
                  {file.status !== 'uploading' && file.status !== 'success' && (
                    <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="ml-2 text-gray-400 hover:text-red-500 h-7 w-7 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {file.status === 'uploading' && (
                  <div className="mt-1">
                    <Progress value={file.progress} className="h-1.5" />
                    <p className="text-xs text-blue-600 mt-1 text-right">{file.progress}%</p>
                  </div>
                )}
                {file.status === 'success' && (
                  <div className="mt-1 flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Uploaded</span>
                  </div>
                )}
                {file.status === 'error' && (
                  <div className="mt-1 flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{file.errorMessage}</span>
                  </div>
                )}
                {(file.status === 'waiting' || file.status === 'error') && !isUploading && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-2">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 block mb-1">Category*</Label>
                        <DocumentSelector type="category" value={file.category} onChange={(val) => updateFileMetadata(file.id, 'category', val)} />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 block mb-1">Document Type*</Label>
                        <DocumentSelector type="documentType" categoryValue={file.category} value={file.documentType} onChange={(val) => updateFileMetadata(file.id, 'documentType', val)} disabled={!file.category} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs font-medium text-gray-700 block mb-1">Document Name/Label*</Label>
                      <Input value={file.fileName} onChange={(e) => updateFileMetadata(file.id, 'fileName', e.target.value)} />
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs font-medium text-gray-700 block mb-1">Notes (Optional)</Label>
                      <Textarea value={file.notes || ''} onChange={(e) => updateFileMetadata(file.id, 'notes', e.target.value)} className="resize-none h-16" />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <DialogFooter className="mt-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onUploadComplete} disabled={isUploading}>Cancel</Button>
        <Button type="button" onClick={uploadFiles} disabled={isUploading || files.every(f => f.status !== 'waiting' && f.status !== 'error')} className="min-w-[180px]">
          {isUploading ? <><RotateCw className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Upload Documents</>}
        </Button>
      </DialogFooter>
    </div>
  );
};
