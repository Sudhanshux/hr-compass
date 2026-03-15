import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, Building2, Calendar, Shield, User as UserIcon, Briefcase, CreditCard, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { orgChartService } from '@/services/orgchart.service';
import { Employee, OrgNode } from '@/types/models';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reportingChain, setReportingChain] = useState<OrgNode[]>([]);
  const [directReports, setDirectReports] = useState<OrgNode[]>([]);
  const [colleagues, setColleagues] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = employee
    ? `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()
    : user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [emp, chain, reports] = await Promise.all([
          authService.me(),
          orgChartService.getReportingChain(user.id).catch(() => []),
          orgChartService.getDirectReports(user.id).catch(() => []),
        ]);
        setEmployee(emp);
        setReportingChain(chain);
        setDirectReports(reports);

        // chain is ordered root-first; the second-to-last is the direct manager
        const manager = chain.length >= 2 ? chain[chain.length - 2] : null;
        if (manager) {
          const peers = await orgChartService.getDirectReports(manager.employeeId).catch(() => []);
          setColleagues(peers.filter(p => p.employeeId !== user.id));
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const formatDate = (val?: string) => {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return val; }
  };

  const manager = reportingChain.length >= 2 ? reportingChain[reportingChain.length - 2] : null;

  const PersonCard = ({ node, label }: { node: OrgNode; label?: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {`${node.firstName?.[0] ?? ''}${node.lastName?.[0] ?? ''}`.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        {label && <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>}
        <p className="text-sm font-medium truncate">{node.fullName}</p>
        <p className="text-xs text-muted-foreground truncate">{node.designation || node.role?.replace('ROLE_', '') || '—'}</p>
        {node.departmentName && <p className="text-xs text-muted-foreground truncate">{node.departmentName}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* Header Card */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-28 gradient-primary" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-xl font-semibold">
                {employee ? `${employee.firstName} ${employee.lastName}` : user?.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {employee?.role?.replace('ROLE_', '') ?? user?.role}
                </Badge>
                {employee?.designation && (
                  <span className="text-sm text-muted-foreground">{employee.designation}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal" className="gap-2"><UserIcon size={16} /> Personal</TabsTrigger>
          <TabsTrigger value="work" className="gap-2"><Briefcase size={16} /> Work</TabsTrigger>
          <TabsTrigger value="team" className="gap-2"><Users size={16} /> Team</TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    { icon: UserIcon,   label: 'Full Name',      value: employee ? `${employee.firstName} ${employee.lastName}` : user?.name },
                    { icon: Mail,       label: 'Email Address',  value: employee?.email ?? user?.email },
                    { icon: Phone,      label: 'Phone',          value: employee?.phone },
                    { icon: CreditCard, label: 'Employee ID',    value: user?.employeeId ?? user?.id },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Tab */}
        <TabsContent value="work">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Work Information</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    { icon: Shield,    label: 'Role',               value: employee?.role?.replace('ROLE_', '') ?? user?.role, capitalize: true },
                    { icon: Briefcase, label: 'Designation',        value: employee?.designation },
                    { icon: Building2, label: 'Department',         value: employee?.departmentName },
                    { icon: Calendar,  label: 'Date of Joining',    value: formatDate(employee?.dateOfJoining) },
                    { icon: UserIcon,  label: 'Reporting Manager',  value: employee?.reportingManagerName },
                    { icon: CreditCard,label: 'Status',             value: employee?.status },
                  ].map(({ icon: Icon, label, value, capitalize }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <div className="space-y-4">
            {/* Manager */}
            {manager && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield size={16} className="text-primary" /> Reporting Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonCard node={manager} />
                </CardContent>
              </Card>
            )}

            {/* Colleagues */}
            {colleagues.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users size={16} className="text-primary" /> Colleagues
                    <Badge variant="secondary" className="ml-auto">{colleagues.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {colleagues.map(c => (
                      <PersonCard key={c.employeeId} node={c} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Direct Reports */}
            {directReports.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users size={16} className="text-primary" /> Direct Reports
                    <Badge variant="secondary" className="ml-auto">{directReports.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {directReports.map(r => (
                      <PersonCard key={r.employeeId} node={r} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!loading && !manager && colleagues.length === 0 && directReports.length === 0 && (
              <Card className="shadow-sm">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No team structure found. Set a reporting manager on your employee profile to see your team here.
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="shadow-sm">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Loading team...
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
