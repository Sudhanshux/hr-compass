import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { FileText, Upload, CheckCircle2, Clock, AlertCircle, Eye, UserPlus, Loader2, X, File, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationContext';
import { departmentService } from '@/services/department.service';
import { onboardingService, OnboardingRecord } from '@/services/onboarding.service';
import { employeeService } from '@/services/employee.service';

type OnboardingStatus = 'pending' | 'in-progress' | 'completed';

const statusIcon = (s: OnboardingStatus) =>
  s === 'completed' ? <CheckCircle2 size={16} className="text-success" /> :
  s === 'in-progress' ? <Clock size={16} className="text-warning" /> :
  <AlertCircle size={16} className="text-muted-foreground" />;

const statusBadge = (s: OnboardingStatus) =>
  s === 'completed' ? 'bg-success/10 text-success' :
  s === 'in-progress' ? 'bg-warning/10 text-warning' :
  'bg-muted text-muted-foreground';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  departmentId: '', reportingManagerId: '', position: '', dateOfJoining: '',
  dateOfBirth: '', gender: '', address: '', emergencyContact: '',
  bankName: '', accountNumber: '', ifscCode: '',
  panNumber: '', aadhaarNumber: '',
};

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deptEmployees, setDeptEmployees] = useState<any[]>([]);
  const [viewing, setViewing] = useState<OnboardingRecord | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);

  // Upload dialog state
  const [uploadDialog, setUploadDialog] = useState<{ record: OnboardingRecord; docName: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user?.role === 'employee') return <Navigate to="/dashboard" replace />;

  const deptName = (id: string) =>
    departments.find(d => d.id === id)?.name ?? id;

  const empName = (id?: string) => {
    if (!id) return '—';
    const e = allEmployees.find((emp: any) => emp.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, depts, emps] = await Promise.all([
        onboardingService.getAll().catch(() => []),
        departmentService.getAll().catch(() => []),
        employeeService.getAll({ size: 200 }).catch(() => ({ content: [] })),
      ]);
      setRecords(Array.isArray(recs) ? recs : []);
      setDepartments(Array.isArray(depts) ? depts : (depts as any)?.content ?? []);
      setAllEmployees((emps as any).content ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDepartmentChange = (deptId: string) => {
    setForm(f => ({ ...f, departmentId: deptId, reportingManagerId: '' }));
    // Show all org employees as potential reporting managers (not filtered by dept,
    // as existing users may not have departmentId set)
    setDeptEmployees(allEmployees);
  };

  const handleNext = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.departmentId || !form.dateOfJoining) {
      toast.error('Please fill all required fields');
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const rec = await onboardingService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        departmentId: form.departmentId,
        reportingManagerId: form.reportingManagerId || undefined,
        position: form.position || undefined,
        dateOfJoining: form.dateOfJoining,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined,
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined,
        ifscCode: form.ifscCode || undefined,
        panNumber: form.panNumber || undefined,
        aadhaarNumber: form.aadhaarNumber || undefined,
      });
      setRecords(prev => [rec, ...prev]);
      const deptLabel = deptName(form.departmentId);
      toast.success(`${form.firstName} ${form.lastName} onboarding initiated`);
      addNotification({ title: 'Onboarding Started', message: `Onboarding initiated for ${form.firstName} ${form.lastName} in ${deptLabel}. Joining: ${form.dateOfJoining}.`, type: 'success' });
      setAddDialog(false);
      setStep(0);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create onboarding record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepAction = () => {
    if (step < 3) { handleNext(); return; }
    handleSubmit();
  };

  const openUploadDialog = (record: OnboardingRecord, docName: string) => {
    setSelectedFile(null);
    setUploadDialog({ record, docName });
  };

  const closeUploadDialog = () => {
    setUploadDialog(null);
    setSelectedFile(null);
    setDragOver(false);
  };

  const acceptFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
                     'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, JPG, PNG, or Word files are accepted');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be smaller than 5 MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = e.clipboardData.files[0];
    if (file) acceptFile(file);
  }, []);

  const handleConfirmUpload = async () => {
    if (!uploadDialog || !selectedFile) return;
    setUploading(true);
    try {
      const updated = await onboardingService.uploadDocument(
        uploadDialog.record.id, uploadDialog.docName, selectedFile
      );
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (viewing?.id === updated.id) setViewing(updated);
      toast.success(`${uploadDialog.docName} uploaded for ${uploadDialog.record.firstName} ${uploadDialog.record.lastName}`);
      addNotification({ title: 'Document Uploaded', message: `${uploadDialog.docName} uploaded for ${uploadDialog.record.firstName} ${uploadDialog.record.lastName}.`, type: 'info' });
      closeUploadDialog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (record: OnboardingRecord, docName: string) => {
    try {
      await onboardingService.openDocument(record.id, docName);
    } catch {
      toast.error('Could not open document');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stepLabels = ['Job Details', 'Personal Info', 'Bank Details', 'Tax Info'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            {records.filter(r => r.status !== 'completed').length} onboardings in progress
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <UserPlus size={16} className="mr-2" /> New Onboarding
        </Button>
      </div>

      {/* Summary cards */}
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

      {/* Records table */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Onboarding Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No onboarding records yet. Click "New Onboarding" to get started.
            </div>
          ) : (
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
                    <TableCell>{deptName(r.departmentId)}</TableCell>
                    <TableCell>{r.position || '—'}</TableCell>
                    <TableCell>{r.dateOfJoining}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={r.completionPercent} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{r.completionPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-xs gap-1 ${statusBadge(r.status as OnboardingStatus)}`}>
                        {statusIcon(r.status as OnboardingStatus)} {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(r)}>
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View detail dialog */}
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
                    ['Email', viewing.email],
                    ['Phone', viewing.phone],
                    ['Department', deptName(viewing.departmentId)],
                    ['Reporting Manager', empName(viewing.reportingManagerId)],
                    ['Position', viewing.position],
                    ['Joining Date', viewing.dateOfJoining],
                    ['Date of Birth', viewing.dateOfBirth],
                    ['Gender', viewing.gender],
                    ['Address', viewing.address],
                    ['Emergency Contact', viewing.emergencyContact],
                    ['Bank', viewing.bankName],
                    ['Account', viewing.accountNumber],
                    ['IFSC', viewing.ifscCode],
                    ['PAN', viewing.panNumber],
                    ['Aadhaar', viewing.aadhaarNumber],
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
                      <div className="flex items-center gap-2">
                        <Badge className="border-0 text-xs bg-success/10 text-success gap-1">
                          <CheckCircle2 size={12} /> Uploaded
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-primary"
                          onClick={() => handleViewDocument(viewing, doc.name)}
                          title="View document"
                        >
                          <ExternalLink size={12} /> View
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => openUploadDialog(viewing, doc.name)}
                      >
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

      {/* New Onboarding wizard */}
      <Dialog open={addDialog} onOpenChange={v => { setAddDialog(v); if (!v) { setStep(0); setForm(emptyForm); setDeptEmployees([]); } }}>
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
                  <div className="space-y-1">
                    <Label>First Name *</Label>
                    <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Last Name *</Label>
                    <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Department *</Label>
                    <Select value={form.departmentId} onValueChange={handleDepartmentChange}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Position</Label>
                    <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Reporting Manager</Label>
                  <Select
                    value={form.reportingManagerId}
                    onValueChange={v => setForm(f => ({ ...f, reportingManagerId: v }))}
                    disabled={!form.departmentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={form.departmentId ? 'Select manager' : 'Select department first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {deptEmployees.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                          {e.departmentName ? ` — ${e.departmentName}` : ''}
                          {e.role ? ` (${e.role.replace('ROLE_', '')})` : ''}
                        </SelectItem>
                      ))}
                      {deptEmployees.length === 0 && form.departmentId && (
                        <SelectItem value="_none" disabled>No employees available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Joining Date *</Label>
                  <Input type="date" value={form.dateOfJoining} onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                  </div>
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
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Emergency Contact</Label>
                  <Input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Account Number</Label>
                  <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value }))} />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-1">
                  <Label>PAN Number</Label>
                  <Input value={form.panNumber} onChange={e => setForm(f => ({ ...f, panNumber: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Aadhaar Number</Label>
                  <Input value={form.aadhaarNumber} onChange={e => setForm(f => ({ ...f, aadhaarNumber: e.target.value }))} />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setAddDialog(false); setStep(0); setForm(emptyForm); setDeptEmployees([]); }}>
                Cancel
              </Button>
              <Button onClick={handleStepAction} disabled={submitting}>
                {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
                {step < 3 ? 'Next' : 'Submit'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={!!uploadDialog} onOpenChange={v => { if (!v) closeUploadDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload size={18} />
              Upload — {uploadDialog?.docName}
            </DialogTitle>
          </DialogHeader>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/40
              ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); e.target.value = ''; }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <File size={36} className="text-primary" />
                <p className="text-sm font-semibold break-all max-w-[240px]">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1 text-xs mt-1"
                  onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                >
                  <X size={12} /> Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload size={32} className={`mb-3 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">
                  {dragOver ? 'Drop to upload' : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">or paste a file with Ctrl+V</p>
                <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG, DOC · max 5 MB</p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeUploadDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={!selectedFile || uploading}
              className="gap-2"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Confirm Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingPage;
