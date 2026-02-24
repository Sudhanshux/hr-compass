import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { Employee } from '@/types/models';
import { useEffect } from 'react';
import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const defaultEmployee: Omit<Employee, 'id'> = {
  firstName: '', lastName: '', email: '', phone: '', departmentName: '', role: '', dateOfJoining: '', status: 'active',
};



const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [form, setForm] = useState(defaultEmployee);
  const [sortField, setSortField] = useState<keyof Employee>('firstName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const perPage = 5;

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const filtered = employees
    .filter(e => `${e.firstName} ${e.lastName} ${e.email} ${e.departmentName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openAdd = () => { setEditing(null); setForm(defaultEmployee); setDialogOpen(true); };
  const openEdit = (emp: Employee) => { setEditing(emp); setForm(emp); setDialogOpen(true); };
  const openView = (emp: Employee) => { setViewing(emp); setViewOpen(true); };



  const handleSave = async () => {
  if (!form.firstName || !form.lastName || !form.email) {
    toast.error('Please fill required fields');
    return;
  }

  try {
    if (editing) {
      const res = await employeeService.update(editing.id, form);
      setEmployees(prev =>
        prev.map(e => (e.id === editing.id ? res : e))
      );
      toast.success('Employee updated');
    } else {
      const res = await employeeService.create(form);
      setEmployees(prev => [...prev, res]);
      toast.success('Employee added');
    }

    setDialogOpen(false);
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong');
  }
};

 const handleDelete = async (id: string) => {
  try {
    await employeeService.delete(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    toast.success('Employee removed');
  } catch (error) {
    console.error(error);
    toast.error('Delete failed');
  }
};

useEffect(() => {
  const fetchData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll()
      ]);

      setEmployees(empRes.content);
      setDepartments(deptRes);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load employees');
    }
  };

  fetchData();
}, []);


  const toggleSort = (field: keyof Employee) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-success/10 text-success' : s === 'on-leave' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm">{employees.length} total employees</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}><Plus size={16} className="mr-2" /> Add Employee</Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search employees..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {['firstName', 'email', 'department', 'role', 'status'].map(f => (
                  <TableHead key={f} className="cursor-pointer select-none" onClick={() => toggleSort(f as keyof Employee)}>
                    {f === 'firstName' ? 'Name' : f.charAt(0).toUpperCase() + f.slice(1)}
                    {sortField === f && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.departmentName}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(emp.status)}`}>{emp.status}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openView(emp)}><Eye size={16} /></Button>
                    {isAdmin && <>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}><Trash2 size={16} className="text-destructive" /></Button>
                    </>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Department</Label>
                <Select value={form.departmentName} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Role</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Date of Joining</Label><Input type="date" value={form.dateOfJoining} onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Employee['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Employee Profile</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 py-2">
              {[
                ['Name', `${viewing.firstName} ${viewing.lastName}`],
                ['Email', viewing.email],
                ['Phone', viewing.phone],
                ['Department', viewing.departmentName],
                ['Role', viewing.role],
                ['Joined', viewing.dateOfJoining],
                ['Status', viewing.status],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
