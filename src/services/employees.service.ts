import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Employee = Tables<'employees'>;
export type EmployeeInsert = TablesInsert<'employees'>;
export type EmployeeUpdate = TablesUpdate<'employees'>;

export const employeesService = {
  async getAll(page = 0, limit = 50): Promise<{ data: Employee[]; count: number }> {
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('full_name')
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async getById(id: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(employee: Omit<EmployeeInsert, 'user_id'>): Promise<Employee> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('employees')
      .insert({ ...employee, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async search(query: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,department.ilike.%${query}%,job_title.ilike.%${query}%`)
      .order('full_name')
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },

  async getByDepartment(department: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('department', department)
      .order('full_name');
    if (error) throw error;
    return data ?? [];
  },
};
