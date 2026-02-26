import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

const announcements = [
  { id: '1', title: 'Office Closed on March 14', date: '2026-02-25', type: 'important' as const, body: 'The office will be closed for maintenance. Please work from home.' },
  { id: '2', title: 'New Health Insurance Plan', date: '2026-02-22', type: 'info' as const, body: 'Updated health plans are now available. Check HR portal for details.' },
  { id: '3', title: 'Q1 Town Hall Meeting', date: '2026-02-20', type: 'event' as const, body: 'Scheduled for March 5 at 3 PM in the main conference hall.' },
  { id: '4', title: 'Referral Bonus Increased', date: '2026-02-18', type: 'info' as const, body: 'Employee referral bonus has been increased to $3,000 per successful hire.' },
];

const typeBadge = (t: string) =>
  t === 'important' ? 'bg-destructive/10 text-destructive' :
  t === 'event' ? 'bg-primary/10 text-primary' :
  'bg-info/10 text-info';

const Announcements: React.FC = () => (
  <Card className="shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Megaphone size={18} className="text-primary" /> Announcements
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {announcements.map(a => (
        <div key={a.id} className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{a.title}</h4>
            <Badge className={`border-0 text-xs capitalize ${typeBadge(a.type)}`}>{a.type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{a.body}</p>
          <p className="text-xs text-muted-foreground/60">{a.date}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default Announcements;
