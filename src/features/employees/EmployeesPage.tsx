import React, { useState } from 'react';
import { Search, Plus, Download, Upload, LayoutGrid, List } from 'lucide-react';
import { useEmployees, useDeleteEmployee } from './hooks/useEmployees';
import AddEmployeeModal from './components/AddEmployeeModal';
import EmployeeDrawer from './components/EmployeeDrawer';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { format, parseISO } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  Active:     'bg-green-50 text-green-700',
  Inactive:   'bg-gray-100 text-gray-500',
  Terminated: 'bg-red-50 text-red-600',
  Probation:  'bg-yellow-50 text-yellow-700',
};

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const { data: employees, isLoading } = useEmployees(query || undefined);
  const deleteEmployee = useDeleteEmployee();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  const handleEdit = (emp: any) => {
    setSelectedId(null);
    setEditingEmployee(emp);
  };

  const handleDelete = (emp: any) => {
    if (confirm(`Remove ${emp.full_name}?`)) {
      deleteEmployee.mutate(emp.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </form>
        <div className="flex gap-2 items-center">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`p-2 transition-colors ${view === 'table' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Table view"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-2 transition-colors ${view === 'grid' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Card view"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Upload size={15} /> Import
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} /> Add employee
          </button>
        </div>
      </div>

      {/* Card grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading && Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-56 animate-pulse" />
          ))}
          {!isLoading && !employees?.length && (
            <div className="col-span-full py-16 text-center text-gray-400">
              {query ? 'No employees match your search.' : 'No employees yet.'}
            </div>
          )}
          {employees?.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp as any}
              onViewDetails={() => setSelectedId(emp.id)}
              onEdit={() => handleEdit(emp)}
              onDelete={() => handleDelete(emp)}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))}
                {!isLoading && !employees?.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                      {query ? 'No employees match your search.' : 'No employees yet. Add your first employee to get started.'}
                    </td>
                  </tr>
                )}
                {employees?.map(emp => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedId(emp.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                          {emp.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{emp.full_name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.department ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.job_title ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.date_of_hire ? format(parseISO(emp.date_of_hire), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[emp.employment_status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                        {emp.employment_status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {employees?.length ? (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </div>
          ) : null}
        </div>
      )}

      {adding && <AddEmployeeModal onClose={() => setAdding(false)} />}
      {editingEmployee && <AddEmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} />}
      {selectedId && (
        <EmployeeDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            const emp = employees?.find(e => e.id === selectedId);
            if (emp) handleEdit(emp);
          }}
        />
      )}
    </div>
  );
}
