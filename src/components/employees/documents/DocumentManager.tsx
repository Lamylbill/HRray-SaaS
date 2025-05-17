import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Upload, Eye, Trash, ArrowUpDown, Search, RefreshCw, Download
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
import { getAuthorizedClient, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { DocumentUploader } from './DocumentUploader';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import {
  DOCUMENT_CATEGORY_OPTIONS_ARRAY,
  DocumentCategoryKey,
  DOCUMENT_CATEGORIES_MAP,
  getTypeFromValue
} from './DocumentCategoryTypes';

interface Document {
  id: string;
  employee_id: string;
  file_name: string;
  original_file_name: string;
  file_type_mime: string;
  file_size: number;
  file_url: string;
  upload_date: string;
  document_category_key?: DocumentCategoryKey;
  document_type?: string;
  notes?: string;
  file_path?: string;
}

interface DbDocument {
  id: string;
  employee_id: string;
  file_name: string;
  original_file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_at: string;
  category?: DocumentCategoryKey;
  document_type: string;
  user_id: string;
  notes?: string;
}

interface DocumentManagerProps {
  employeeId: string;
  refreshTrigger?: number;
  isReadOnly?: boolean;
  bucketReady: boolean;
  isTabbed?: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ employeeId, refreshTrigger = 0, isReadOnly = false, bucketReady, isTabbed = false }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocCategoryFilter, setSelectedDocCategoryFilter] = useState<DocumentCategoryKey | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!employeeId || !user || !bucketReady) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getAuthorizedClient();
      const { data: dbDocuments, error: fetchError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });
      if (fetchError) throw fetchError;
      const docs: Document[] = await Promise.all(
        dbDocuments.map(async (doc: DbDocument) => {
          let publicUrl = '#';
          if (doc.file_path) {
            try {
              const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(doc.file_path);
              if (urlData) publicUrl = urlData.publicUrl;
            } catch (urlError) {
              console.error(`Error getting public URL for ${doc.file_path}:`, urlError);
            }
          }
          return {
            id: doc.id,
            employee_id: doc.employee_id,
            file_name: doc.file_name || doc.original_file_name || 'Unnamed Document',
            original_file_name: doc.original_file_name || 'N/A',
            file_type_mime: doc.file_type || 'application/octet-stream',
            file_size: doc.file_size || 0,
            file_url: publicUrl,
            upload_date: doc.uploaded_at,
            document_category_key: doc.category,
            document_type: doc.document_type,
            notes: doc.notes,
            file_path: doc.file_path
          };
        })
      );
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
      toast({ title: 'Error loading documents', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, user, bucketReady, toast]);

  useEffect(() => {
    if (bucketReady && employeeId && user) fetchDocuments();
    else if (!bucketReady) setDocuments([]);
  }, [employeeId, user, bucketReady, refreshTrigger, fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];
    if (selectedDocCategoryFilter) {
      filtered = filtered.filter(doc => doc.document_category_key === selectedDocCategoryFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.file_name.toLowerCase().includes(lower) ||
        doc.original_file_name.toLowerCase().includes(lower)
      );
    }
    return filtered;
  }, [documents, searchTerm, selectedDocCategoryFilter]);

  const handleDelete = async (id: string, path?: string) => {
    if (!user || !path) return;
    const confirmed = window.confirm('Delete this document?');
    if (!confirmed) return;
    const supabase = getAuthorizedClient();
    const { error: deleteStorageError } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    if (deleteStorageError) {
      toast({ title: 'Delete Error', description: deleteStorageError.message, variant: 'destructive' });
      return;
    }
    const { error: deleteDbError } = await supabase.from('employee_documents').delete().eq('id', id);
    if (deleteDbError) {
      toast({ title: 'Delete Error', description: deleteDbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Document deleted' });
      fetchDocuments();
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h2 className="text-lg font-semibold shrink-0">Documents</h2>
        {!isReadOnly && (
          <Button type="button" onClick={() => setIsUploadDialogOpen(true)} disabled={!bucketReady || isLoading} size="sm" className="w-full sm:w-auto">
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-auto sm:flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Search documents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
        </div>
        {(searchTerm || selectedDocCategoryFilter) && (
          <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setSelectedDocCategoryFilter(null); }} className="whitespace-nowrap w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-1" /> Clear Filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {DOCUMENT_CATEGORY_OPTIONS_ARRAY.map(cat => (
          <Badge
            key={cat.key}
            variant={selectedDocCategoryFilter === cat.key ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedDocCategoryFilter(cat.key === selectedDocCategoryFilter ? null : cat.key)}>
            {cat.label}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 h-full flex flex-col justify-center items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2">Loading...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-10">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <p className="text-center py-10">No documents match your search criteria.</p>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader className="hidden sm:table-header-group">
              <TableRow className="h-8">
                <TableHead>Document</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map(doc => {
                const isViewDisabled = doc.file_url === '#' || !doc.file_url;
                const categoryLabel = doc.document_category_key ? DOCUMENT_CATEGORIES_MAP[doc.document_category_key] : 'N/A';
                const typeLabel = doc.document_category_key && doc.document_type ? getTypeFromValue(doc.document_category_key, doc.document_type) : 'N/A';
                return (
                  <TableRow key={doc.id} className="grid grid-cols-2 sm:table-row text-xs sm:text-sm">
                    <TableCell className="col-span-1 sm:table-cell">{doc.file_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{categoryLabel}</TableCell>
                    <TableCell className="hidden sm:table-cell">{typeLabel}</TableCell>
                    <TableCell className="hidden sm:table-cell">{(doc.file_size / 1024).toFixed(1)} KB</TableCell>
                    <TableCell className="hidden sm:table-cell">{new Date(doc.upload_date).toLocaleDateString('en-SG')}</TableCell>
                    <TableCell className="col-span-1 flex justify-end items-center gap-2 sm:table-cell">
                      <Button size="icon" variant="ghost" title="View" disabled={isViewDisabled} onClick={() => window.open(doc.file_url, '_blank')}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Download" disabled={isViewDisabled} onClick={() => window.open(doc.file_url, '_blank')}>
                        <Download className="w-4 h-4" />
                      </Button>
                      {!isReadOnly && (
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(doc.id, doc.file_path)}>
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload New Documents</DialogTitle>
            <DialogDescription>Select files and provide details.</DialogDescription>
          </DialogHeader>
          {employeeId && (
            <DocumentUploader employeeId={employeeId} onUploadComplete={() => {
              fetchDocuments();
              setIsUploadDialogOpen(false);
            }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
