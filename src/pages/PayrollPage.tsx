import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DollarSign, Eye, Printer, X } from 'lucide-react';
import { mockPayslips } from '@/data/mock-data';
import { PayslipData } from '@/types/models';

const PayrollPage: React.FC = () => {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<PayslipData | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  const openView = (p: PayslipData) => { setViewing(p); setViewOpen(true); };

  const handlePrint = () => {
    if (!payslipRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Payslip - ${viewing?.employeeName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
        .payslip { max-width: 700px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4F46E5; padding-bottom: 16px; margin-bottom: 24px; }
        .company { font-size: 22px; font-weight: 700; color: #4F46E5; }
        .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .info-item label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item p { font-size: 14px; font-weight: 500; margin: 2px 0 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f3f4f6; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
        .amount { text-align: right; font-weight: 500; }
        .deduction { color: #dc2626; }
        .total-row { border-top: 2px solid #4F46E5; }
        .total-row td { font-weight: 700; font-size: 16px; padding-top: 14px; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${payslipRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const grossEarnings = viewing
    ? viewing.basicSalary + viewing.hra + viewing.transportAllowance + viewing.medicalAllowance
    : 0;
  const totalDeductions = viewing ? viewing.tax + viewing.providentFund : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Salary structure & payslips</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Payroll', value: '$45,650', desc: 'This month' },
          { label: 'Avg Salary', value: '$8,500', desc: 'Per employee' },
          { label: 'Employees Paid', value: '3 / 10', desc: 'February 2026' },
        ].map(c => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-white">
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

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Payslips — February 2026</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>HRA</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayslips.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.employeeName}</TableCell>
                  <TableCell>${p.basicSalary.toLocaleString()}</TableCell>
                  <TableCell>${p.hra.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">${(p.tax + p.providentFund).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">${p.netSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openView(p)}><Eye size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PDF-like Payslip Preview */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground">Payslip Preview</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
                <Printer size={14} /> Print / Save PDF
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          </div>
          {viewing && (
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <div ref={payslipRef} className="payslip">
                {/* Header */}
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid hsl(var(--primary))', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'hsl(var(--primary))' }}>HRMS Corp.</div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>123 Business Ave, Suite 100</div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>contact@hrmscorp.com</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>PAYSLIP</div>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>{viewing.month}</div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>ID: PS-{viewing.id.padStart(4, '0')}</div>
                  </div>
                </div>

                {/* Employee Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  {[
                    ['Employee Name', viewing.employeeName],
                    ['Employee ID', `EMP-${viewing.employeeId.padStart(4, '0')}`],
                    ['Pay Period', viewing.month],
                    ['Pay Date', '28 Feb 2026'],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Earnings Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <thead>
                    <tr style={{ background: 'hsl(var(--muted))' }}>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--muted-foreground))', borderBottom: '2px solid hsl(var(--border))' }}>Earnings</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--muted-foreground))', borderBottom: '2px solid hsl(var(--border))' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Basic Salary', viewing.basicSalary],
                      ['House Rent Allowance', viewing.hra],
                      ['Transport Allowance', viewing.transportAllowance],
                      ['Medical Allowance', viewing.medicalAllowance],
                    ].map(([label, amount]) => (
                      <tr key={label as string}>
                        <td style={{ padding: '10px 14px', fontSize: '14px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>{label}</td>
                        <td style={{ padding: '10px 14px', fontSize: '14px', textAlign: 'right', fontWeight: 500, borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>${(amount as number).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                      <td style={{ padding: '10px 14px', fontSize: '14px', fontWeight: 600 }}>Gross Earnings</td>
                      <td style={{ padding: '10px 14px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>${grossEarnings.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Deductions Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <thead>
                    <tr style={{ background: 'hsl(var(--muted))' }}>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--muted-foreground))', borderBottom: '2px solid hsl(var(--border))' }}>Deductions</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'hsl(var(--muted-foreground))', borderBottom: '2px solid hsl(var(--border))' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Income Tax', viewing.tax],
                      ['Provident Fund', viewing.providentFund],
                    ].map(([label, amount]) => (
                      <tr key={label as string}>
                        <td style={{ padding: '10px 14px', fontSize: '14px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>{label}</td>
                        <td style={{ padding: '10px 14px', fontSize: '14px', textAlign: 'right', fontWeight: 500, color: 'hsl(var(--destructive))', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>-${(amount as number).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                      <td style={{ padding: '10px 14px', fontSize: '14px', fontWeight: 600 }}>Total Deductions</td>
                      <td style={{ padding: '10px 14px', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: 'hsl(var(--destructive))' }}>-${totalDeductions.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Net Pay */}
                <div style={{ borderTop: '3px solid hsl(var(--primary))', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700 }}>Net Pay</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'hsl(var(--primary))' }}>${viewing.netSalary.toLocaleString()}</span>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '40px', paddingTop: '16px', borderTop: '1px solid hsl(var(--border))' }}>
                  This is a computer-generated payslip and does not require a signature.
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPage;
