import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Upload, FileText, X as CloseIcon, AlertCircle, Check, RotateCw, Search, RefreshCw, Eye, Trash,
  Edit, ArrowUpDown
} from 'lucide-react'; // Ensured all icons are imported
import { Button } from '@/components/ui-custom/Button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAuthorizedClient, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { DocumentUploader } from './DocumentUploader';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
const DOCUMENT_CATEGORY_OPTIONS = [
    { key: 'IDENTIFICATION', label: 'Identification' }, { key: 'EMPLOYMENT', label: 'Employment' },
    { key: 'FINANCIAL', label: 'Financial' }, { key: 'EDUCATION', label: 'Education' },
    { key: 'IMMIGRATION', label: 'Immigration' }, { key: 'MEDICAL', label: 'Medical' },
    { key: 'PERFORMANCE', label: 'Performance' }, { key: 'OTHER', label: 'Other' },
] as const;
type DocumentCategoryKey = typeof DOCUMENT_CATEGORY_OPTIONS[number]['key'];
const DOCUMENT_CATEGORIES_MAP = DOCUMENT_CATEGORY_OPTIONS.reduce((acc, curr) => {
    acc[curr.key] = curr.label; return acc;
}, {} as Record<DocumentCategoryKey, string>);
// --- End Interfaces & Categories ---

type SortableDocColumn = 'file_name' | 'document_category' | 'document_type' | 'file_size' | 'upload_date';

interface DocumentManagerProps {
  employeeId: string; refreshTrigger?: number; isTabbed?: boolean;
  isReadOnly?: boolean; bucketReady: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  employeeId, refreshTrigger = 0, isTabbed = false, isReadOnly = false, bucketReady
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocCategoryFilter, setSelectedDocCategoryFilter] = useState<DocumentCategoryKey | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDocDisplayName, setEditDocDisplayName] = useState('');
  const [editDocNotes, setEditDocNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [docSortConfig, setDocSortConfig] = useState<{ key: SortableDocColumn | null; direction: 'ascending' | 'descending' }>({ key: 'upload_date', direction: 'descending'});

  const fetchDocuments = useCallback(async () => {
    if (!employeeId || !user || !bucketReady) { setDocuments([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const supabase = getAuthorizedClient();
      const { data: dbDocuments, error: fetchError } = await supabase.from('employee_documents').select('*').eq('employee_id', employeeId).order('uploaded_at', { ascending: false });
      if (fetchError) throw fetchError;
      if (!dbDocuments || dbDocuments.length === 0) { setDocuments([]); setIsLoading(false); return; }
      const docs: Document[] = await Promise.all(
        dbDocuments.map(async (doc: DbDocument) => {
          let publicUrl = '#'; if (doc.file_path) { try { const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(doc.file_path); if (urlData) publicUrl = urlData.publicUrl; } catch (urlError) { console.error(`Error getting public URL for ${doc.file_path}:`, urlError); } }
          return { id: doc.id, employee_id: doc.employee_id, file_name: doc.file_name || 'Unnamed File', file_type: doc.file_type || 'application/octet-stream', file_size: doc.file_size || 0, file_url: publicUrl, upload_date: doc.uploaded_at, document_category: doc.category as DocumentCategoryKey | undefined, document_type: doc.document_type, notes: doc.notes, file_path: doc.file_path };
        })
      );
      setDocuments(docs);
    } catch (err: any) { setError(err.message || 'Failed to fetch documents'); toast({ title: 'Error', description: 'Failed to load documents.', variant: 'destructive' }); setDocuments([]);}
    finally { setIsLoading(false); }
  }, [employeeId, user, bucketReady, toast]);

  useEffect(() => {
    if (bucketReady && employeeId && user) fetchDocuments();
    else if (!bucketReady) { setDocuments([]); setIsLoading(false); }
  }, [employeeId, user, bucketReady, refreshTrigger, fetchDocuments]);

  const processedDocuments = useMemo(() => {
    let filtered = [...documents];
    if (selectedDocCategoryFilter) { filtered = filtered.filter(doc => doc.document_category === selectedDocCategoryFilter); }
    if (searchTerm) { const searchLower = searchTerm.toLowerCase(); filtered = filtered.filter(doc => doc.file_name.toLowerCase().includes(searchLower) || (doc.document_type && doc.document_type.toLowerCase().includes(searchLower)) || (doc.document_category && (DOCUMENT_CATEGORIES_MAP[doc.document_category as DocumentCategoryKey]?.toLowerCase().includes(searchLower) || doc.document_category.toLowerCase().includes(searchLower))));}
    if (docSortConfig.key !== null) {
      let sortedFiltered = [...filtered];
      sortedFiltered.sort((a, b) => {
        const key = docSortConfig.key!; let aValue: any = a[key]; let bValue: any = b[key];
        if (key === 'upload_date') { aValue = a.upload_date ? new Date(a.upload_date).getTime() : 0; bValue = b.upload_date ? new Date(b.upload_date).getTime() : 0; }
        else if (typeof aValue === 'string' && typeof bValue === 'string') { aValue = aValue.toLowerCase(); bValue = bValue.toLowerCase(); }
        else if (key === 'file_size') { aValue = a.file_size ?? -Infinity; bValue = b.file_size ?? -Infinity; }
        const valA = aValue ?? (typeof aValue === 'string' ? '' : (typeof aValue === 'number' ? -Infinity : 0));
        const valB = bValue ?? (typeof bValue === 'string' ? '' : (typeof bValue === 'number' ? -Infinity : 0));
        if (valA < valB) return docSortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return docSortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
      return sortedFiltered;
    }
    return filtered;
  }, [documents, searchTerm, selectedDocCategoryFilter, docSortConfig]);

  const requestDocSort = useCallback((key: SortableDocColumn) => { let direction: 'ascending' | 'descending' = 'ascending'; if (docSortConfig.key === key && docSortConfig.direction === 'ascending') direction = 'descending'; setDocSortConfig({ key, direction }); }, [docSortConfig]);
  const handleDelete = useCallback(async (documentId: string, filePath?: string) => { if (!user || !filePath) { toast({title: 'Error', description: 'File path is missing.', variant: 'destructive'}); return; } if (!window.confirm("Delete this document?")) return; try { const supabase = getAuthorizedClient(); const { error: storageErr } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]); if (storageErr && storageErr.message !== 'The resource was not found') throw storageErr; const { error: dbErr } = await supabase.from('employee_documents').delete().eq('id', documentId); if (dbErr) throw dbErr; toast({ title: 'Deleted', description: 'Document deleted.' }); fetchDocuments(); } catch (err: any) { toast({ title: 'Deletion Error', description: err.message || 'Failed to delete.', variant: 'destructive' }); }}, [user, toast, fetchDocuments]);
  const formatBytes = useCallback((bytes: number, decimals = 2): string => { if (bytes === null || bytes === undefined || isNaN(bytes) || !isFinite(bytes)) return 'N/A'; if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); if (i < 0 || i >= sizes.length) return bytes + ' Bytes'; return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; }, []);
  const formatDate = useCallback((dateStr: string | null | undefined): string => { if (!dateStr) return 'N/A'; try { return new Date(dateStr).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return "Invalid Date"; }}, []);
  const clearFilters = useCallback(() => { setSearchTerm(''); setSelectedDocCategoryFilter(null); }, []);
  const hasActiveFilters = !!searchTerm || !!selectedDocCategoryFilter;
  const handleOpenEditDialog = (doc: Document) => { setEditingDocument(doc); setEditDocDisplayName(doc.document_type || doc.file_name); setEditDocNotes(doc.notes || ''); setIsEditDialogOpen(true); };
  const handleSaveEditedDocument = async () => { if (!editingDocument || !user) return; if (!editDocDisplayName.trim()) { toast({ title: "Validation Error", description: "Document Name/Label cannot be empty.", variant: "destructive" }); return; } setIsSavingEdit(true); try { const supabase = getAuthorizedClient(); const updates: Partial<DbDocument> = { document_type: editDocDisplayName.trim(), notes: editDocNotes.trim() }; const { error: updateError } = await supabase.from('employee_documents').update(updates).eq('id', editingDocument.id); if (updateError) throw updateError; toast({ title: "Document Updated", description: "Details saved." }); setIsEditDialogOpen(false); setEditingDocument(null); fetchDocuments(); } catch (err: any) { console.error("Error updating document:", err); toast({ title: "Error", description: err.message || "Failed to update.", variant: "destructive" }); } finally { setIsSavingEdit(false); }};
  const renderDocSortableHeader = useCallback((label: string, columnKey: SortableDocColumn, className?: string) => ( <TableHead className={`${className} p-2`}><Button variant="ghost" onClick={() => requestDocSort(columnKey)} className="px-1 py-1 h-auto hover:bg-transparent font-semibold text-left" title={`Sort by ${label}`}>{label}<ArrowUpDown className={`ml-1 h-3 w-3 inline-block ${docSortConfig.key === columnKey ? 'opacity-100' : 'opacity-30 transition-opacity'}`} /></Button></TableHead>), [docSortConfig, requestDocSort]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h2 className="text-lg font-semibold shrink-0">Employee Documents</h2>
        {!isReadOnly && ( <Button type="button" onClick={() => { if (!bucketReady) { toast({ title: 'Storage Not Ready', description: 'Document storage unavailable.', variant: 'destructive'}); return; } setIsUploadDialogOpen(true); }} disabled={!bucketReady || isLoading} size="sm" className="w-full sm:w-auto"> <Upload className="w-4 h-4 mr-2" /> Upload Documents </Button> )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-auto sm:flex-grow"> <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /> <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full"/> </div>
        {hasActiveFilters && (<Button variant="outline" size="sm" onClick={clearFilters} className="whitespace-nowrap w-full sm:w-auto"><RefreshCw className="w-4 h-4 mr-1" /> Clear All Filters</Button>)}
      </div>
      <div className="flex flex-wrap gap-2 pb-2 border-b">
        <Badge variant={!selectedDocCategoryFilter ? "default" : "outline"} className={`cursor-pointer`} onClick={() => setSelectedDocCategoryFilter(null)}>All</Badge>
        {DOCUMENT_CATEGORY_OPTIONS.map(cat => (<Badge key={cat.key} variant={selectedDocCategoryFilter === cat.key ? "default" : "outline"} className={`cursor-pointer`} onClick={() => setSelectedDocCategoryFilter(selectedDocCategoryFilter === cat.key ? null : cat.key)}>{cat.label}</Badge>))}
      </div>

      {!bucketReady && !isLoading && ( <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md border">Storage unavailable.</div>)}

      <div className="flex-1 overflow-y-auto">{/* Start of Table Display Area */}
        {isLoading ? ( <div className="text-center py-10 h-full flex flex-col justify-center items-center"><LoadingSpinner size="lg" /><p className="mt-2">Loading...</p></div> )
         : error ? ( <div className="text-center text-red-500 py-10">{error}</div> )
         : !bucketReady ? null
         : documents.length === 0 ? ( <p className="text-center py-10">No documents.</p> )
         : processedDocuments.length === 0 && (searchTerm || selectedDocCategoryFilter) ? ( <p className="text-center py-10">No matching documents.</p> )
         : (
           <div className="border rounded-md">
             <Table className="w-full table-fixed">{/*Whitespace remove: Start Table direct*/}
               <TableHeader><TableRow>{/*Whitespace remove: Start TableHeader direct, TableRow direct*/}
                   {renderDocSortableHeader('Document Name', 'file_name', "w-[25%]")}
                   {renderDocSortableHeader('Category', 'document_category', "w-[15%]")}
                   {renderDocSortableHeader('Type/Details', 'document_type', "w-[20%]")}
                   {renderDocSortableHeader('Size', 'file_size', "w-[10%]")}
                   {renderDocSortableHeader('Uploaded', 'upload_date', "w-[15%]")}
                   <TableHead className="text-right w-[15%] p-2">Actions</TableHead>
                 </TableRow></TableHeader>
               <TableBody>{/*Whitespace remove: Start TableBody direct*/}
                 {processedDocuments.map((doc, index) => {
                   const isViewDisabled = doc.file_url === '#' || !doc.file_url;
                   // Return TableRow compactly
                   return (<TableRow key={doc.id || `doc-${index}`}>
                       <TableCell className="font-medium truncate py-2 px-2" title={doc.document_type || doc.file_name}>{doc.document_type || doc.file_name}</TableCell>
                       <TableCell className="py-2 px-2">{doc.document_category && (<Badge variant="outline">{DOCUMENT_CATEGORIES_MAP[doc.document_category as DocumentCategoryKey] || doc.document_category}</Badge>)}</TableCell>
                       <TableCell className="py-2 px-2 text-xs text-gray-600 truncate" title={doc.file_name}>{doc.file_name}</TableCell>
                       <TableCell className="py-2 px-2">{formatBytes(doc.file_size)}</TableCell>
                       <TableCell className="py-2 px-2">{formatDate(doc.upload_date)}</TableCell>
                       <TableCell className="text-right py-1 px-2 space-x-1">
                         <Button size="icon" variant="ghost" title="View Document" disabled={isViewDisabled} onClick={() => { if (!isViewDisabled && doc.file_url && doc.file_url !== '#') { window.open(doc.file_url, '_blank'); } }}> <Eye className="w-4 h-4" /> </Button>
                         {!isReadOnly && (<>
                          <Button type="button" size="icon" variant="ghost" onClick={() => handleOpenEditDialog(doc)} title="Edit Document Details"><Edit className="w-4 h-4" /></Button>
                          <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(doc.id, doc.file_path)} title="Delete Document"><Trash className="w-4 h-4 text-red-500" /></Button>
                         </>)}
                       </TableCell>
                     </TableRow>);
                 })}
                 {processedDocuments.length === 0 && (documents.length > 0 || searchTerm || selectedDocCategoryFilter) && ( <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-500 p-2">No documents match criteria.</TableCell></TableRow> )}
               </TableBody>{/*Whitespace remove: End TableBody direct*/}
             </Table>{/*Whitespace remove: End Table direct*/}
           </div>
         )}
      </div>{/* End of Table Display Area */}


      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Upload New Documents</DialogTitle><DialogDescription>Select files and provide details.</DialogDescription></DialogHeader>
          {employeeId && ( <DocumentUploader employeeId={employeeId} onUploadComplete={() => { fetchDocuments(); setIsUploadDialogOpen(false); }}/> )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      {editingDocument && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Edit Document Details</DialogTitle><DialogDescription>Original Filename: {editingDocument.file_name}</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div><Label htmlFor="editDocDisplayName" className="text-sm font-medium">Document Name/Label*</Label><Input id="editDocDisplayName" value={editDocDisplayName} onChange={(e) => setEditDocDisplayName(e.target.value)} placeholder="e.g., Passport, Payslip Q1" className="mt-1"/></div>
                    <div><Label htmlFor="editDocNotes" className="text-sm font-medium">Notes</Label><Textarea id="editDocNotes" value={editDocNotes} onChange={(e) => setEditDocNotes(e.target.value)} placeholder="Optional notes..." className="mt-1"/></div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSavingEdit}>Cancel</Button>
                    <Button type="button" onClick={handleSaveEditedDocument} disabled={isSavingEdit || !editDocDisplayName.trim()}>{isSavingEdit && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
};