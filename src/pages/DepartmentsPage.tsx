import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Department } from '@/types/models';
import { mockDepartments } from '@/data/mock-data';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', head: '', description: '' });

  const openAdd = () => { setEditing(null); setForm({ name: '', head: '', description: '' }); setDialogOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setForm({ name: d.name, head: d.head, description: d.description }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    if (editing) {
      setDepartments(prev => prev.map(d => d.id === editing.id ? { ...d, ...form } : d));
      toast.success('Department updated');
    } else {
      setDepartments(prev => [...prev, { ...form, id: Date.now().toString(), employeeCount: 0 }]);
      toast.success('Department added');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    toast.success('Department removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm">{departments.length} departments</p>
        </div>
        {isAdmin && <Button onClick={openAdd}><Plus size={16} className="mr-2" /> Add Department</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map(dept => (
          <Card key={dept.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-white">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <p className="text-xs text-muted-foreground">Head: {dept.head}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(dept)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(dept.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">{dept.description}</p>
              <div className="mt-3 text-sm font-medium">{dept.employeeCount} employees</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Department</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Head</Label><Input value={form.head} onChange={e => setForm(f => ({ ...f, head: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentsPage;
