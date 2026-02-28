import React, { useEffect, useState } from 'react';
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
import { Loader2, Plus, Trash2, Shield, Users, KeyRound, UserPlus, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';

/* ── Types ────────────────────────────────────────────────────────── */
interface RoleDef {
  id:          string;
  name:        string;
  permissions: string[];
}

interface UserRoleMapping {
  userId:   string;
  userName: string;
  email:    string;
  role:     string;
}

interface ManagedUser {
  id:         string;
  firstName:  string;
  lastName:   string;
  email:      string;
  phone:      string;
  department: string;
  role:       string;
  status:     'active' | 'inactive';
}

/* ── Static config ────────────────────────────────────────────────── */
const allPermissions = [
  'view_dashboard',   'manage_employees',  'manage_departments',
  'manage_leave',     'approve_leave',     'view_payroll',
  'manage_payroll',   'view_attendance',   'manage_attendance',
  'manage_settings',  'view_performance',  'manage_onboarding',
];

const defaultRoles: RoleDef[] = [
  { id: '1', name: 'admin',    permissions: [...allPermissions] },
  { id: '2', name: 'manager',  permissions: ['view_dashboard', 'manage_employees', 'approve_leave', 'view_payroll', 'view_attendance', 'view_performance'] },
  { id: '3', name: 'employee', permissions: ['view_dashboard', 'manage_leave', 'view_attendance', 'view_performance'] },
];

const defaultMappings: UserRoleMapping[] = [
  { userId: '1', userName: 'Admin User',    email: 'admin@hrms.com',    role: 'admin'    },
  { userId: '2', userName: 'Manager User',  email: 'manager@hrms.com',  role: 'manager'  },
  { userId: '3', userName: 'Employee User', email: 'employee@hrms.com', role: 'employee' },
];

const emptyUserForm = {
  firstName:  '',
  lastName:   '',
  email:      '',
  phone:      '',
  department: '',
  role:       'employee',
  status:     'active' as 'active' | 'inactive',
};

const formatPerm = (p: string) =>
  p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  /* ── Role / mapping state ─────────────────────────────────────── */
  const [roles,       setRoles]       = useState<RoleDef[]>(defaultRoles);
  const [mappings,    setMappings]    = useState<UserRoleMapping[]>(defaultMappings);
  const [roleDialog,  setRoleDialog]  = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms,setNewRolePerms]= useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);

  /* ── User management state ────────────────────────────────────── */
  // FIX ②④: initialUsers removed — users seeded from API, not from undefined `Emp`
  const [users,       setUsers]       = useState<ManagedUser[]>([]);
  const [userDialog,  setUserDialog]  = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userForm,    setUserForm]    = useState(emptyUserForm);

  /* ── API data state ───────────────────────────────────────────── */
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);   // FIX ⑤: used in JSX below

  /* ── FIX ①③: useEffect moved INSIDE the component ────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          employeeService.getAll().catch(() => ({ content: [] })),
          departmentService.getAll().catch(() => []),
        ]);

        const emps  = Array.isArray(empRes)  ? empRes  : (empRes?.content ?? []);
        const depts = Array.isArray(deptRes) ? deptRes : (deptRes         ?? []);

        setDepartments(depts);

        // FIX ④: seed users table from real API employees
        const seeded: ManagedUser[] = emps.slice(0, 20).map((e: any) => ({
          id:         e.id ?? e._id ?? String(Math.random()),
          firstName:  e.firstName  ?? '',
          lastName:   e.lastName   ?? '',
          email:      e.email      ?? '',
          phone:      e.phone      ?? e.phoneNumber ?? '',
          department: e.departmentName ?? e.department ?? '',
          role:       (e.role ?? 'employee').toLowerCase(),
          status:     e.status === 'INACTIVE' || e.status === 'inactive' ? 'inactive' : 'active',
        }));
        setUsers(seeded);

      } catch (err) {
        console.error('Settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // FIX ①: runs inside the component — valid hook call

  /* ── Guard: only admins can access ───────────────────────────── */
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  // FIX ⑤: show loader while API data is loading
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  /* ── Role handlers ────────────────────────────────────────────── */
  const handleAddRole = () => {
    if (!newRoleName.trim()) { toast.error('Role name required'); return; }
    if (roles.find(r => r.name.toLowerCase() === newRoleName.toLowerCase())) {
      toast.error('Role already exists'); return;
    }
    const role: RoleDef = {
      id: Date.now().toString(),
      name: newRoleName.toLowerCase(),
      permissions: newRolePerms,
    };
    setRoles(prev => [...prev, role]);
    toast.success(`Role "${newRoleName}" created`);
    setNewRoleName(''); setNewRolePerms([]); setRoleDialog(false);
  };

  const handleDeleteRole = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role && ['admin', 'manager', 'employee'].includes(role.name)) {
      toast.error('Cannot delete default roles'); return;
    }
    setRoles(prev => prev.filter(r => r.id !== id));
    toast.success('Role deleted');
  };

  const handlePermToggle = (roleId: string, perm: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const perms = r.permissions.includes(perm)
        ? r.permissions.filter(p => p !== perm)
        : [...r.permissions, perm];
      return { ...r, permissions: perms };
    }));
  };

  const handleMapRole = (userId: string, role: string) => {
    setMappings(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
    toast.success('User role updated');
  };

  // User handlers
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ firstName: '', lastName: '', email: '', phone: '', department: '', role: 'employee', status: 'active' });
    setUserDialog(true);
  };



  const openEditUser = (u: ManagedUser) => {
    setEditingUser(u);
    setUserForm({
      firstName:  u.firstName,
      lastName:   u.lastName,
      email:      u.email,
      phone:      u.phone,
      department: u.department,
      role:       u.role,
      status:     u.status,
    });
    setUserDialog(true);
  };

  const handleSaveUser = () => {
    if (!userForm.firstName.trim() || !userForm.lastName.trim() || !userForm.email.trim()) {
      toast.error('First name, last name, and email are required'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      toast.error('Invalid email format'); return;
    }
    if (!userForm.department) { toast.error('Department is required'); return; }

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u));
      toast.success('User updated successfully');
    } else {
      if (users.find(u => u.email.toLowerCase() === userForm.email.toLowerCase())) {
        toast.error('Email already exists'); return;
      }
      const newUser: ManagedUser = { id: Date.now().toString(), ...userForm };
      setUsers(prev => [...prev, newUser]);
      toast.success('User created successfully');
    }
    setUserDialog(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success('User removed');
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Manage users, roles, permissions, and assignments</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users"   className="gap-2"><UserPlus size={16} /> Users</TabsTrigger>
          <TabsTrigger value="roles"   className="gap-2"><Shield   size={16} /> Roles & Permissions</TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2"><Users    size={16} /> User-Role Mapping</TabsTrigger>
        </TabsList>

        {/* ── Users Tab ──────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddUser}><Plus size={16} className="mr-2" /> Add User</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell>{u.department}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                      <TableCell>
                        <Badge className={`border-0 text-xs ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditUser(u)}><Edit2 size={15} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}><Trash2 size={15} className="text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Roles & Permissions Tab ─────────────────────────────── */}
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
                      <Button variant="outline" size="sm" onClick={() => setEditingRole(role)}>Edit Permissions</Button>
                      {!['admin', 'manager', 'employee'].includes(role.name) && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">{formatPerm(p)}</Badge>
                    ))}
                    {role.permissions.length === 0 && (
                      <span className="text-sm text-muted-foreground">No permissions assigned</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── User-Role Mapping Tab ───────────────────────────────── */}
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
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{m.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select value={m.role} onValueChange={v => handleMapRole(m.userId, v)}>
                          <SelectTrigger className="w-40 ml-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r.id} value={r.name} className="capitalize">{r.name}</SelectItem>
                            ))}
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

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={userForm.firstName} onChange={e => setUserForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={userForm.lastName} onChange={e => setUserForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="john.doe@hrms.com" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Department *</Label>
                {/* FIX ⑥: departments now populated from API so dropdown has options */}
                <Select value={userForm.department} onValueChange={v => setUserForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id ?? d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={v => setUserForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.name} className="capitalize">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={userForm.status} onValueChange={v => setUserForm(f => ({ ...f, status: v as 'active' | 'inactive' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveUser}>{editingUser ? 'Update' : 'Create'} User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Role</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Role Name *</Label>
              <Input
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="e.g. supervisor"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={newRolePerms.includes(p)}
                      onCheckedChange={checked => {
                        setNewRolePerms(prev => checked ? [...prev, p] : prev.filter(x => x !== p));
                      }}
                    />
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

      {/* ── Edit Permissions Dialog ─────────────────────────────────── */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Permissions — <span className="capitalize">{editingRole?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map(p => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={editingRole?.permissions.includes(p) ?? false}
                    onCheckedChange={() => editingRole && handlePermToggle(editingRole.id, p)}
                  />
                  {formatPerm(p)}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setEditingRole(null); toast.success('Permissions updated'); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SettingsPage;