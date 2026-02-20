import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, Eye } from 'lucide-react';
import { mockPayslips } from '@/data/mock-data';
import { PayslipData } from '@/types/models';
import { Separator } from '@/components/ui/separator';

const PayrollPage: React.FC = () => {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<PayslipData | null>(null);

  const openView = (p: PayslipData) => { setViewing(p); setViewOpen(true); };

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

      {/* Payslip Preview */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Payslip — {viewing?.month}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between font-medium">
                <span>Employee</span><span>{viewing.employeeName}</span>
              </div>
              <Separator />
              <p className="text-muted-foreground font-medium">Earnings</p>
              {[
                ['Basic Salary', viewing.basicSalary],
                ['HRA', viewing.hra],
                ['Transport', viewing.transportAllowance],
                ['Medical', viewing.medicalAllowance],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span>${(v as number).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <p className="text-muted-foreground font-medium">Deductions</p>
              {[
                ['Tax', viewing.tax],
                ['Provident Fund', viewing.providentFund],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="text-destructive">-${(v as number).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Net Salary</span>
                <span>${viewing.netSalary.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPage;
