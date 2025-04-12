import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle, Filter, Download, Trash, Edit, Eye, FileText,
  RotateCw, Upload, X, Search, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase, STORAGE_BUCKET, ensureStorageBucket, getAuthorizedClient } from '@/integrations/supabase/client';
import {
  getDisplayLabel, DOCUMENT_CATEGORIES, getCategoryFromValue
} from './DocumentCategoryTypes';
import { DocumentUploader } from './DocumentUploader';
import { useAuth } from '@/context/AuthContext';

interface Document {
  id: string;
  employee_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  upload_date: string;
  document_category?: string;
  document_type?: string;
  notes?: string;
}

interface DbDocument {
  id: string;
  employee_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_at: string;
  category: string;
  document_type: string;
  user_id: string;
  notes?: string;
}

interface DocumentManagerProps {
  employeeId: string;
  refreshTrigger?: number;
  isTabbed?: boolean;
  isReadOnly?: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  employeeId,
  refreshTrigger = 0,
  isTabbed = false,
  isReadOnly = false 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkBucket = async () => {
      setBucketError(null);
      const bucketReady = await ensureStorageBucket(STORAGE_BUCKET);
      if (!bucketReady) {
        setBucketError('Document storage is not properly configured. Please contact an administrator.');
      }
    };
    checkBucket();
  }, []);

  const fetchDocuments = async () => {
    if (!employeeId || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getAuthorizedClient();

      const { data: dbDocuments, error: fetchError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const docs: Document[] = await Promise.all(
        (dbDocuments || []).map(async (doc: DbDocument) => {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(doc.file_path);

          return {
            id: doc.id,
            employee_id: doc.employee_id,
            file_name: doc.file_name,
            file_type: doc.file_type,
            file_size: doc.file_size,
            file_url: urlData.publicUrl,
            upload_date: doc.uploaded_at,
            document_category: doc.category,
            document_type: doc.document_type,
            notes: doc.notes
          };
        })
      );

      setDocuments(docs);
      applyFilters(docs, searchTerm, selectedCategory);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch documents');
      toast({
        title: 'Error',
        description: 'Failed to load documents. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!bucketError) {
      fetchDocuments();
    }
  }, [employeeId, refreshTrigger, user, bucketError]);

  useEffect(() => {
    applyFilters(documents, searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, documents]);

  const applyFilters = (docs: Document[], search: string, category: string | null) => {
    let filtered = [...docs];
    
    if (category) {
      filtered = filtered.filter(doc => doc.document_category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(searchLower) ||
        (doc.document_type && doc.document_type.toLowerCase().includes(searchLower)) ||
        (doc.document_category && doc.document_category.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredDocuments(filtered);
  };

  const handleDelete = async (documentId: string) => {
    if (!user) return;

    try {
      const supabase = getAuthorizedClient();

      const { data, error } = await supabase
        .from('employee_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      const { error: storageErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([data.file_path]);

      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (dbErr) throw dbErr;

      toast({ title: 'Deleted', description: 'Document successfully deleted.' });
      fetchDocuments();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete document.',
        variant: 'destructive'
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchTerm || selectedCategory;

  const documentCategoryKeys = Object.keys(DOCUMENT_CATEGORIES);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(doc => {
      if (doc.document_category) {
        counts[doc.document_category] = (counts[doc.document_category] || 0) + 1;
      }
    });
    return counts;
  }, [documents]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        {!isReadOnly && (
          <Button onClick={() => setIsUploadDialogOpen(true)} disabled={!!bucketError} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters} 
            className="whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {documentCategoryKeys.map(key => {
          const category = DOCUMENT_CATEGORIES[key as keyof typeof DOCUMENT_CATEGORIES];
          return (
            <Badge 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer hover:bg-gray-100 ${
                selectedCategory === category ? 'bg-primary text-primary-foreground hover:bg-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              {category}
              {categoryCounts[category] ? ` (${categoryCounts[category]})` : ''}
            </Badge>
          );
        })}
      </div>

      {bucketError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border">{bucketError}</div>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <RotateCw className="h-6 w-6 animate-spin text-gray-500 mx-auto" />
          <p>Loading documents...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <p className="text-gray-500 text-center">
          {documents.length === 0 
            ? "No documents found. Upload documents to get started." 
            : "No documents match your search criteria."}
        </p>
      ) : (
        <div className="overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium truncate">{doc.file_name}</TableCell>
                  <TableCell>
                    {doc.document_category && (
                      <Badge variant="outline">{doc.document_category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>{formatBytes(doc.file_size)}</TableCell>
                  <TableCell>{formatDate(doc.upload_date)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!isReadOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id)}
                        title="Delete"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Supported: PDF, JPG, DOCX, XLS, etc. Document metadata will be saved per employee.
            </DialogDescription>
          </DialogHeader>
          <DocumentUploader
            employeeId={employeeId}
            onUploadComplete={() => {
              fetchDocuments();
              setIsUploadDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
