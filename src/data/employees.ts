// Realistic SIRH dump (lightweight): 50 representative employee profiles
export type Employee = {
  id: string; // NXF-XXXX
  name: string;
  role: string;
  department: string;
  site: 'Brussels' | 'Amsterdam' | 'Berlin' | 'Lisbon' | 'Remote';
  grade: string; // IC1-IC6 or M1-M5
  salary: number; // annual gross EUR
  startDate: string; // ISO
  status: 'active' | 'sick-leave' | 'notice-period';
  flightRisk: 'low' | 'medium' | 'high';
  manager: string; // NXF-XXXX
};

export const employees: Employee[] = [
  // Core SIRH-exact profiles (requested)
  { id: 'NXF-0001', name: 'Sophie Lefèvre', role: 'Chief Human Resources Officer', department: 'HR', site: 'Brussels', grade: 'M4', salary: 115000, startDate: '2016-04-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0002' },
  { id: 'NXF-0002', name: 'Lena Verstraete', role: 'Chief Executive Officer', department: 'Executive', site: 'Brussels', grade: 'M5', salary: 200000, startDate: '2012-07-15T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0000' },
  { id: 'NXF-0003', name: 'Ravi Singh', role: 'VP Engineering', department: 'Engineering', site: 'Amsterdam', grade: 'M3', salary: 150000, startDate: '2018-09-01T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0002' },
  { id: 'NXF-0004', name: 'Isabelle Thiry', role: 'Chief Legal Officer', department: 'Legal', site: 'Brussels', grade: 'M3', salary: 145000, startDate: '2014-02-10T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0002' },
  { id: 'NXF-0005', name: 'Marc Dujardin', role: 'Chief Financial Officer', department: 'Finance', site: 'Brussels', grade: 'M4', salary: 160000, startDate: '2015-05-20T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0002' },

  // Additional named profiles requested
  { id: 'NXF-5113', name: 'Noor Novak', role: 'Engineer (IC3)', department: 'Engineering', site: 'Brussels', grade: 'IC3', salary: 92000, startDate: '2021-06-01T09:00:00.000Z', status: 'active', flightRisk: 'high', manager: 'NXF-0201' },
  { id: 'NXF-0089', name: 'Yasmina El Idrissi', role: 'HR Business Partner', department: 'HR', site: 'Brussels', grade: 'M2', salary: 78000, startDate: '2019-01-15T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0001' },
  { id: 'NXF-0201', name: 'Amit Patel', role: 'Engineering Lead', department: 'Engineering', site: 'Amsterdam', grade: 'IC5', salary: 115000, startDate: '2017-11-01T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0003' },

  // Populate the remainder (NXF-0006 -> NXF-0047) — 42 varied profiles
  { id: 'NXF-0006', name: 'Eva Moreau', role: 'Product Manager', department: 'Product', site: 'Brussels', grade: 'M1', salary: 90000, startDate: '2020-03-02T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0003' },
  { id: 'NXF-0007', name: 'Luca Romano', role: 'Senior Software Engineer', department: 'Engineering', site: 'Amsterdam', grade: 'IC4', salary: 98000, startDate: '2019-08-12T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0201' },
  { id: 'NXF-0008', name: 'Marta Silva', role: 'UX Designer', department: 'Design', site: 'Lisbon', grade: 'IC3', salary: 62000, startDate: '2021-05-10T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0012' },
  { id: 'NXF-0009', name: 'Jonas Becker', role: 'QA Engineer', department: 'QA', site: 'Berlin', grade: 'IC2', salary: 52000, startDate: '2022-01-20T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0015' },
  { id: 'NXF-0010', name: 'Ana Costa', role: 'Recruiter', department: 'Recruiting', site: 'Lisbon', grade: 'IC2', salary: 48000, startDate: '2023-02-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0001' },
  { id: 'NXF-0011', name: 'Peter Jansen', role: 'Support Engineer', department: 'Support', site: 'Brussels', grade: 'IC2', salary: 44000, startDate: '2018-10-11T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0016' },
  { id: 'NXF-0012', name: 'Sofia Almeida', role: 'Data Analyst', department: 'Data', site: 'Lisbon', grade: 'IC3', salary: 60000, startDate: '2020-07-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0018' },
  { id: 'NXF-0013', name: 'Tomáš Novák', role: 'DevOps Engineer', department: 'Ops', site: 'Berlin', grade: 'IC3', salary: 78000, startDate: '2017-04-03T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0003' },
  { id: 'NXF-0014', name: 'Svenja Müller', role: 'Marketing Manager', department: 'Marketing', site: 'Berlin', grade: 'M1', salary: 82000, startDate: '2019-09-10T09:00:00.000Z', status: 'notice-period', flightRisk: 'high', manager: 'NXF-0002' },
  { id: 'NXF-0015', name: 'Oliver Smith', role: 'QA Lead', department: 'QA', site: 'Remote', grade: 'IC4', salary: 88000, startDate: '2016-06-20T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0003' },
  { id: 'NXF-0016', name: 'Marie Dubois', role: 'Customer Success', department: 'Customer Success', site: 'Brussels', grade: 'IC3', salary: 54000, startDate: '2021-11-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0005' },
  { id: 'NXF-0017', name: 'Carlos Nunes', role: 'Sales Executive', department: 'Sales', site: 'Lisbon', grade: 'IC3', salary: 65000, startDate: '2022-05-15T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0020' },
  { id: 'NXF-0018', name: 'Hannah Wright', role: 'Head of People Analytics', department: 'People Analytics', site: 'Brussels', grade: 'M2', salary: 98000, startDate: '2018-02-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0001' },
  { id: 'NXF-0019', name: 'Mateo Rossi', role: 'Backend Engineer', department: 'Engineering', site: 'Amsterdam', grade: 'IC3', salary: 70000, startDate: '2020-10-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0201' },
  { id: 'NXF-0020', name: 'Elena Petrova', role: 'Security Engineer', department: 'Security', site: 'Berlin', grade: 'IC4', salary: 95000, startDate: '2019-03-05T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0003' },
  { id: 'NXF-0021', name: 'Ibrahim Khaled', role: 'Fullstack Engineer', department: 'Engineering', site: 'Brussels', grade: 'IC2', salary: 55000, startDate: '2023-01-12T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0201' },
  { id: 'NXF-0022', name: 'Nora Jensen', role: 'People Ops Specialist', department: 'HR', site: 'Amsterdam', grade: 'IC2', salary: 47000, startDate: '2021-08-01T09:00:00.000Z', status: 'sick-leave', flightRisk: 'low', manager: 'NXF-0001' },
  { id: 'NXF-0023', name: 'Giorgio Bianchi', role: 'Data Engineer', department: 'Data', site: 'Amsterdam', grade: 'IC3', salary: 72000, startDate: '2019-07-18T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0018' },
  { id: 'NXF-0024', name: 'Álvaro Mendes', role: 'Designer', department: 'Design', site: 'Lisbon', grade: 'IC2', salary: 46000, startDate: '2022-09-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0008' },
  { id: 'NXF-0025', name: 'Katrin Bauer', role: 'Legal Counsel', department: 'Legal', site: 'Berlin', grade: 'IC4', salary: 90000, startDate: '2017-12-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0004' },
  { id: 'NXF-0026', name: 'Pablo García', role: 'Finance Analyst', department: 'Finance', site: 'Brussels', grade: 'IC2', salary: 50000, startDate: '2020-06-10T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0005' },
  { id: 'NXF-0027', name: 'Sanja Kovac', role: 'Recruitment Coordinator', department: 'Recruiting', site: 'Berlin', grade: 'IC1', salary: 37000, startDate: '2024-01-02T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0010' },
  { id: 'NXF-0028', name: 'Dirk Vermeulen', role: 'Operations Manager', department: 'Ops', site: 'Brussels', grade: 'M1', salary: 93000, startDate: '2015-10-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0002' },
  { id: 'NXF-0029', name: 'Olga Ivanova', role: 'Content Strategist', department: 'Marketing', site: 'Remote', grade: 'IC3', salary: 61000, startDate: '2021-04-12T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0014' },
  { id: 'NXF-0030', name: 'Liam O’Connor', role: 'Account Executive', department: 'Sales', site: 'Brussels', grade: 'IC3', salary: 68000, startDate: '2019-11-25T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0017' },
  { id: 'NXF-0031', name: 'Zofia Kowalska', role: 'Customer Support', department: 'Support', site: 'Lisbon', grade: 'IC1', salary: 36000, startDate: '2023-03-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0016' },
  { id: 'NXF-0032', name: 'Bjørn Hansen', role: 'Machine Learning Engineer', department: 'Engineering', site: 'Amsterdam', grade: 'IC5', salary: 125000, startDate: '2016-08-01T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0003' },
  { id: 'NXF-0033', name: 'Rosa Almeida', role: 'HR Coordinator', department: 'HR', site: 'Lisbon', grade: 'IC1', salary: 35000, startDate: '2022-07-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0089' },
  { id: 'NXF-0034', name: 'Henrik Svensson', role: 'Chief of Staff', department: 'Executive', site: 'Brussels', grade: 'M2', salary: 120000, startDate: '2018-01-08T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0002' },
  { id: 'NXF-0035', name: 'Miriam López', role: 'Payroll Specialist', department: 'Finance', site: 'Brussels', grade: 'IC2', salary: 47000, startDate: '2020-02-10T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0005' },
  { id: 'NXF-0036', name: 'Dario Rossi', role: 'Site Reliability Engineer', department: 'Ops', site: 'Berlin', grade: 'IC4', salary: 92000, startDate: '2017-05-03T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0013' },
  { id: 'NXF-0037', name: 'Amelie Petit', role: 'Research Analyst', department: 'Data', site: 'Brussels', grade: 'IC3', salary: 65000, startDate: '2019-06-18T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0018' },
  { id: 'NXF-0038', name: 'Constantine Georgiou', role: 'Platform Engineer', department: 'Engineering', site: 'Lisbon', grade: 'IC3', salary: 72000, startDate: '2020-12-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0201' },
  { id: 'NXF-0039', name: 'Yara Haddad', role: 'Legal Assistant', department: 'Legal', site: 'Brussels', grade: 'IC1', salary: 38000, startDate: '2024-02-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0004' },
  { id: 'NXF-0040', name: 'Kai Tanaka', role: 'Frontend Engineer', department: 'Engineering', site: 'Remote', grade: 'IC3', salary: 69000, startDate: '2021-09-15T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0201' },
  { id: 'NXF-0041', name: 'Lucia Fernandez', role: 'Talent Partner', department: 'Recruiting', site: 'Remote', grade: 'IC3', salary: 60000, startDate: '2022-03-10T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0001' },
  { id: 'NXF-0042', name: 'Ethan Brown', role: 'Business Analyst', department: 'Product', site: 'Brussels', grade: 'IC2', salary: 52000, startDate: '2020-01-15T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0006' },
  { id: 'NXF-0043', name: 'Helena Martins', role: 'QA Tester', department: 'QA', site: 'Lisbon', grade: 'IC1', salary: 36000, startDate: '2023-05-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0015' },
  { id: 'NXF-0044', name: 'Noémie Laurent', role: 'People Researcher', department: 'People Analytics', site: 'Brussels', grade: 'IC2', salary: 47000, startDate: '2022-10-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0018' },
  { id: 'NXF-0045', name: 'Marek Nowak', role: 'Senior Designer', department: 'Design', site: 'Berlin', grade: 'IC4', salary: 84000, startDate: '2018-11-01T09:00:00.000Z', status: 'active', flightRisk: 'medium', manager: 'NXF-0008' },
  { id: 'NXF-0046', name: 'Fatima Zahra', role: 'Customer Success Manager', department: 'Customer Success', site: 'Brussels', grade: 'IC4', salary: 78000, startDate: '2019-12-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0016' },
  { id: 'NXF-0047', name: 'Rui Silva', role: 'Sales Operations', department: 'Sales', site: 'Lisbon', grade: 'IC2', salary: 48000, startDate: '2021-07-01T09:00:00.000Z', status: 'active', flightRisk: 'low', manager: 'NXF-0030' },
];

// Headcount indicator remains the canonical KPI (500) in src/data/kpis.ts

