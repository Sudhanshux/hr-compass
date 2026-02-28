import React, { useState,useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, FileText, Upload, CheckCircle2, Clock, AlertCircle, Eye, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { departmentService } from '@/services/department.service';

type OnboardingStatus = 'pending' | 'in-progress' | 'completed';

interface OnboardingRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  dateOfJoining: string;
  // Personal
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  // Bank
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  // Tax
  panNumber: string;
  aadhaarNumber: string;
  // Documents
  documents: { name: string; status: 'uploaded' | 'pending' }[];
  // Status
  status: OnboardingStatus;
  completionPercent: number;
}

const requiredDocs = ['ID Proof', 'Offer Letter', 'PAN Card', 'Aadhaar Card', 'Educational Certificates', 'Experience Letter', 'Passport Photo'];

const mockOnboardingRecords: OnboardingRecord[] = [
  {
    id: '1', firstName: 'Alex', lastName: 'Morgan', email: 'alex.m@hrms.com', phone: '+1 555-0201',
    department: 'Engineering', position: 'Frontend Developer', dateOfJoining: '2026-03-15',
    dateOfBirth: '1995-06-12', gender: 'Male', address: '456 Oak St, City', emergencyContact: '+1 555-0202',
    bankName: 'First National', accountNumber: '****5678', ifscCode: 'FNB001',
    panNumber: 'ABCDE1234F', aadhaarNumber: '****4321',
    documents: [
      { name: 'ID Proof', status: 'uploaded' }, { name: 'Offer Letter', status: 'uploaded' },
      { name: 'PAN Card', status: 'uploaded' }, { name: 'Aadhaar Card', status: 'pending' },
      { name: 'Educational Certificates', status: 'pending' }, { name: 'Experience Letter', status: 'pending' },
      { name: 'Passport Photo', status: 'uploaded' },
    ],
    status: 'in-progress', completionPercent: 65,
  },
  {
    id: '2', firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@hrms.com', phone: '+1 555-0203',
    department: 'HR', position: 'HR Associate', dateOfJoining: '2026-03-01',
    dateOfBirth: '1998-09-25', gender: 'Female', address: '789 Elm Ave', emergencyContact: '+1 555-0204',
    bankName: 'City Bank', accountNumber: '****9012', ifscCode: 'CTB002',
    panNumber: 'FGHIJ5678K', aadhaarNumber: '****8765',
    documents: requiredDocs.map(d => ({ name: d, status: 'uploaded' as const })),
    status: 'completed', completionPercent: 100,
  },
];

const statusIcon = (s: OnboardingStatus) =>
  s === 'completed' ? <CheckCircle2 size={16} className="text-success" /> :
  s === 'in-progress' ? <Clock size={16} className="text-warning" /> :
  <AlertCircle size={16} className="text-muted-foreground" />;

const statusBadge = (s: OnboardingStatus) =>
  s === 'completed' ? 'bg-success/10 text-success' :
  s === 'in-progress' ? 'bg-warning/10 text-warning' :
  'bg-muted text-muted-foreground';

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<OnboardingRecord[]>(mockOnboardingRecords);
  const [viewing, setViewing] = useState<OnboardingRecord | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);   // FIX ⑤: used in JSX below
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', position: '', dateOfJoining: '',
    dateOfBirth: '', gender: '', address: '', emergencyContact: '',
    bankName: '', accountNumber: '', ifscCode: '',
    panNumber: '', aadhaarNumber: '',
  });

  useEffect(() => {
      const load = async () => {
        try {
          const [deptRes] = await Promise.all([
            departmentService.getAll().catch(() => []),
          ]);
          const depts = Array.isArray(deptRes) ? deptRes : (deptRes         ?? []);
          setDepartments(depts);
        } catch (err) {
          console.error('Settings fetch error:', err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, []); 

  if (user?.role === 'employee') return <Navigate to="/dashboard" replace />;

  const handleStartOnboarding = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.department || !form.dateOfJoining) {
      toast.error('Please fill all required fields in the current step');
      return;
    }
    if (step < 3) { setStep(s => s + 1); return; }

    const record: OnboardingRecord = {
      id: Date.now().toString(),
      ...form,
      documents: requiredDocs.map(d => ({ name: d, status: 'pending' as const })),
      status: 'pending',
      completionPercent: 25,
    };
    setRecords(prev => [record, ...prev]);
    toast.success('Onboarding initiated');
    setAddDialog(false);
    setStep(0);
    setForm({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '', dateOfJoining: '', dateOfBirth: '', gender: '', address: '', emergencyContact: '', bankName: '', accountNumber: '', ifscCode: '', panNumber: '', aadhaarNumber: '' });
  };

  const handleDocUpload = (recordId: string, docName: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      const docs = r.documents.map(d => d.name === docName ? { ...d, status: 'uploaded' as const } : d);
      const uploaded = docs.filter(d => d.status === 'uploaded').length;
      const pct = Math.min(100, Math.round((uploaded / docs.length) * 40 + 60));
      const status: OnboardingStatus = pct >= 100 ? 'completed' : 'in-progress';
      return { ...r, documents: docs, completionPercent: pct, status };
    }));
    toast.success(`${docName} uploaded`);
    if (viewing) {
      setViewing(prev => {
        if (!prev || prev.id !== recordId) return prev;
        const docs = prev.documents.map(d => d.name === docName ? { ...d, status: 'uploaded' as const } : d);
        const uploaded = docs.filter(d => d.status === 'uploaded').length;
        const pct = Math.min(100, Math.round((uploaded / docs.length) * 40 + 60));
        const status: OnboardingStatus = pct >= 100 ? 'completed' : 'in-progress';
        return { ...prev, documents: docs, completionPercent: pct, status };
      });
    }
  };

  const stepLabels = ['Job Details', 'Personal Info', 'Bank Details', 'Tax Info'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Onboarding</h1>
          <p className="text-sm text-muted-foreground">{records.filter(r => r.status !== 'completed').length} onboardings in progress</p>
        </div>
        <Button onClick={() => setAddDialog(true)}><UserPlus size={16} className="mr-2" /> New Onboarding</Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Pending', count: records.filter(r => r.status === 'pending').length, color: 'text-muted-foreground' },
          { label: 'In Progress', count: records.filter(r => r.status === 'in-progress').length, color: 'text-warning' },
          { label: 'Completed', count: records.filter(r => r.status === 'completed').length, color: 'text-success' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records Table */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Onboarding Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.firstName} {r.lastName}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>{r.position}</TableCell>
                  <TableCell>{r.dateOfJoining}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={r.completionPercent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{r.completionPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border-0 text-xs gap-1 ${statusBadge(r.status)}`}>
                      {statusIcon(r.status)} {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(r)}><Eye size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboarding — {viewing?.firstName} {viewing?.lastName}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Email', viewing.email], ['Phone', viewing.phone],
                    ['Department', viewing.department], ['Position', viewing.position],
                    ['Joining Date', viewing.dateOfJoining], ['Date of Birth', viewing.dateOfBirth],
                    ['Gender', viewing.gender], ['Address', viewing.address],
                    ['Emergency Contact', viewing.emergencyContact],
                    ['Bank', viewing.bankName], ['Account', viewing.accountNumber],
                    ['IFSC', viewing.ifscCode], ['PAN', viewing.panNumber], ['Aadhaar', viewing.aadhaarNumber],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{val || '—'}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-3">
                {viewing.documents.map(doc => (
                  <div key={doc.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{doc.name}</span>
                    </div>
                    {doc.status === 'uploaded' ? (
                      <Badge className="border-0 text-xs bg-success/10 text-success gap-1"><CheckCircle2 size={12} /> Uploaded</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleDocUpload(viewing.id, doc.name)}>
                        <Upload size={12} /> Upload
                      </Button>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* New Onboarding Wizard */}
      <Dialog open={addDialog} onOpenChange={v => { setAddDialog(v); if (!v) setStep(0); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Employee Onboarding</DialogTitle>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= step ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 py-2">
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Department *</Label>
                    <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Position</Label><Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Joining Date *</Label><Input type="date" value={form.dateOfJoining} onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))} /></div>
              </>
            )}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} /></div>
                <div className="space-y-1"><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} /></div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-1"><Label>Bank Name</Label><Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Account Number</Label><Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} /></div>
                <div className="space-y-1"><Label>IFSC Code</Label><Input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value }))} /></div>
              </>
            )}
            {step === 3 && (
              <>
                <div className="space-y-1"><Label>PAN Number</Label><Input value={form.panNumber} onChange={e => setForm(f => ({ ...f, panNumber: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Aadhaar Number</Label><Input value={form.aadhaarNumber} onChange={e => setForm(f => ({ ...f, aadhaarNumber: e.target.value }))} /></div>
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setAddDialog(false); setStep(0); }}>Cancel</Button>
              <Button onClick={handleStartOnboarding}>{step < 3 ? 'Next' : 'Submit'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingPage;
