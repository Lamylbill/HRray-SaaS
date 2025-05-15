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
import { supabase, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { DocumentUploader } from './DocumentUploader';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

// --- Interfaces ---
interface Document {
  id: string; employee_id: string; file_name: string; file_type: string;
  file_size: number; file_url: string; upload_date: string;
  document_category?: string; document_type?: string; notes?: string; file_path?: string;
}
interface DbDocument {
  id: string; employee_id: string; file_name: string; file_type: string;
  file_size: number; file_path: string; uploaded_at: string; category?: string;
  document_type?: string; user_id: string; notes?: string;
}
const DOCUMENT_CATEGORIES: Record<string, string> = {
  ID: 'Identification', CONTRACT: 'Contract & Agreements', PERFORMANCE: 'Performance Review',
  CERTIFICATES: 'Licenses & Certificates', OTHER: 'Other Documents',
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
  bucketReady = false
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
      if (!bucketReady && employeeId && user) console.warn("DocumentManager: Bucket not ready or missing user/employeeId, skipping document fetch.");
      setDocuments([]); setFilteredDocuments([]); setIsLoading(false); return;
    }
    setIsLoading(true); setError(null);
    try {
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
          let publicUrl = '#'; 
          if (doc.file_path) { 
            try { 
              const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(doc.file_path); 
              if (urlData) publicUrl = urlData.publicUrl; 
              else console.warn(`Could not get public URL for ${doc.file_path}`); 
            } catch (urlError) { 
              console.error(`Error getting public URL for ${doc.file_path}:`, urlError); 
            } 
          } else { 
            console.warn(`Document ID ${doc.id} has no file_path.`);
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
            file_path: doc.file_path 
          };
        })
      );
      
      setDocuments(docs);
    } catch (err: any) { 
      console.error("Error in fetchDocuments:", err); 
      setError(err.message || 'Failed to fetch documents'); 
      toast({ 
        title: 'Error', 
        description: 'Failed to load documents.', 
        variant: 'destructive' 
      }); 
      setDocuments([]); 
      setFilteredDocuments([]);
    } finally { 
      setIsLoading(false); 
    }
  }, [employeeId, user, bucketReady, toast]);

  useEffect(() => {
    if (bucketReady && employeeId && user) fetchDocuments();
    else if (!bucketReady) { setDocuments([]); setFilteredDocuments([]); setIsLoading(false); }
  }, [employeeId, user, bucketReady, refreshTrigger, fetchDocuments]);

  useEffect(() => {
    let newFilteredDocuments = [...documents];
    if (selectedCategory) {
      newFilteredDocuments = newFilteredDocuments.filter(doc => doc.document_category === selectedCategory);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      newFilteredDocuments = newFilteredDocuments.filter(doc =>
        doc.file_name.toLowerCase().includes(searchLower) ||
        (doc.document_type && doc.document_type.toLowerCase().includes(searchLower)) ||
        (doc.document_category && doc.document_category.toLowerCase().includes(searchLower))
      );
    }
    setFilteredDocuments(newFilteredDocuments);
  }, [documents, searchTerm, selectedCategory]);

  const handleDelete = useCallback(async (documentId: string, filePath?: string) => {
    if (!user || !filePath) { 
      toast({
        title: 'Error', 
        description: 'File path is missing for deletion.', 
        variant: 'destructive'
      }); 
      return; 
    }
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    
    try { 
      const { error: storageErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]); 
        
      if (storageErr && storageErr.message !== 'The resource was not found') throw storageErr; 
      
      const { error: dbErr } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId); 
        
      if (dbErr) throw dbErr; 
      
      toast({ 
        title: 'Deleted', 
        description: 'Document successfully deleted.' 
      }); 
      
      fetchDocuments(); 
    } catch (err: any) { 
      toast({ 
        title: 'Deletion Error', 
        description: err.message || 'Failed to delete document.', 
        variant: 'destructive' 
      }); 
    }
  }, [user, toast, fetchDocuments]);

  const formatBytes = useCallback((bytes: number, decimals = 2): string => { if (bytes === null || bytes === undefined || isNaN(bytes) || !isFinite(bytes)) return 'N/A'; if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); if (i < 0 || i >= sizes.length) return bytes + ' Bytes'; return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; }, []);
  const formatDate = useCallback((dateStr: string | null | undefined): string => { if (!dateStr) return 'N/A'; try { return new Date(dateStr).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return "Invalid Date"; }}, []);
  const clearFilters = useCallback(() => { setSearchTerm(''); setSelectedCategory(null); }, []);
  const hasActiveFilters = !!searchTerm || !!selectedCategory;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h2 className="text-lg font-semibold shrink-0">Documents</h2>
        {!isReadOnly && ( <Button type="button" onClick={() => { if (!bucketReady) { toast({ title: 'Storage Not Ready', description: 'Document storage unavailable.', variant: 'destructive'}); return; } setIsUploadDialogOpen(true); }} disabled={!bucketReady || isLoading} size="sm" className="w-full sm:w-auto"> <Upload className="w-4 h-4 mr-2" /> Upload Documents </Button> )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-auto sm:flex-grow"> <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /> <Input placeholder="Search by name, type, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full"/> </div>
        {hasActiveFilters && (<Button variant="outline" size="sm" onClick={clearFilters} className="whitespace-nowrap w-full sm:w-auto"><RefreshCw className="w-4 h-4 mr-1" /> Clear Filters</Button>)}
      </div>
      <div className="flex flex-wrap gap-2 pb-2 border-b">
        <Badge variant={!selectedCategory ? "default" : "outline"} className={`cursor-pointer hover:bg-gray-100 ${!selectedCategory ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`} onClick={() => setSelectedCategory(null)}>All Categories</Badge>
        {documentCategoryKeys.map(key => { const categoryValue = DOCUMENT_CATEGORIES[key as keyof typeof DOCUMENT_CATEGORIES]; return (<Badge key={categoryValue} variant={selectedCategory === categoryValue ? "default" : "outline"} className={`cursor-pointer hover:bg-gray-100 ${selectedCategory === categoryValue ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`} onClick={() => setSelectedCategory(selectedCategory === categoryValue ? null : categoryValue)}>{categoryValue}</Badge>);})}
      </div>

      {!bucketReady && !isLoading && ( <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md border border-yellow-200">Document storage is not configured or available. Please check setup or contact support.</div>)}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? ( <div className="text-center py-10 flex flex-col items-center justify-center h-full"><LoadingSpinner size="lg" /><p className="mt-2 text-gray-500">Loading documents...</p></div> )
         : error ? ( <div className="text-center text-red-500 py-10">{error}</div> )
         : !bucketReady ? null
         : documents.length === 0 ? ( <p className="text-gray-500 text-center py-10">No documents found. Upload to get started.</p> )
         : filteredDocuments.length === 0 && (searchTerm || selectedCategory) ? ( <p className="text-gray-500 text-center py-10">No documents match criteria.</p> )
         : ( <div className="border rounded-md"> <Table className="w-full table-fixed"> <TableHeader><TableRow><TableHead className="w-[30%] p-2">Document</TableHead><TableHead className="w-[15%] p-2">Category</TableHead><TableHead className="w-[20%] p-2">Type</TableHead><TableHead className="w-[10%] p-2">Size</TableHead><TableHead className="w-[15%] p-2">Uploaded</TableHead><TableHead className="text-right w-[10%] p-2">Actions</TableHead></TableRow></TableHeader> <TableBody>
             {filteredDocuments.map((doc, index) => { // Use index for fallback key if doc.id is an issue
             const isViewDisabled = doc.file_url === '#' || !doc.file_url;
             return (<TableRow key={doc.id || `doc-${index}`}> {/* Ensure unique keys */}
                 <TableCell className="font-medium truncate py-2 px-2" title={doc.file_name}>{doc.file_name}</TableCell>
                 <TableCell className="py-2 px-2">{doc.document_category && (<Badge variant="outline">{doc.document_category}</Badge>)}</TableCell>
                 <TableCell className="py-2 px-2 text-xs text-gray-600 truncate" title={doc.document_type}>{doc.document_type}</TableCell>
                 <TableCell className="py-2 px-2">{formatBytes(doc.file_size)}</TableCell>
                 <TableCell className="py-2 px-2">{formatDate(doc.upload_date)}</TableCell>
                 <TableCell className="text-right py-1 px-2 space-x-1">
                   {/* --- MODIFIED "VIEW" BUTTON: NO asChild --- */}
                   <Button
                     size="icon"
                     variant="ghost"
                     title="View Document"
                     disabled={isViewDisabled}
                     onClick={() => {
                       if (!isViewDisabled && doc.file_url && doc.file_url !== '#') {
                         window.open(doc.file_url, '_blank');
                       }
                     }}
                   >
                     <Eye className="w-4 h-4" />
                   </Button>
                   {!isReadOnly && (<Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(doc.id, doc.file_path)} title="Delete Document"><Trash className="w-4 h-4 text-red-500" /></Button>)}
                 </TableCell>
               </TableRow>);
             })}
             {filteredDocuments.length === 0 && (documents.length > 0 || searchTerm || selectedCategory) && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-500 p-2">No documents match your current filter/search criteria.</TableCell></TableRow>
             )}
             </TableBody></Table></div> )}
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Upload New Documents</DialogTitle><DialogDescription>Supported files... </DialogDescription></DialogHeader>
          {employeeId && ( <DocumentUploader employeeId={employeeId} onUploadComplete={() => { fetchDocuments(); setIsUploadDialogOpen(false); }}/> )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
