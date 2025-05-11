import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Upload, FileText, X as CloseIcon, AlertCircle, Check, RotateCw, Search, RefreshCw, Eye, Trash
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
import { DocumentUploader } from './DocumentUploader'; // Ensure this component is correctly implemented
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

// --- Interfaces ---
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
  file_path?: string; // Path in Supabase Storage (crucial for deletion)
}

interface DbDocument { // Represents the structure in your 'employee_documents' table
  id: string;
  employee_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_at: string;
  category?: string; // Maps to document_category
  document_type?: string;
  user_id: string; // ID of the user who uploaded
  notes?: string;
}

// Ensure DOCUMENT_CATEGORIES is correctly defined (e.g., imported from a types file)
const DOCUMENT_CATEGORIES: Record<string, string> = {
  ID: 'Identification',
  CONTRACT: 'Contract & Agreements',
  PERFORMANCE: 'Performance Review',
  CERTIFICATES: 'Licenses & Certificates',
  OTHER: 'Other Documents',
};
const documentCategoryKeys = Object.keys(DOCUMENT_CATEGORIES);
// --- End Interfaces ---

interface DocumentManagerProps {
  employeeId: string;
  refreshTrigger?: number;
  isTabbed?: boolean;
  isReadOnly?: boolean;
  bucketReady: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  employeeId,
  refreshTrigger = 0,
  isTabbed = false,
  isReadOnly = false,
  bucketReady
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!employeeId || !user || !bucketReady) {
      if (!bucketReady && employeeId && user) {
        console.warn("DocumentManager: Bucket not ready or missing user/employeeId, skipping document fetch.");
      }
      setDocuments([]);
      setFilteredDocuments([]);
      setIsLoading(false); // Ensure loading is false if we bail early
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

      if (fetchError) {
        console.error("DocumentManager: Supabase error fetching documents:", fetchError);
        throw fetchError;
      }
      if (!dbDocuments || dbDocuments.length === 0) {
        setDocuments([]);
        setFilteredDocuments([]);
        setIsLoading(false);
        return;
      }
      const docs: Document[] = await Promise.all(
        dbDocuments.map(async (doc: DbDocument) => {
          let publicUrl = '#'; // Default if URL retrieval fails
          if (doc.file_path) {
            try {
              const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(doc.file_path);
              if (urlData) {
                publicUrl = urlData.publicUrl;
              } else {
                console.warn(`DocumentManager: Could not get public URL for ${doc.file_path}`);
              }
            } catch (urlError) {
              console.error(`DocumentManager: Error getting public URL for ${doc.file_path}:`, urlError);
            }
          } else {
            console.warn(`DocumentManager: Document ID ${doc.id} has no file_path.`);
          }
          return {
            id: doc.id,
            employee_id: doc.employee_id,
            file_name: doc.file_name || 'Unnamed File',
            file_type: doc.file_type || 'application/octet-stream',
            file_size: doc.file_size || 0,
            file_url: publicUrl,
            upload_date: doc.uploaded_at,
            document_category: doc.category,
            document_type: doc.document_type,
            notes: doc.notes,
            file_path: doc.file_path,
          };
        })
      );
      setDocuments(docs);
    } catch (err: any) {
      console.error("Error in fetchDocuments:", err);
      setError(err.message || 'Failed to fetch documents');
      toast({ title: 'Error', description: 'Failed to load documents.', variant: 'destructive' });
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, user, bucketReady, toast]);

  useEffect(() => {
    if (bucketReady && employeeId && user) {
      fetchDocuments();
    } else if (!bucketReady) {
      setDocuments([]);
      setFilteredDocuments([]);
      setIsLoading(false); // Also set loading false if bucket isn't ready
    }
  }, [employeeId, user, bucketReady, refreshTrigger, fetchDocuments]);

  const applyFilters = useCallback((docsToFilter: Document[], currentSearchTerm: string, currentSelectedCategory: string | null) => {
    let filtered = [...docsToFilter];
    if (currentSelectedCategory) {
      filtered = filtered.filter(doc => doc.document_category === currentSelectedCategory);
    }
    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.file_name.toLowerCase().includes(searchLower) ||
        (doc.document_type && doc.document_type.toLowerCase().includes(searchLower)) ||
        (doc.document_category && doc.document_category.toLowerCase().includes(searchLower))
      );
    }
    setFilteredDocuments(filtered);
  }, []);

  useEffect(() => {
    applyFilters(documents, searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, documents, applyFilters]);

  const handleDelete = useCallback(async (documentId: string, filePath?: string) => {
    if (!user || !filePath) {
      toast({ title: 'Error', description: 'File path is missing for deletion.', variant: 'destructive' });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    try {
      const supabase = getAuthorizedClient();
      const { error: storageErr } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      // Don't throw if already deleted from storage, just log and proceed to delete DB record
      if (storageErr && storageErr.message !== 'The resource was not found') {
        console.error("Storage deletion error:", storageErr);
        throw storageErr;
      }

      const { error: dbErr } = await supabase.from('employee_documents').delete().eq('id', documentId);
      if (dbErr) {
        console.error("Database deletion error:", dbErr);
        throw dbErr;
      }
      toast({ title: 'Deleted', description: 'Document successfully deleted.' });
      fetchDocuments(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Deletion Error', description: err.message || 'Failed to delete document.', variant: 'destructive' });
    }
  }, [user, toast, fetchDocuments]);

  const formatBytes = useCallback((bytes: number, decimals = 2): string => {
    if (bytes === null || bytes === undefined || isNaN(bytes) || !isFinite(bytes)) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0 || i >= sizes.length) return bytes + ' Bytes'; // Fallback for extreme values
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return "Invalid Date"; }
  }, []);

  const clearFilters = useCallback(() => { setSearchTerm(''); setSelectedCategory(null); }, []);
  const hasActiveFilters = !!searchTerm || !!selectedCategory;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h2 className="text-lg font-semibold shrink-0">Documents</h2>
        {!isReadOnly && (
          <Button
            type="button" // Ensured this is type="button"
            onClick={() => {
              if (!bucketReady) {
                toast({ title: 'Storage Not Ready', description: 'Document storage is not available. Please try again or contact support.', variant: 'destructive' });
                return;
              }
              console.log("DocumentManager: 'Upload Documents' button clicked. Setting isUploadDialogOpen to true.");
              setIsUploadDialogOpen(true);
            }}
            disabled={!bucketReady || isLoading}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Documents
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-auto sm:flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Search by name, type, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full"/>
        </div>
        {hasActiveFilters && (<Button variant="outline" size="sm" onClick={clearFilters} className="whitespace-nowrap w-full sm:w-auto"><RefreshCw className="w-4 h-4 mr-1" /> Clear Filters</Button>)}
      </div>
      <div className="flex flex-wrap gap-2 pb-2 border-b">
        <Badge variant={!selectedCategory ? "default" : "outline"} className={`cursor-pointer hover:bg-gray-100 ${!selectedCategory ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`} onClick={() => setSelectedCategory(null)}>All Categories</Badge>
        {documentCategoryKeys.map(key => {
          const categoryValue = DOCUMENT_CATEGORIES[key as keyof typeof DOCUMENT_CATEGORIES];
          return (<Badge key={categoryValue} variant={selectedCategory === categoryValue ? "default" : "outline"} className={`cursor-pointer hover:bg-gray-100 ${selectedCategory === categoryValue ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`} onClick={() => setSelectedCategory(selectedCategory === categoryValue ? null : categoryValue)}>{categoryValue}</Badge>);
        })}
      </div>

      {!bucketReady && !isLoading && ( <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md border border-yellow-200">Document storage is not configured or available. Please check setup or contact support.</div>)}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-500">Loading documents...</p>
          </div>
        ) : error ? ( <div className="text-center text-red-500 py-10">{error}</div> )
         : !bucketReady ? null // Message handled above
         : documents.length === 0 ? ( <p className="text-gray-500 text-center py-10">No documents found for this employee. Upload documents to get started.</p> )
         : filteredDocuments.length === 0 && (searchTerm || selectedCategory) ? ( <p className="text-gray-500 text-center py-10">No documents match your current filter criteria.</p> )
         : ( <div className="border rounded-md"><Table className="w-full table-fixed">
               <TableHeader><TableRow>
                   <TableHead className="w-[30%] p-2">Document Name</TableHead>
                   <TableHead className="w-[15%] p-2">Category</TableHead>
                   <TableHead className="w-[20%] p-2">Type</TableHead>
                   <TableHead className="w-[10%] p-2">Size</TableHead>
                   <TableHead className="w-[15%] p-2">Uploaded</TableHead>
                   <TableHead className="text-right w-[10%] p-2">Actions</TableHead>
                 </TableRow></TableHeader>
               <TableBody>
                 {filteredDocuments.map(doc => {
                   const isViewDisabled = doc.file_url === '#' || !doc.file_url;
                   return (<TableRow key={doc.id}>
                       <TableCell className="font-medium truncate py-2 px-2" title={doc.file_name}>{doc.file_name}</TableCell>
                       <TableCell className="py-2 px-2">{doc.document_category && (<Badge variant="outline">{doc.document_category}</Badge>)}</TableCell>
                       <TableCell className="py-2 px-2 text-xs text-gray-600 truncate" title={doc.document_type}>{doc.document_type}</TableCell>
                       <TableCell className="py-2 px-2">{formatBytes(doc.file_size)}</TableCell>
                       <TableCell className="py-2 px-2">{formatDate(doc.upload_date)}</TableCell>
                       <TableCell className="text-right py-1 px-2 space-x-1">
                         <Button asChild size="icon" variant="ghost" title="View Document" disabled={isViewDisabled}>
                           <a // This 'a' tag is the single child
                             href={isViewDisabled ? undefined : doc.file_url} // Use undefined for href if disabled
                             target="_blank"
                             rel="noopener noreferrer"
                             aria-disabled={isViewDisabled}
                             className={isViewDisabled ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                             onClick={(e) => { if (isViewDisabled) e.preventDefault(); }} // Prevent navigation if disabled
                           >
                             <Eye className="w-4 h-4" />
                           </a>
                         </Button>
                         {!isReadOnly && (<Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(doc.id, doc.file_path)} title="Delete Document"><Trash className="w-4 h-4 text-red-500" /></Button>)}
                       </TableCell>
                     </TableRow>);
                 })}
                 {filteredDocuments.length === 0 && (documents.length > 0 || searchTerm || selectedCategory) && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-500 p-2">No documents match your current filter/search criteria.</TableCell></TableRow>
                 )}
               </TableBody>
             </Table></div> )}
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Upload New Documents</DialogTitle><DialogDescription>Supported files: PDF, JPG, PNG, DOC(X), XLS(X). Please provide category and type.</DialogDescription></DialogHeader>
          {employeeId && (
            <DocumentUploader
              employeeId={employeeId}
              onUploadComplete={() => {
                console.log("DocumentManager: DocumentUploader onUploadComplete triggered.");
                fetchDocuments(); // Refresh the list after upload
                setIsUploadDialogOpen(false); // Close the upload dialog
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};