import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, Building2, Calendar, Shield, User as UserIcon, MapPin, Globe, FileText, Download, CreditCard, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

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
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <Badge variant="outline" className="capitalize mt-1">{user?.role}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal" className="gap-2"><UserIcon size={16} /> Personal</TabsTrigger>
          <TabsTrigger value="work" className="gap-2"><Briefcase size={16} /> Work</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FileText size={16} /> Documents</TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { icon: UserIcon, label: 'Full Name', value: user?.name },
                  { icon: Mail, label: 'Email Address', value: user?.email },
                  { icon: Phone, label: 'Phone', value: '+1 555-0101' },
                  { icon: Calendar, label: 'Date of Birth', value: 'January 15, 1990' },
                  { icon: MapPin, label: 'Address', value: '123 Main Street, San Francisco, CA 94102' },
                  { icon: Globe, label: 'Nationality', value: 'United States' },
                  { icon: UserIcon, label: 'Gender', value: 'Male' },
                  { icon: Phone, label: 'Emergency Contact', value: '+1 555-0199 (Jane Smith)' },
                  { icon: CreditCard, label: 'Blood Group', value: 'O+' },
                  { icon: Mail, label: 'Personal Email', value: 'john.personal@email.com' },
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Tab */}
        <TabsContent value="work">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Work Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { icon: CreditCard, label: 'Employee ID', value: user?.id },
                  { icon: Shield, label: 'Role', value: user?.role, capitalize: true },
                  { icon: Building2, label: 'Department', value: 'Engineering' },
                  { icon: Briefcase, label: 'Designation', value: 'Senior Developer' },
                  { icon: Calendar, label: 'Date of Joining', value: 'March 15, 2021' },
                  { icon: UserIcon, label: 'Reporting Manager', value: 'Michael Chen' },
                  { icon: MapPin, label: 'Work Location', value: 'San Francisco HQ' },
                  { icon: Briefcase, label: 'Employment Type', value: 'Full-time' },
                  { icon: GraduationCap, label: 'Experience', value: '5 Years' },
                  { icon: CreditCard, label: 'PAN', value: 'XXXXX1234X' },
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
            </CardContent>
          </Card>

          <Card className="shadow-sm mt-4">
            <CardHeader><CardTitle className="text-base">Bank Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { label: 'Bank Name', value: 'Chase Bank' },
                  { label: 'Account Number', value: '****4582' },
                  { label: 'Routing Number', value: '****7890' },
                  { label: 'Account Type', value: 'Checking' },
                ].map(d => (
                  <div key={d.label} className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <CreditCard size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                      <p className="text-sm font-medium">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">My Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Offer Letter', date: 'March 15, 2021', type: 'PDF' },
                  { name: 'Employment Contract', date: 'March 15, 2021', type: 'PDF' },
                  { name: 'ID Proof (Passport)', date: 'January 10, 2021', type: 'PDF' },
                  { name: 'Address Proof', date: 'January 10, 2021', type: 'PDF' },
                  { name: 'Educational Certificates', date: 'February 20, 2021', type: 'ZIP' },
                  { name: 'Tax Form W-4', date: 'March 20, 2021', type: 'PDF' },
                  { name: 'NDA Agreement', date: 'March 15, 2021', type: 'PDF' },
                  { name: 'Performance Review - 2025', date: 'December 15, 2025', type: 'PDF' },
                ].map(doc => (
                  <div key={doc.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">Uploaded: {doc.date} · {doc.type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Download size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
