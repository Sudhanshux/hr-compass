import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Shield, Users, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

interface RoleDef {
  id: string;
  name: string;
  permissions: string[];
}

interface UserRoleMapping {
  userId: string;
  userName: string;
  email: string;
  role: string;
}

const allPermissions = [
  'view_dashboard', 'manage_employees', 'manage_departments',
  'manage_leave', 'approve_leave', 'view_payroll', 'manage_payroll',
  'view_attendance', 'manage_attendance', 'manage_settings',
];

const defaultRoles: RoleDef[] = [
  { id: '1', name: 'admin', permissions: [...allPermissions] },
  { id: '2', name: 'manager', permissions: ['view_dashboard', 'manage_employees', 'approve_leave', 'view_payroll', 'view_attendance'] },
  { id: '3', name: 'employee', permissions: ['view_dashboard', 'manage_leave', 'view_attendance'] },
];

const defaultMappings: UserRoleMapping[] = [
  { userId: '1', userName: 'Admin User', email: 'admin@hrms.com', role: 'admin' },
  { userId: '2', userName: 'Manager User', email: 'manager@hrms.com', role: 'manager' },
  { userId: '3', userName: 'Employee User', email: 'employee@hrms.com', role: 'employee' },
];

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleDef[]>(defaultRoles);
  const [mappings, setMappings] = useState<UserRoleMapping[]>(defaultMappings);
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleAddRole = () => {
    if (!newRoleName.trim()) { toast.error('Role name required'); return; }
    if (roles.find(r => r.name.toLowerCase() === newRoleName.toLowerCase())) { toast.error('Role already exists'); return; }
    const role: RoleDef = { id: Date.now().toString(), name: newRoleName.toLowerCase(), permissions: newRolePerms };
    setRoles(prev => [...prev, role]);
    toast.success(`Role "${newRoleName}" created`);
    setNewRoleName(''); setNewRolePerms([]); setRoleDialog(false);
  };

  const handleDeleteRole = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role && ['admin', 'manager', 'employee'].includes(role.name)) { toast.error('Cannot delete default roles'); return; }
    setRoles(prev => prev.filter(r => r.id !== id));
    toast.success('Role deleted');
  };

  const handlePermToggle = (roleId: string, perm: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const perms = r.permissions.includes(perm) ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm];
      return { ...r, permissions: perms };
    }));
  };

  const handleMapRole = (userId: string, role: string) => {
    setMappings(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
    toast.success('User role updated');
  };

  const openEditPerms = (role: RoleDef) => {
    setEditingRole(role);
  };

  const formatPerm = (p: string) => p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Manage roles, permissions, and user assignments</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2"><Shield size={16} /> Roles & Permissions</TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2"><Users size={16} /> User-Role Mapping</TabsTrigger>
        </TabsList>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRoleDialog(true)}><Plus size={16} className="mr-2" /> Add Role</Button>
          </div>

          <div className="grid gap-4">
            {roles.map(role => (
              <Card key={role.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <KeyRound size={18} className="text-primary" />
                      <div>
                        <CardTitle className="text-base capitalize">{role.name}</CardTitle>
                        <CardDescription>{role.permissions.length} permissions assigned</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditPerms(role)}>Edit Permissions</Button>
                      {!['admin', 'manager', 'employee'].includes(role.name) && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}><Trash2 size={16} className="text-destructive" /></Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">{formatPerm(p)}</Badge>
                    ))}
                    {role.permissions.length === 0 && <span className="text-sm text-muted-foreground">No permissions assigned</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* User-Role Mapping Tab */}
        <TabsContent value="mapping">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead className="text-right">Assign Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map(m => (
                    <TableRow key={m.userId}>
                      <TableCell className="font-medium">{m.userName}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{m.role}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Select value={m.role} onValueChange={v => handleMapRole(m.userId, v)}>
                          <SelectTrigger className="w-40 ml-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roles.map(r => <SelectItem key={r.id} value={r.name} className="capitalize">{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Role</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Role Name *</Label>
              <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. supervisor" />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={newRolePerms.includes(p)} onCheckedChange={checked => {
                      setNewRolePerms(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                    }} />
                    {formatPerm(p)}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Permissions — <span className="capitalize">{editingRole?.name}</span></DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map(p => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={editingRole?.permissions.includes(p) ?? false} onCheckedChange={() => editingRole && handlePermToggle(editingRole.id, p)} />
                  {formatPerm(p)}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setEditingRole(null); toast.success('Permissions updated'); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
