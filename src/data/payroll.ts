// Simplified payroll data (demo provider) - April 2026
export type PayrollEntry = {
  employeeId: string;
  gross: number;
  net: number;
  taxes: number;
};

export const payroll = {
  month: '2026-04',
  generatedAt: '2026-04-19T00:00:00.000Z',
  entries: [
    { employeeId: 'NXF-0001', gross: 6500, net: 4200, taxes: 2300 },
    { employeeId: 'NXF-0002', gross: 4200, net: 2800, taxes: 1400 },
  ] as PayrollEntry[],
  totals: {
    gross: 10700,
    net: 7000,
    taxes: 3700,
  },
};
