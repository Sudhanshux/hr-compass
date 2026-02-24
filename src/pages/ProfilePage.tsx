import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Building2, Calendar, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const details = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Shield, label: 'Role', value: user?.role, capitalize: true },
    { icon: Building2, label: 'Department', value: 'Engineering' },
    { icon: Phone, label: 'Phone', value: '+1 555-0101' },
    { icon: Calendar, label: 'Joined', value: 'March 15, 2021' },
    { icon: UserIcon, label: 'Employee ID', value: user?.id },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card className="shadow-sm overflow-hidden">
        {/* Header banner */}
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

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            {details.map(({ icon: Icon, label, value, capitalize }) => (
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
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
