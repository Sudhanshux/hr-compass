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
import { departmentService } from '@/services/department.service';
import { settingsService } from '@/services/settings.service';

/* ── Types ────────────────────────────────────────────────────────── */
interface RoleDef {
  id:          string;
  name:        string;
  permissions: string[];
}

interface ManagedUser {
  id:         string;
  firstName:  string;
  lastName:   string;
  email:      string;
  phone:      string;
  department: string;
  active:     boolean;
  roleId:     string;
  roleName:   string;
  status:     'active' | 'inactive';
}

// Permissions must match backend enum values (UPPERCASE)
const allPermissions = [
  'VIEW_DASHBOARD',    'MANAGE_EMPLOYEES',   'MANAGE_DEPARTMENTS',
  'MANAGE_LEAVE',      'APPROVE_LEAVE',       'VIEW_PAYROLL',
  'MANAGE_PAYROLL',    'VIEW_ATTENDANCE',     'MANAGE_ATTENDANCE',
  'MANAGE_SETTINGS',   'VIEW_PERFORMANCE',    'MANAGE_ONBOARDING',
  'VIEW_ALL_PAYSLIPS', 'VIEW_OWN_PAYSLIP',
];

const emptyUserForm = {
  firstName:  '',
  lastName:   '',
  email:      '',
  phone:      '',
  department: '',
  roleId:     '',
  roleName:   '',
  status:     'active' as 'active' | 'inactive',
};

// Convert UPPER_SNAKE_CASE to Title Case for display
const formatPerm = (p: string) =>
  p.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/* ══════════════════════════════════════════════════════════════════ */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [roles,        setRoles]        = useState<RoleDef[]>([]);
  const [roleDialog,   setRoleDialog]   = useState(false);
  const [newRoleName,  setNewRoleName]  = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [editingRole,  setEditingRole]  = useState<RoleDef | null>(null);
  const [editPerms,    setEditPerms]    = useState<string[]>([]);
  const [savingPerms,  setSavingPerms]  = useState(false);

  const [users,        setUsers]        = useState<ManagedUser[]>([]);
  const [userDialog,   setUserDialog]   = useState(false);
  const [editingUser,  setEditingUser]  = useState<ManagedUser | null>(null);
  const [userForm,     setUserForm]     = useState(emptyUserForm);
  const [savingUser,   setSavingUser]   = useState(false);

  const [departments,  setDepartments]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  const mapUsers = (raw: any[]): ManagedUser[] =>
    raw.map(u => ({
      id:         u.id,
      firstName:  u.firstName  || '',
      lastName:   u.lastName   || '',
      email:      u.email,
      phone:      u.phone      || '',
      department: u.departmentName || '',
      active:     u.active,
      roleId:     u.roleId     || '',
      roleName:   u.roleName   || 'EMPLOYEE',
      status:     u.active ? 'active' : 'inactive',
    }));

  const loadAll = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, deptRes] = await Promise.all([
        settingsService.getUsers(),
        settingsService.getRoles(),
        departmentService.getAll(),
      ]);
      setUsers(mapUsers(usersRes));
      setRoles(rolesRes);
      setDepartments(deptRes);
    } catch (err) {
      console.error('Settings load failed:', err);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  /* ── Role handlers ──────────────────────────────────────────────── */
  const handleAddRole = async () => {
    if (!newRoleName.trim()) { toast.error('Role name required'); return; }
    try {
      const created = await settingsService.createRole({
        name:        newRoleName.toUpperCase(),
        description: '',
        permissions: newRolePerms,
      });
      setRoles(prev => [...prev, created]);
      toast.success('Role created');
      setNewRoleName('');
      setNewRolePerms([]);
      setRoleDialog(false);
    } catch {
      toast.error('Failed to create role');
    }
  };

  const handleDeleteRole = async (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role && ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role.name.toUpperCase())) {
      toast.error('Cannot delete default roles'); return;
    }
    try {
      await settingsService.deleteRole(id);
      setRoles(prev => prev.filter(r => r.id !== id));
      toast.success('Role deleted');
    } catch {
      toast.error('Failed to delete role');
    }
  };

  const openEditPermissions = (role: RoleDef) => {
    setEditingRole(role);
    setEditPerms([...role.permissions]);
  };

  const handlePermToggle = (perm: string) => {
    setEditPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setSavingPerms(true);
    try {
      // Permissions sent as uppercase to match backend enum
      await settingsService.updateRole(editingRole.id, { permissions: editPerms });
      setRoles(prev => prev.map(r =>
        r.id === editingRole.id ? { ...r, permissions: editPerms } : r
      ));
      setEditingRole(null);
      toast.success('Permissions updated');
    } catch {
      toast.error('Failed to update permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  /* ── User handlers ──────────────────────────────────────────────── */
  const openEditUser = (u: ManagedUser) => {
    setEditingUser(u);
    setUserForm({
      firstName:  u.firstName,
      lastName:   u.lastName,
      email:      u.email,
      phone:      u.phone,
      department: u.department,
      roleId:     u.roleId,
      roleName:   u.roleName,
      status:     u.status,
    });
    setUserDialog(true);
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      // Only status and role can be changed (no general profile-update endpoint)
      setSavingUser(true);
      try {
        const tasks: Promise<void>[] = [];

        if (userForm.status !== editingUser.status) {
          tasks.push(
            userForm.status === 'active'
              ? settingsService.activateUser(editingUser.id)
              : settingsService.deactivateUser(editingUser.id)
          );
        }

        if (userForm.roleId && userForm.roleId !== editingUser.roleId) {
          tasks.push(settingsService.assignRole(editingUser.id, userForm.roleId));
        }

        if (tasks.length === 0) {
          toast.info('No changes to save');
          setUserDialog(false);
          return;
        }

        await Promise.all(tasks);
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                status:   userForm.status,
                active:   userForm.status === 'active',
                roleId:   userForm.roleId   || u.roleId,
                roleName: userForm.roleName || u.roleName,
              }
            : u
        ));
        toast.success('User updated');
        setUserDialog(false);
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to update user');
      } finally {
        setSavingUser(false);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await settingsService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User removed');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // Assign role by role ID (not name) — backend requires roleId field
  const handleAssignRole = async (userId: string, roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    if (!role) { toast.error('Role not found'); return; }
    try {
      await settingsService.assignRole(userId, role.id);
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, roleId: role.id, roleName: role.name } : u
      ));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
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

        {/* ── Users Tab ─────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
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
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone || '—'}</TableCell>
                      <TableCell>{u.department || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.roleName}</Badge></TableCell>
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

        {/* ── Roles & Permissions Tab ────────────────────────────────── */}
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
                        <CardTitle className="text-base capitalize">{role.name.toLowerCase()}</CardTitle>
                        <CardDescription>{role.permissions.length} permissions assigned</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditPermissions(role)}>Edit Permissions</Button>
                      {!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role.name.toUpperCase()) && (
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

        {/* ── User-Role Mapping Tab ──────────────────────────────────── */}
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
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{u.roleName.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={u.roleName}
                          onValueChange={v => handleAssignRole(u.id, v)}
                        >
                          <SelectTrigger className="w-40 ml-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r.id} value={r.name} className="capitalize">
                                {r.name.toLowerCase()}
                              </SelectItem>
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

      {/* ── Edit User Dialog ──────────────────────────────────────────── */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Profile fields are read-only. You can update status and role.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {editingUser && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{editingUser.firstName} {editingUser.lastName}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{editingUser.email}</span>
                  {editingUser.phone && (
                    <>
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{editingUser.phone}</span>
                    </>
                  )}
                  {editingUser.department && (
                    <>
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{editingUser.department}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {editingUser && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select
                    value={userForm.roleName}
                    onValueChange={v => {
                      const role = roles.find(r => r.name === v);
                      setUserForm(f => ({ ...f, roleName: v, roleId: role?.id || '' }));
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.name} className="capitalize">{r.name.toLowerCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)} disabled={savingUser}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>
              {savingUser && <Loader2 size={14} className="mr-2 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Role Dialog ──────────────────────────────────────────── */}
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

      {/* ── Edit Permissions Dialog ──────────────────────────────────── */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions — <span className="capitalize">{editingRole?.name.toLowerCase()}</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map(p => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={editPerms.includes(p)}
                    onCheckedChange={() => handlePermToggle(p)}
                  />
                  {formatPerm(p)}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)} disabled={savingPerms}>Cancel</Button>
            <Button onClick={handleSavePermissions} disabled={savingPerms}>
              {savingPerms && <Loader2 size={14} className="mr-2 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
