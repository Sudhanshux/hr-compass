export interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
  color: string;
}

export const mockLeaveBalances: LeaveBalance[] = [
  { type: 'Casual Leave', total: 12, used: 3, remaining: 9, color: 'hsl(var(--primary))' },
  { type: 'Sick Leave', total: 10, used: 2, remaining: 8, color: 'hsl(var(--destructive))' },
  { type: 'Earned Leave', total: 15, used: 5, remaining: 10, color: 'hsl(var(--success))' },
  { type: 'Maternity Leave', total: 180, used: 0, remaining: 180, color: 'hsl(var(--info))' },
];

export interface PublicHoliday {
  date: string;
  name: string;
}

export const publicHolidays: PublicHoliday[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-02-17', name: 'Maha ShivRatri' },
  { date: '2026-03-17', name: 'Holi' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-04', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
];
