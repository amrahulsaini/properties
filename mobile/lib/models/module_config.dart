class SelectOption {
  final String label, value;
  const SelectOption(this.label, this.value);
}

class ModuleField {
  final String key, label, type;
  final bool required;
  final String? placeholder;
  final List<SelectOption>? options;
  const ModuleField({
    required this.key, required this.label, required this.type,
    this.required = false, this.placeholder, this.options,
  });
}

class ModuleColumn {
  final String key, label;
  final String? type; // currency | number | date | badge | boolean
  const ModuleColumn({required this.key, required this.label, this.type});
}

class ModuleSummary {
  final String label, type; // count | sum | computed
  final String? field, prefix;
  final String tone; // accent | success | warning
  final Map<String, dynamic>? filter;
  const ModuleSummary({
    required this.label, required this.type,
    this.field, this.prefix, this.tone = 'accent', this.filter,
  });
}

class ModuleConfig {
  final String slug, section, title, subtitle, resource;
  final List<ModuleField> fields;
  final List<ModuleColumn> columns;
  final List<ModuleSummary> summaries;
  final String emptyState;
  const ModuleConfig({
    required this.slug, required this.section, required this.title,
    required this.subtitle, required this.resource,
    required this.fields, required this.columns,
    required this.summaries, required this.emptyState,
  });
}

// ── Shared option lists ──────────────────────────────────────────────────────
const _payMode = [
  SelectOption('GPay', 'GPay'), SelectOption('PhonePe', 'PhonePe'),
  SelectOption('Cash', 'Cash'), SelectOption('Bank', 'Bank'),
];
const _payStatus = [
  SelectOption('Paid', 'paid'), SelectOption('Partial', 'partial'),
  SelectOption('Pending', 'pending'),
];
const _activeStatus = [
  SelectOption('Active', 'active'), SelectOption('Inactive', 'inactive'),
];

// ── Module list ──────────────────────────────────────────────────────────────
const modules = <ModuleConfig>[
  ModuleConfig(
    slug: 'projects', section: 'Finance', title: 'Projects',
    subtitle: 'Manage real estate projects.', resource: 'projects',
    fields: [
      ModuleField(key: 'code', label: 'Project Code', type: 'text', required: true),
      ModuleField(key: 'name', label: 'Project Name', type: 'text', required: true),
      ModuleField(key: 'location', label: 'Location', type: 'text'),
      ModuleField(key: 'total_plots', label: 'Total Plots', type: 'number'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'code', label: 'Code'),
      ModuleColumn(key: 'name', label: 'Name'),
      ModuleColumn(key: 'location', label: 'Location'),
      ModuleColumn(key: 'total_plots', label: 'Plots', type: 'number'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Projects', type: 'count', tone: 'accent')],
    emptyState: 'No projects yet.',
  ),
  ModuleConfig(
    slug: 'plots', section: 'Finance', title: 'Plots',
    subtitle: 'Track plot inventory.', resource: 'plots',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'plot_number', label: 'Plot Number', type: 'text', required: true),
      ModuleField(key: 'area_sqft', label: 'Area (sqft)', type: 'number'),
      ModuleField(key: 'rate_per_sqft', label: 'Rate / sqft', type: 'number'),
      ModuleField(key: 'total_price', label: 'Total Price', type: 'number'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: [
        SelectOption('Available', 'available'), SelectOption('Booked', 'booked'), SelectOption('Sold', 'sold'),
      ]),
    ],
    columns: [
      ModuleColumn(key: 'plot_number', label: 'Plot'),
      ModuleColumn(key: 'area_sqft', label: 'Area', type: 'number'),
      ModuleColumn(key: 'rate_per_sqft', label: 'Rate', type: 'currency'),
      ModuleColumn(key: 'total_price', label: 'Price', type: 'currency'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Plots', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Total Value', type: 'sum', field: 'total_price', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'No plots added.',
  ),
  ModuleConfig(
    slug: 'transactions', section: 'Finance', title: 'Transactions',
    subtitle: 'Plot payment transactions.', resource: 'transactions',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'customer_name', label: 'Customer', type: 'text', required: true),
      ModuleField(key: 'plot_number', label: 'Plot Number', type: 'text'),
      ModuleField(key: 'amount', label: 'Amount', type: 'number', required: true),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'payment_date', label: 'Payment Date', type: 'date'),
      ModuleField(key: 'payment_status', label: 'Status', type: 'select', options: _payStatus),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'customer_name', label: 'Customer'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'payment_mode', label: 'Mode', type: 'badge'),
      ModuleColumn(key: 'payment_date', label: 'Date', type: 'date'),
      ModuleColumn(key: 'payment_status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Received', type: 'sum', field: 'amount', prefix: '₹', tone: 'success'),
      ModuleSummary(label: 'Transactions', type: 'count', tone: 'accent'),
    ],
    emptyState: 'No transactions yet.',
  ),
  ModuleConfig(
    slug: 'money-transactions', section: 'Finance', title: 'Money Transactions',
    subtitle: 'General income & expenses.', resource: 'money-transactions',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select'),
      ModuleField(key: 'transaction_type', label: 'Type', type: 'select', required: true, options: [
        SelectOption('Income', 'income'), SelectOption('Expense', 'expense'),
      ]),
      ModuleField(key: 'category', label: 'Category', type: 'text'),
      ModuleField(key: 'amount', label: 'Amount', type: 'number', required: true),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'transaction_date', label: 'Date', type: 'date'),
      ModuleField(key: 'description', label: 'Description', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'transaction_type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'category', label: 'Category'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'transaction_date', label: 'Date', type: 'date'),
    ],
    summaries: [
      ModuleSummary(label: 'Balance', type: 'computed', tone: 'success'),
      ModuleSummary(label: 'Income', type: 'sum', field: 'amount', prefix: '₹', filter: {'transaction_type': 'income'}, tone: 'success'),
      ModuleSummary(label: 'Expense', type: 'sum', field: 'amount', prefix: '₹', filter: {'transaction_type': 'expense'}, tone: 'warning'),
    ],
    emptyState: 'No transactions recorded.',
  ),
  ModuleConfig(
    slug: 'advance-bookings', section: 'Legal', title: 'Advance Bookings',
    subtitle: 'Advance booking memos.', resource: 'advance-bookings',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'customer_name', label: 'Customer Name', type: 'text', required: true),
      ModuleField(key: 'customer_phone', label: 'Customer Phone', type: 'text'),
      ModuleField(key: 'village', label: 'Village / Location', type: 'text'),
      ModuleField(key: 'survey_number', label: 'Survey Number', type: 'text'),
      ModuleField(key: 'plot_number', label: 'Plot Number', type: 'text'),
      ModuleField(key: 'area_sqft', label: 'Area (sqft)', type: 'number'),
      ModuleField(key: 'total_amount', label: 'Total Amount', type: 'number'),
      ModuleField(key: 'advance_amount', label: 'Advance Amount', type: 'number'),
      ModuleField(key: 'remaining_amount', label: 'Remaining Amount', type: 'number'),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'booking_date', label: 'Booking Date', type: 'date'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'customer_name', label: 'Customer'),
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'advance_amount', label: 'Advance', type: 'currency'),
      ModuleColumn(key: 'remaining_amount', label: 'Remaining', type: 'currency'),
      ModuleColumn(key: 'booking_date', label: 'Date', type: 'date'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Bookings', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Advance Collected', type: 'sum', field: 'advance_amount', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'No advance bookings.',
  ),
  ModuleConfig(
    slug: 'advance-agreements', section: 'Legal', title: 'Advance Agreements',
    subtitle: 'Property advance agreements.', resource: 'advance-agreements',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select'),
      ModuleField(key: 'owner_name', label: 'Owner Name', type: 'text', required: true),
      ModuleField(key: 'owner_phone', label: 'Owner Phone', type: 'text'),
      ModuleField(key: 'customer_name', label: 'Customer Name', type: 'text'),
      ModuleField(key: 'village', label: 'Village', type: 'text'),
      ModuleField(key: 'survey_number', label: 'Survey Number', type: 'text'),
      ModuleField(key: 'area_sqft', label: 'Area (sqft)', type: 'number'),
      ModuleField(key: 'total_amount', label: 'Total Amount', type: 'number'),
      ModuleField(key: 'advance_amount', label: 'Advance Amount', type: 'number'),
      ModuleField(key: 'agreement_date', label: 'Agreement Date', type: 'date'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'owner_name', label: 'Owner'),
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'total_amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'advance_amount', label: 'Advance', type: 'currency'),
      ModuleColumn(key: 'agreement_date', label: 'Date', type: 'date'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Agreements', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Total Value', type: 'sum', field: 'total_amount', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'No agreements recorded.',
  ),
  ModuleConfig(
    slug: 'agents', section: 'Buyer Management', title: 'Agents',
    subtitle: 'Sales agent management.', resource: 'agents',
    fields: [
      ModuleField(key: 'name', label: 'Name', type: 'text', required: true),
      ModuleField(key: 'phone', label: 'Phone', type: 'text'),
      ModuleField(key: 'email', label: 'Email', type: 'text'),
      ModuleField(key: 'commission_rate', label: 'Commission %', type: 'number'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'name', label: 'Name'),
      ModuleColumn(key: 'phone', label: 'Phone'),
      ModuleColumn(key: 'commission_rate', label: 'Commission %', type: 'number'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Agents', type: 'count', tone: 'accent')],
    emptyState: 'No agents added.',
  ),
  ModuleConfig(
    slug: 'employees', section: 'Buyer Management', title: 'Employees',
    subtitle: 'Employee directory.', resource: 'employees',
    fields: [
      ModuleField(key: 'name', label: 'Name', type: 'text', required: true),
      ModuleField(key: 'role', label: 'Role', type: 'text'),
      ModuleField(key: 'phone', label: 'Phone', type: 'text'),
      ModuleField(key: 'salary', label: 'Monthly Salary', type: 'number'),
      ModuleField(key: 'join_date', label: 'Join Date', type: 'date'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'name', label: 'Name'),
      ModuleColumn(key: 'role', label: 'Role'),
      ModuleColumn(key: 'salary', label: 'Salary', type: 'currency'),
      ModuleColumn(key: 'join_date', label: 'Joined', type: 'date'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Employees', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Total Payroll', type: 'sum', field: 'salary', prefix: '₹', tone: 'warning'),
    ],
    emptyState: 'No employees.',
  ),
  ModuleConfig(
    slug: 'communications', section: 'Communication', title: 'Communication Log',
    subtitle: 'Client communications.', resource: 'communications',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select'),
      ModuleField(key: 'contact_name', label: 'Contact Name', type: 'text', required: true),
      ModuleField(key: 'phone', label: 'Phone', type: 'text'),
      ModuleField(key: 'type', label: 'Type', type: 'select', options: [
        SelectOption('Call', 'call'), SelectOption('WhatsApp', 'whatsapp'),
        SelectOption('Meeting', 'meeting'), SelectOption('Email', 'email'),
      ]),
      ModuleField(key: 'summary', label: 'Summary', type: 'textarea'),
      ModuleField(key: 'follow_up_date', label: 'Follow-up Date', type: 'date'),
      ModuleField(key: 'communication_date', label: 'Date', type: 'date'),
    ],
    columns: [
      ModuleColumn(key: 'contact_name', label: 'Contact'),
      ModuleColumn(key: 'type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'summary', label: 'Summary'),
      ModuleColumn(key: 'communication_date', label: 'Date', type: 'date'),
    ],
    summaries: [ModuleSummary(label: 'Total Logs', type: 'count', tone: 'accent')],
    emptyState: 'No communications logged.',
  ),
  ModuleConfig(
    slug: 'construction', section: 'Sites', title: 'Construction',
    subtitle: 'Construction tracking.', resource: 'construction',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'activity', label: 'Activity', type: 'text', required: true),
      ModuleField(key: 'contractor', label: 'Contractor', type: 'text'),
      ModuleField(key: 'amount', label: 'Amount', type: 'number'),
      ModuleField(key: 'start_date', label: 'Start Date', type: 'date'),
      ModuleField(key: 'end_date', label: 'End Date', type: 'date'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: [
        SelectOption('Planned', 'planned'), SelectOption('In Progress', 'in_progress'), SelectOption('Completed', 'completed'),
      ]),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'activity', label: 'Activity'),
      ModuleColumn(key: 'contractor', label: 'Contractor'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Activities', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Total Cost', type: 'sum', field: 'amount', prefix: '₹', tone: 'warning'),
    ],
    emptyState: 'No construction activities.',
  ),
  ModuleConfig(
    slug: 'attendance', section: 'Buyer Management', title: 'Attendance',
    subtitle: 'Employee attendance.', resource: 'attendance',
    fields: [
      ModuleField(key: 'employee_name', label: 'Employee Name', type: 'text', required: true),
      ModuleField(key: 'date', label: 'Date', type: 'date', required: true),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: [
        SelectOption('Present', 'present'), SelectOption('Absent', 'absent'), SelectOption('Half Day', 'half'),
      ]),
      ModuleField(key: 'notes', label: 'Notes', type: 'text'),
    ],
    columns: [
      ModuleColumn(key: 'employee_name', label: 'Employee'),
      ModuleColumn(key: 'date', label: 'Date', type: 'date'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Records', type: 'count', tone: 'accent')],
    emptyState: 'No attendance records.',
  ),
  ModuleConfig(
    slug: 'salary-tracker', section: 'Buyer Management', title: 'Salary Tracker',
    subtitle: 'Salary disbursements.', resource: 'salary-tracker',
    fields: [
      ModuleField(key: 'employee_name', label: 'Employee Name', type: 'text', required: true),
      ModuleField(key: 'month', label: 'Month', type: 'text', required: true),
      ModuleField(key: 'amount', label: 'Amount', type: 'number', required: true),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'paid_on', label: 'Paid On', type: 'date'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _payStatus),
    ],
    columns: [
      ModuleColumn(key: 'employee_name', label: 'Employee'),
      ModuleColumn(key: 'month', label: 'Month'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Paid', type: 'sum', field: 'amount', prefix: '₹', filter: {'status': 'paid'}, tone: 'success'),
    ],
    emptyState: 'No salary records.',
  ),
  ModuleConfig(
    slug: 'users', section: 'Access', title: 'Users',
    subtitle: 'App user management.', resource: 'users',
    fields: [
      ModuleField(key: 'name', label: 'Name', type: 'text', required: true),
      ModuleField(key: 'email', label: 'Email', type: 'text', required: true),
      ModuleField(key: 'password', label: 'Password', type: 'text'),
      ModuleField(key: 'role', label: 'Role', type: 'select', options: [
        SelectOption('Admin', 'admin'), SelectOption('Agent', 'agent'),
        SelectOption('Accountant', 'accountant'), SelectOption('Engineer', 'engineer'),
      ]),
    ],
    columns: [
      ModuleColumn(key: 'name', label: 'Name'),
      ModuleColumn(key: 'email', label: 'Email'),
      ModuleColumn(key: 'role', label: 'Role', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Users', type: 'count', tone: 'accent')],
    emptyState: 'No users.',
  ),
];

ModuleConfig? getModuleConfig(String slug) {
  try { return modules.firstWhere((m) => m.slug == slug); }
  catch (_) { return null; }
}

Map<String, List<ModuleConfig>> getModuleSections() {
  final Map<String, List<ModuleConfig>> sections = {};
  for (final m in modules) {
    sections.putIfAbsent(m.section, () => []).add(m);
  }
  return sections;
}
