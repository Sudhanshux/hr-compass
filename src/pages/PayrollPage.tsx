import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Eye, Printer, Lock, Plus, Pencil } from 'lucide-react';
import { PayslipData } from '@/types/models';
import { payrollService } from '@/services/payroll.service';
import type { PayrollPayload } from '@/services/payroll.service';
import { settingsService } from '@/services/settings.service';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { User } from '@/types/models';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format as Indian Rupees (e.g. ₹1,23,456) */
const inr = (amount: number | undefined) => {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Convert YYYY-MM to human-readable "March 2026" */
const fmtMonth = (m: string) => {
  if (!m) return m;
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

type FormState = {
  employeeId: string;
  month: string;
  paidDays: number | '';
  lopDays: number | '';
  basicSalary: number | '';
  hra: number | '';
  da: number | '';
  transportAllowance: number | '';
  medicalAllowance: number | '';
  specialAllowance: number | '';
  providentFund: number | '';
  esi: number | '';
  professionalTax: number | '';
  incomeTax: number | '';
};

const EMPTY_FORM: FormState = {
  employeeId: '',
  month: '',
  paidDays: 26,
  lopDays: '',
  basicSalary: '',
  hra: '',
  da: '',
  transportAllowance: '',
  medicalAllowance: '',
  specialAllowance: '',
  providentFund: '',
  esi: '',
  professionalTax: 200,
  incomeTax: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const { canViewAllPayslips } = usePermissions();
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [loading, setLoading] = useState(true);

  // Users list for employee dropdown (admin only)
  const [users, setUsers] = useState<User[]>([]);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<PayslipData | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  // Generate / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [payload, setPayload] = useState<FormState>(EMPTY_FORM);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const data = canViewAllPayslips
        ? await payrollService.getAll()
        : await payrollService.getMine();
      setPayslips(data);
    } catch {
      toast({ title: 'Failed to load payslips', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [canViewAllPayslips, toast]);

  useEffect(() => { loadPayslips(); }, [loadPayslips]);

  useEffect(() => {
    if (canViewAllPayslips) {
      settingsService.getUsers().then(setUsers).catch(() => {});
    }
  }, [canViewAllPayslips]);

  // ── Payslip summary stats ─────────────────────────────────────────────────

  const totalPayroll = payslips.reduce((s, p) => s + (p.netSalary ?? 0), 0);
  const avgSalary = payslips.length ? Math.round(totalPayroll / payslips.length) : 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const paidThisMonth = payslips.filter(p => p.month === currentMonth).length;

  // ── Derived view values ───────────────────────────────────────────────────

  const grossEarnings = viewing ? (viewing.grossSalary ?? 0) : 0;
  const totalDeductions = viewing ? (viewing.totalDeductions ?? 0) : 0;

  // ── Print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    if (!payslipRef.current) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Payslip - ${viewing?.employeeName}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        @media print{@page{margin:12mm}}
      </style></head><body>${payslipRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  // ── Form helpers ──────────────────────────────────────────────────────────

  const set = (k: keyof FormState, v: string | number) =>
    setPayload(prev => ({ ...prev, [k]: v }));

  const num = (v: string): number | '' => v === '' ? '' : (parseFloat(v) || 0);

  /** Auto-compute common Indian payroll components from basic salary */
  const autoFill = (basic: number | '') => {
    const b = Number(basic) || 0;
    setPayload(prev => ({
      ...prev,
      basicSalary: basic,
      hra: b > 0 ? Math.round(b * 0.4) : prev.hra,
      da: b > 0 ? Math.round(b * 0.1) : prev.da,
      providentFund: b > 0 ? Math.round(b * 0.12) : prev.providentFund,
    }));
  };

  const openGenerate = () => {
    setEditingId(null);
    setPayload(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (p: PayslipData) => {
    setEditingId(p.id);
    setPayload({
      employeeId: p.employeeId,
      month: p.month,
      paidDays: p.paidDays ?? 26,
      lopDays: p.lopDays ?? '',
      basicSalary: p.basicSalary,
      hra: p.hra,
      da: p.da,
      transportAllowance: p.transportAllowance,
      medicalAllowance: p.medicalAllowance,
      specialAllowance: p.specialAllowance,
      providentFund: p.providentFund,
      esi: p.esi,
      professionalTax: p.professionalTax,
      incomeTax: p.incomeTax,
    });
    setFormOpen(true);
  };

  const toApiPayload = (): PayrollPayload => ({
    employeeId: payload.employeeId,
    month: payload.month,
    paidDays: payload.paidDays === '' ? undefined : Number(payload.paidDays),
    lopDays: payload.lopDays === '' ? undefined : Number(payload.lopDays),
    basicSalary: Number(payload.basicSalary) || 0,
    hra: Number(payload.hra) || 0,
    da: Number(payload.da) || 0,
    transportAllowance: Number(payload.transportAllowance) || 0,
    medicalAllowance: Number(payload.medicalAllowance) || 0,
    specialAllowance: Number(payload.specialAllowance) || 0,
    providentFund: Number(payload.providentFund) || 0,
    esi: Number(payload.esi) || 0,
    professionalTax: Number(payload.professionalTax) || 0,
    incomeTax: Number(payload.incomeTax) || 0,
  });

  const handleSave = async () => {
    if (!payload.employeeId || !payload.month) {
      toast({ title: 'Employee and month are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const apiPayload = toApiPayload();
      if (editingId) {
        const updated = await payrollService.update(editingId, apiPayload);
        setPayslips(prev => prev.map(p => p.id === editingId ? updated : p));
        const empName = payslips.find(p => p.id === editingId)?.employeeName ?? 'Employee';
        toast({ title: `Payslip updated — ${empName}`, description: fmtMonth(apiPayload.month) });
        addNotification({ title: 'Payslip Updated', message: `${empName}'s payslip for ${fmtMonth(apiPayload.month)} has been updated.`, type: 'info' });
      } else {
        const created = await payrollService.generate(apiPayload);
        setPayslips(prev => [created, ...prev]);
        const empUser = users.find(u => u.id === payload.employeeId);
        const empName = empUser ? `${empUser.firstName} ${empUser.lastName}` : 'Employee';
        toast({ title: `Payslip generated — ${empName}`, description: fmtMonth(apiPayload.month) });
        addNotification({ title: 'Payslip Generated', message: `Payslip for ${empName} (${fmtMonth(apiPayload.month)}) generated. Net Pay: ${inr(created.netSalary)}.`, type: 'success' });
      }
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: e?.message ?? 'Failed to save payslip', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Preview gross / net in form ───────────────────────────────────────────

  const n = (v: number | '') => Number(v) || 0;
  const previewGross = n(payload.basicSalary) + n(payload.hra) + n(payload.da) +
    n(payload.transportAllowance) + n(payload.medicalAllowance) + n(payload.specialAllowance);
  const previewDeductions = n(payload.providentFund) + n(payload.esi) +
    n(payload.professionalTax) + n(payload.incomeTax);
  const previewNet = previewGross - previewDeductions;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-sm text-muted-foreground">
            {canViewAllPayslips ? 'Manage salary structure & payslips' : 'Your payslips'}
          </p>
        </div>
        {canViewAllPayslips && (
          <Button onClick={openGenerate} className="gap-2">
            <Plus size={16} /> Generate Payslip
          </Button>
        )}
      </div>

      {/* Summary cards — admin only */}
      {canViewAllPayslips && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Payroll', value: inr(totalPayroll), desc: 'All payslips' },
            { label: 'Avg Net Salary', value: inr(avgSalary), desc: 'Per employee' },
            { label: 'This Month', value: `${paidThisMonth} payslips`, desc: fmtMonth(currentMonth) },
          ].map(c => (
            <Card key={c.label} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
                  <DollarSign size={18} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payslip table */}
      {loading ? (
        <Card className="shadow-sm"><CardContent className="p-10 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : payslips.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-10 text-center">
            <Lock size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No payslips available.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">
            {canViewAllPayslips ? 'All Payslips' : 'My Payslips'}
          </CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {canViewAllPayslips && <TableHead>Employee</TableHead>}
                  <TableHead>Month</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map(p => (
                  <TableRow key={p.id}>
                    {canViewAllPayslips && <TableCell className="font-medium">{p.employeeName}</TableCell>}
                    <TableCell>{fmtMonth(p.month)}</TableCell>
                    <TableCell>{inr(p.basicSalary)}</TableCell>
                    <TableCell>{inr(p.grossSalary)}</TableCell>
                    <TableCell className="text-destructive">{inr(p.totalDeductions)}</TableCell>
                    <TableCell className="font-semibold text-green-700">{inr(p.netSalary)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View payslip"
                          onClick={() => { setViewing(p); setViewOpen(true); }}>
                          <Eye size={16} />
                        </Button>
                        {canViewAllPayslips && (
                          <Button variant="ghost" size="icon" title="Edit payslip"
                            onClick={() => openEdit(p)}>
                            <Pencil size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── View / Print Payslip Dialog ─────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" aria-describedby={undefined}>
          {/* Toolbar — no extra X button; DialogContent already provides one */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b bg-muted/40">
            <span className="text-sm font-medium text-muted-foreground">Payslip Preview</span>
            <Button variant="outline" size="sm" className="gap-1.5 mr-7" onClick={handlePrint}>
              <Printer size={14} /> Print / Save PDF
            </Button>
          </div>

          {viewing && (
            <div className="max-h-[82vh] overflow-y-auto">
              <div ref={payslipRef} style={{ fontFamily:"'Segoe UI',Arial,sans-serif", background:'#fff', color:'#111' }}>

                {/* Colour bar */}
                <div style={{ background:'#1e3a5f', height:'8px' }} />

                {/* Company header */}
                <div style={{ padding:'20px 28px 14px', borderBottom:'1px solid #d1d5db', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#1e3a5f', letterSpacing:'.3px' }}>
                      {user?.organizationName ?? 'Organisation'}
                    </div>
                    <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'3px' }}>
                      Salary Slip — Confidential
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'15px', fontWeight:700, color:'#1e3a5f', letterSpacing:'1px' }}>
                      PAYSLIP
                    </div>
                    <div style={{ fontSize:'12px', color:'#374151', marginTop:'2px' }}>{fmtMonth(viewing.month)}</div>
                    <div style={{ fontSize:'10px', color:'#9ca3af', marginTop:'1px' }}>Ref: {viewing.id.slice(-8).toUpperCase()}</div>
                  </div>
                </div>

                {/* Employee details grid */}
                <div style={{ background:'#f8fafc', padding:'14px 28px', borderBottom:'1px solid #e5e7eb' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <tbody>
                      <tr>
                        {[
                          ['Employee Name', viewing.employeeName],
                          ['Employee ID', `EMP-${viewing.employeeId.slice(-5).toUpperCase()}`],
                          ['Pay Period', fmtMonth(viewing.month)],
                        ].map(([lbl, val]) => (
                          <td key={lbl as string} style={{ padding:'6px 14px 6px 0', width:'33%', verticalAlign:'top' }}>
                            <div style={{ fontSize:'9px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'.6px', fontWeight:600 }}>{lbl}</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'#111827', marginTop:'2px' }}>{val}</div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        {[
                          ['Designation', viewing.designation ?? '—'],
                          ['Department', viewing.department ?? '—'],
                          ['Paid Days / LOP', `${viewing.paidDays ?? 26} / ${viewing.lopDays ?? 0}`],
                        ].map(([lbl, val]) => (
                          <td key={lbl as string} style={{ padding:'6px 14px 0 0', width:'33%', verticalAlign:'top' }}>
                            <div style={{ fontSize:'9px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'.6px', fontWeight:600 }}>{lbl}</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'#111827', marginTop:'2px' }}>{val}</div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Earnings + Deductions side by side */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0', padding:'0 28px 0' }}>

                  {/* Earnings */}
                  <div style={{ paddingRight:'20px', borderRight:'1px solid #e5e7eb', paddingTop:'16px', paddingBottom:'16px' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#1e3a5f', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:'8px', paddingBottom:'6px', borderBottom:'2px solid #1e3a5f' }}>
                      Earnings
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <tbody>
                        {[
                          ['Basic Salary', viewing.basicSalary],
                          ['House Rent Allowance', viewing.hra],
                          ['Dearness Allowance', viewing.da],
                          ['Transport Allowance', viewing.transportAllowance],
                          ['Medical Allowance', viewing.medicalAllowance],
                          ['Special Allowance', viewing.specialAllowance],
                        ].map(([lbl, amt]) => (
                          <tr key={lbl as string}>
                            <td style={{ fontSize:'12px', color:'#374151', padding:'5px 0', borderBottom:'1px dashed #f0f0f0' }}>{lbl}</td>
                            <td style={{ fontSize:'12px', color:'#111827', padding:'5px 0', textAlign:'right', borderBottom:'1px dashed #f0f0f0', fontVariantNumeric:'tabular-nums' }}>{inr(amt as number)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background:'#eff6ff' }}>
                          <td style={{ fontSize:'12px', fontWeight:700, color:'#1e3a5f', padding:'7px 4px' }}>Gross Earnings</td>
                          <td style={{ fontSize:'12px', fontWeight:700, color:'#1e3a5f', padding:'7px 4px', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{inr(grossEarnings)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Deductions */}
                  <div style={{ paddingLeft:'20px', paddingTop:'16px', paddingBottom:'16px' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#9f1239', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:'8px', paddingBottom:'6px', borderBottom:'2px solid #9f1239' }}>
                      Deductions
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <tbody>
                        {[
                          ['Provident Fund (EPF)', viewing.providentFund],
                          ['ESI Contribution', viewing.esi],
                          ['Professional Tax', viewing.professionalTax],
                          ['Income Tax (TDS)', viewing.incomeTax],
                        ].map(([lbl, amt]) => (
                          <tr key={lbl as string}>
                            <td style={{ fontSize:'12px', color:'#374151', padding:'5px 0', borderBottom:'1px dashed #f0f0f0' }}>{lbl}</td>
                            <td style={{ fontSize:'12px', color:'#b91c1c', padding:'5px 0', textAlign:'right', borderBottom:'1px dashed #f0f0f0', fontVariantNumeric:'tabular-nums' }}>{inr(amt as number)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background:'#fff1f2' }}>
                          <td style={{ fontSize:'12px', fontWeight:700, color:'#9f1239', padding:'7px 4px' }}>Total Deductions</td>
                          <td style={{ fontSize:'12px', fontWeight:700, color:'#9f1239', padding:'7px 4px', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{inr(totalDeductions)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Net pay band */}
                <div style={{ background:'#1e3a5f', margin:'0 28px', borderRadius:'6px', padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'#fff', letterSpacing:'.3px' }}>NET PAY (Take Home)</span>
                  <span style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'.5px', fontVariantNumeric:'tabular-nums' }}>{inr(viewing.netSalary)}</span>
                </div>

                {/* Footer */}
                <div style={{ textAlign:'center', fontSize:'10px', color:'#9ca3af', padding:'0 28px 16px', borderTop:'1px solid #f3f4f6', paddingTop:'10px' }}>
                  This is a computer-generated payslip and does not require a signature. &nbsp;|&nbsp; {user?.organizationName ?? 'Organisation'}
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Generate / Edit Payslip Dialog ─────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Payslip' : 'Generate Payslip'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Employee + Month */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Employee *</Label>
                {editingId ? (
                  <Input disabled value={payslips.find(p => p.id === editingId)?.employeeName ?? ''} />
                ) : (
                  <Select value={payload.employeeId} onValueChange={v => set('employeeId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1">
                <Label>Month (YYYY-MM) *</Label>
                <Input type="month" value={payload.month} onChange={e => set('month', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Paid Days</Label>
                <Input type="number" min={0} max={31} value={payload.paidDays}
                  onChange={e => set('paidDays', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>LOP Days</Label>
                <Input type="number" min={0} max={31} value={payload.lopDays}
                  onChange={e => set('lopDays', num(e.target.value))} />
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Earnings</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Basic Salary (₹) *</Label>
                <Input type="number" min={0} value={payload.basicSalary}
                  onChange={e => autoFill(num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>HRA (₹)</Label>
                <Input type="number" min={0} value={payload.hra} onChange={e => set('hra', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>DA (₹)</Label>
                <Input type="number" min={0} value={payload.da} onChange={e => set('da', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Transport Allowance (₹)</Label>
                <Input type="number" min={0} value={payload.transportAllowance}
                  onChange={e => set('transportAllowance', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Medical Allowance (₹)</Label>
                <Input type="number" min={0} value={payload.medicalAllowance}
                  onChange={e => set('medicalAllowance', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Special Allowance (₹)</Label>
                <Input type="number" min={0} value={payload.specialAllowance}
                  onChange={e => set('specialAllowance', num(e.target.value))} />
              </div>
            </div>

            <div className="rounded-md bg-muted/50 px-4 py-2 text-sm flex justify-between">
              <span className="font-medium">Gross Earnings</span>
              <span className="font-semibold">{inr(previewGross)}</span>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Deductions</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Provident Fund / EPF (₹)</Label>
                <Input type="number" min={0} value={payload.providentFund}
                  onChange={e => set('providentFund', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>ESI (₹)</Label>
                <Input type="number" min={0} value={payload.esi} onChange={e => set('esi', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Professional Tax (₹)</Label>
                <Input type="number" min={0} value={payload.professionalTax}
                  onChange={e => set('professionalTax', num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Income Tax / TDS (₹)</Label>
                <Input type="number" min={0} value={payload.incomeTax}
                  onChange={e => set('incomeTax', num(e.target.value))} />
              </div>
            </div>

            <div className="rounded-md bg-muted/50 px-4 py-2 text-sm flex justify-between">
              <span className="font-medium">Net Pay</span>
              <span className="font-bold text-green-700">{inr(previewNet)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Payslip' : 'Generate Payslip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default PayrollPage;
