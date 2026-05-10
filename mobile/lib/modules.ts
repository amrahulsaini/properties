export interface SelectOption { label: string; value: string }
export interface ModuleField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'time' | 'select' | 'textarea' | 'checkbox' | 'project_select' | 'gps_location' | 'image' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  readOnly?: boolean;
  step?: string;
}
export interface ModuleColumn { key: string; label: string; type?: 'currency' | 'number' | 'date' | 'datetime' | 'boolean' | 'badge' }
export interface ModuleSummary { label: string; type: 'count' | 'sum' | 'unique' | 'computed'; field?: string; prefix?: string; tone?: 'accent' | 'success' | 'warning'; filter?: Record<string, unknown> }
export interface ModuleConfig {
  slug: string;
  section: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  resource?: string;
  fields: ModuleField[];
  columns: ModuleColumn[];
  summaries: ModuleSummary[];
  emptyState: string;
}

const paymentModeOptions: SelectOption[] = [
  { label: 'GPay', value: 'GPay' }, { label: 'PhonePe', value: 'PhonePe' },
  { label: 'Cash', value: 'Cash' }, { label: 'Bank', value: 'Bank' },
];
const paymentStatusOptions: SelectOption[] = [
  { label: 'Paid', value: 'paid' }, { label: 'Partial', value: 'partial' }, { label: 'Pending', value: 'pending' },
];
const statusOptions: SelectOption[] = [
  { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' },
];

export const modules: ModuleConfig[] = [
  {
    slug: 'projects', section: 'Finance', title: 'Projects', subtitle: 'Manage all real estate projects.',
    badge: 'Projects', icon: 'Building2', resource: 'projects',
    fields: [
      { key: 'code', label: 'Project Code', type: 'text', required: true },
      { key: 'name', label: 'Project Name', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'total_plots', label: 'Total Plots', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
    columns: [
      { key: 'code', label: 'Code' }, { key: 'name', label: 'Name' },
      { key: 'location', label: 'Location' }, { key: 'total_plots', label: 'Plots', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    summaries: [{ label: 'Total Projects', type: 'count', tone: 'accent' }],
    emptyState: 'No projects yet.',
  },
  {
    slug: 'plots', section: 'Finance', title: 'Plots', subtitle: 'Track plot inventory.',
    badge: 'Land inventory', icon: 'MapPinned', resource: 'plots',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select', required: true },
      { key: 'plot_number', label: 'Plot Number', type: 'text', required: true },
      { key: 'area_sqft', label: 'Area (sqft)', type: 'number' },
      { key: 'rate_per_sqft', label: 'Rate / sqft', type: 'number' },
      { key: 'total_price', label: 'Total Price', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Available', value: 'available' }, { label: 'Booked', value: 'booked' }, { label: 'Sold', value: 'sold' },
      ]},
    ],
    columns: [
      { key: 'plot_number', label: 'Plot' }, { key: 'area_sqft', label: 'Area', type: 'number' },
      { key: 'rate_per_sqft', label: 'Rate', type: 'currency' }, { key: 'total_price', label: 'Price', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    summaries: [
      { label: 'Total Plots', type: 'count', tone: 'accent' },
      { label: 'Total Value', type: 'sum', field: 'total_price', prefix: '₹', tone: 'success' },
    ],
    emptyState: 'No plots added.',
  },
  {
    slug: 'transactions', section: 'Finance', title: 'Transactions', subtitle: 'Plot payment transactions.',
    badge: 'Payments', icon: 'Coins', resource: 'transactions',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select', required: true },
      { key: 'customer_name', label: 'Customer', type: 'text', required: true },
      { key: 'plot_number', label: 'Plot Number', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'payment_mode', label: 'Payment Mode', type: 'select', options: paymentModeOptions },
      { key: 'payment_date', label: 'Payment Date', type: 'date' },
      { key: 'payment_status', label: 'Status', type: 'select', options: paymentStatusOptions },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'customer_name', label: 'Customer' }, { key: 'plot_number', label: 'Plot' },
      { key: 'amount', label: 'Amount', type: 'currency' }, { key: 'payment_mode', label: 'Mode', type: 'badge' },
      { key: 'payment_date', label: 'Date', type: 'date' }, { key: 'payment_status', label: 'Status', type: 'badge' },
    ],
    summaries: [
      { label: 'Total Received', type: 'sum', field: 'amount', prefix: '₹', tone: 'success' },
      { label: 'Transactions', type: 'count', tone: 'accent' },
    ],
    emptyState: 'No transactions yet.',
  },
  {
    slug: 'money-transactions', section: 'Finance', title: 'Money Transactions', subtitle: 'General income & expenses.',
    badge: 'Ledger', icon: 'IndianRupee', resource: 'money-transactions',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select' },
      { key: 'transaction_type', label: 'Type', type: 'select', options: [
        { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' },
      ], required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'payment_mode', label: 'Payment Mode', type: 'select', options: paymentModeOptions },
      { key: 'transaction_date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: [
      { key: 'transaction_type', label: 'Type', type: 'badge' },
      { key: 'category', label: 'Category' }, { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'transaction_date', label: 'Date', type: 'date' }, { key: 'payment_mode', label: 'Mode', type: 'badge' },
    ],
    summaries: [
      { label: 'Balance', type: 'computed', tone: 'success' },
      { label: 'Total Income', type: 'sum', field: 'amount', prefix: '₹', filter: { transaction_type: 'income' }, tone: 'success' },
      { label: 'Total Expense', type: 'sum', field: 'amount', prefix: '₹', filter: { transaction_type: 'expense' }, tone: 'warning' },
    ],
    emptyState: 'No transactions recorded.',
  },
  {
    slug: 'advance-bookings', section: 'Legal', title: 'Advance Bookings', subtitle: 'Advance booking memos.',
    badge: 'Advance memo', icon: 'Handshake', resource: 'advance-bookings',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'customer_phone', label: 'Customer Phone', type: 'text' },
      { key: 'village', label: 'Village / Location', type: 'text' },
      { key: 'survey_number', label: 'Survey Number', type: 'text' },
      { key: 'plot_number', label: 'Plot Number', type: 'text' },
      { key: 'area_sqft', label: 'Area (sqft)', type: 'number' },
      { key: 'total_amount', label: 'Total Amount', type: 'number' },
      { key: 'advance_amount', label: 'Advance Amount', type: 'number' },
      { key: 'remaining_amount', label: 'Remaining Amount', type: 'number' },
      { key: 'payment_mode', label: 'Payment Mode', type: 'select', options: paymentModeOptions },
      { key: 'booking_date', label: 'Booking Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'customer_name', label: 'Customer' }, { key: 'plot_number', label: 'Plot' },
      { key: 'advance_amount', label: 'Advance', type: 'currency' },
      { key: 'remaining_amount', label: 'Remaining', type: 'currency' },
      { key: 'booking_date', label: 'Date', type: 'date' },
    ],
    summaries: [
      { label: 'Total Bookings', type: 'count', tone: 'accent' },
      { label: 'Advance Collected', type: 'sum', field: 'advance_amount', prefix: '₹', tone: 'success' },
    ],
    emptyState: 'No advance bookings.',
  },
  {
    slug: 'advance-agreements', section: 'Legal', title: 'Advance Agreements', subtitle: 'Property advance agreements.',
    badge: 'Agreements', icon: 'FileText', resource: 'advance-agreements',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select' },
      { key: 'owner_name', label: 'Owner Name', type: 'text', required: true },
      { key: 'owner_phone', label: 'Owner Phone', type: 'text' },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'village', label: 'Village', type: 'text' },
      { key: 'survey_number', label: 'Survey Number', type: 'text' },
      { key: 'area_sqft', label: 'Area (sqft)', type: 'number' },
      { key: 'total_amount', label: 'Total Amount', type: 'number' },
      { key: 'advance_amount', label: 'Advance Amount', type: 'number' },
      { key: 'agreement_date', label: 'Agreement Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'owner_name', label: 'Owner' }, { key: 'village', label: 'Village' },
      { key: 'total_amount', label: 'Amount', type: 'currency' },
      { key: 'advance_amount', label: 'Advance', type: 'currency' },
      { key: 'agreement_date', label: 'Date', type: 'date' },
    ],
    summaries: [
      { label: 'Total Agreements', type: 'count', tone: 'accent' },
      { label: 'Total Value', type: 'sum', field: 'total_amount', prefix: '₹', tone: 'success' },
    ],
    emptyState: 'No agreements recorded.',
  },
  {
    slug: 'agents', section: 'Buyer Management', title: 'Agents', subtitle: 'Sales agent management.',
    badge: 'Agent network', icon: 'Users', resource: 'agents',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'commission_rate', label: 'Commission %', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
    columns: [
      { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
      { key: 'commission_rate', label: 'Commission %', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    summaries: [{ label: 'Total Agents', type: 'count', tone: 'accent' }],
    emptyState: 'No agents added.',
  },
  {
    slug: 'employees', section: 'Buyer Management', title: 'Employees', subtitle: 'Employee directory.',
    badge: 'HR', icon: 'Briefcase', resource: 'employees',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'salary', label: 'Monthly Salary', type: 'number' },
      { key: 'join_date', label: 'Join Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
    columns: [
      { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' },
      { key: 'salary', label: 'Salary', type: 'currency' },
      { key: 'join_date', label: 'Joined', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    summaries: [
      { label: 'Total Employees', type: 'count', tone: 'accent' },
      { label: 'Total Payroll', type: 'sum', field: 'salary', prefix: '₹', tone: 'warning' },
    ],
    emptyState: 'No employees.',
  },
  {
    slug: 'communications', section: 'Communication', title: 'Communication Log', subtitle: 'Client communications.',
    badge: 'Communication', icon: 'MessagesSquare', resource: 'communications',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select' },
      { key: 'contact_name', label: 'Contact Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: [
        { label: 'Call', value: 'call' }, { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Meeting', value: 'meeting' }, { label: 'Email', value: 'email' },
      ]},
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'follow_up_date', label: 'Follow-up Date', type: 'date' },
      { key: 'communication_date', label: 'Date', type: 'date' },
    ],
    columns: [
      { key: 'contact_name', label: 'Contact' }, { key: 'type', label: 'Type', type: 'badge' },
      { key: 'summary', label: 'Summary' }, { key: 'communication_date', label: 'Date', type: 'date' },
      { key: 'follow_up_date', label: 'Follow-up', type: 'date' },
    ],
    summaries: [{ label: 'Total Logs', type: 'count', tone: 'accent' }],
    emptyState: 'No communications logged.',
  },
  {
    slug: 'construction', section: 'Sites', title: 'Construction Management', subtitle: 'Construction tracking.',
    badge: 'Construction', icon: 'Hammer', resource: 'construction',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select', required: true },
      { key: 'activity', label: 'Activity', type: 'text', required: true },
      { key: 'contractor', label: 'Contractor', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Planned', value: 'planned' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' },
      ]},
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: [
      { key: 'activity', label: 'Activity' }, { key: 'contractor', label: 'Contractor' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }, { key: 'start_date', label: 'Start', type: 'date' },
    ],
    summaries: [
      { label: 'Activities', type: 'count', tone: 'accent' },
      { label: 'Total Cost', type: 'sum', field: 'amount', prefix: '₹', tone: 'warning' },
    ],
    emptyState: 'No construction activities.',
  },
  {
    slug: 'finance', section: 'Finance', title: 'Finance', subtitle: 'General finance records.',
    badge: 'Finance', icon: 'TrendingUp', resource: 'finance',
    fields: [
      { key: 'project_id', label: 'Project', type: 'project_select' },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'entry_type', label: 'Type', type: 'select', options: [
        { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' },
      ], required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'payment_mode', label: 'Payment Mode', type: 'select', options: paymentModeOptions },
      { key: 'entry_date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: [
      { key: 'category', label: 'Category' }, { key: 'entry_type', label: 'Type', type: 'badge' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'entry_date', label: 'Date', type: 'date' },
    ],
    summaries: [
      { label: 'Balance', type: 'computed', tone: 'success' },
      { label: 'Income', type: 'sum', field: 'amount', prefix: '₹', filter: { entry_type: 'income' }, tone: 'success' },
      { label: 'Expense', type: 'sum', field: 'amount', prefix: '₹', filter: { entry_type: 'expense' }, tone: 'warning' },
    ],
    emptyState: 'No finance entries.',
  },
  {
    slug: 'attendance', section: 'Buyer Management', title: 'Attendance', subtitle: 'Employee attendance.',
    badge: 'Attendance', icon: 'MapPinCheck', resource: 'attendance',
    fields: [
      { key: 'employee_name', label: 'Employee Name', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Present', value: 'present' }, { label: 'Absent', value: 'absent' }, { label: 'Half Day', value: 'half' },
      ]},
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
    columns: [
      { key: 'employee_name', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    summaries: [{ label: 'Total Records', type: 'count', tone: 'accent' }],
    emptyState: 'No attendance records.',
  },
  {
    slug: 'salary-tracker', section: 'Buyer Management', title: 'Salary Tracker', subtitle: 'Salary disbursements.',
    badge: 'Payroll', icon: 'Wallet', resource: 'salary-tracker',
    fields: [
      { key: 'employee_name', label: 'Employee Name', type: 'text', required: true },
      { key: 'month', label: 'Month', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'payment_mode', label: 'Payment Mode', type: 'select', options: paymentModeOptions },
      { key: 'paid_on', label: 'Paid On', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: paymentStatusOptions },
    ],
    columns: [
      { key: 'employee_name', label: 'Employee' }, { key: 'month', label: 'Month' },
      { key: 'amount', label: 'Amount', type: 'currency' }, { key: 'status', label: 'Status', type: 'badge' },
    ],
    summaries: [
      { label: 'Total Paid', type: 'sum', field: 'amount', prefix: '₹', filter: { status: 'paid' }, tone: 'success' },
    ],
    emptyState: 'No salary records.',
  },
  {
    slug: 'users', section: 'Access', title: 'Users', subtitle: 'App user management.',
    badge: 'Access control', icon: 'Shield', resource: 'users',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text' },
      { key: 'role', label: 'Role', type: 'select', options: [
        { label: 'Admin', value: 'admin' }, { label: 'Agent', value: 'agent' },
        { label: 'Accountant', value: 'accountant' }, { label: 'Engineer', value: 'engineer' },
      ]},
    ],
    columns: [
      { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', type: 'badge' },
    ],
    summaries: [{ label: 'Total Users', type: 'count', tone: 'accent' }],
    emptyState: 'No users.',
  },
];

export function getModuleConfig(slug: string): ModuleConfig | undefined {
  return modules.find((m) => m.slug === slug);
}

export function getModuleSections(): Record<string, ModuleConfig[]> {
  const sections: Record<string, ModuleConfig[]> = {};
  for (const m of modules) {
    if (!sections[m.section]) sections[m.section] = [];
    sections[m.section].push(m);
  }
  return sections;
}
