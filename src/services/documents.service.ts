import { supabase, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type EmployeeDocument = Tables<'employee_documents'>;

export const documentsService = {
  async getByEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async upload(
    employeeId: string,
    file: File,
    category: string,
    documentType: string,
    notes?: string
  ): Promise<EmployeeDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop() ?? 'bin';
    const filePath = `${user.id}/${employeeId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        user_id: user.id,
        file_name: file.name,
        original_file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category,
        document_type: documentType,
        notes: notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },

  async delete(id: string, filePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    if (storageError) throw storageError;

    const { error } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByCategory(employeeId: string, category: string): Promise<EmployeeDocument[]> {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('category', category)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
