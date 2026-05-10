class SelectOption {
  final String label, value;
  const SelectOption(this.label, this.value);
}

class ModuleField {
  final String key, label, type;
  final bool required;
  final String? placeholder;
  final List<SelectOption>? options;
  final Object? showWhen; // Map<String,Object?> or List<Map<String,Object?>>
  final bool readOnly;
  const ModuleField({
    required this.key, required this.label, required this.type,
    this.required = false, this.placeholder, this.options,
    this.showWhen, this.readOnly = false,
  });
}

class ModuleColumn {
  final String key, label;
  final String? type;
  const ModuleColumn({required this.key, required this.label, this.type});
}

class ModuleSummary {
  final String label, type;
  final String? field, prefix;
  final String tone;
  final Map<String, dynamic>? filter;
  const ModuleSummary({
    required this.label, required this.type,
    this.field, this.prefix, this.tone = 'accent', this.filter,
  });
}

class ModuleConfig {
  final String slug, section, title, subtitle, resource;
  final String? pdfRoute;
  final List<ModuleField> fields;
  final List<ModuleColumn> columns;
  final List<ModuleSummary> summaries;
  final String emptyState;
  const ModuleConfig({
    required this.slug, required this.section, required this.title,
    required this.subtitle, required this.resource,
    this.pdfRoute,
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
const _tractorRent = [
  SelectOption('Daily Rent', 'daily'), SelectOption('Hourly Rent', 'hourly'),
];
const _damperMode = [
  SelectOption('Per Trip', 'per_trip'), SelectOption('Per Hour', 'per_hour'),
  SelectOption('Daily Rent', 'daily'),
];

// ── Module list ──────────────────────────────────────────────────────────────
const modules = <ModuleConfig>[
  ModuleConfig(
    slug: 'users', section: 'Access', title: 'User Management',
    subtitle: 'Admin, agent, accountant, and engineer accounts.',
    resource: 'users',
    fields: [
      ModuleField(key: 'full_name', label: 'Full Name', type: 'text', required: true),
      ModuleField(key: 'email', label: 'Email', type: 'email', required: true),
      ModuleField(key: 'phone', label: 'Phone', type: 'tel'),
      ModuleField(key: 'role', label: 'Role', type: 'select', required: true, options: [
        SelectOption('Admin', 'admin'), SelectOption('Agent', 'agent'),
        SelectOption('Accountant', 'accountant'), SelectOption('Engineer', 'engineer'),
      ]),
      ModuleField(key: 'password', label: 'Password', type: 'password', required: true),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'full_name', label: 'Name'),
      ModuleColumn(key: 'email', label: 'Email'),
      ModuleColumn(key: 'role', label: 'Role', type: 'badge'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Users', type: 'count', tone: 'accent')],
    emptyState: 'No users yet.',
  ),

  ModuleConfig(
    slug: 'projects', section: 'Sales', title: 'Project Register',
    subtitle: 'Master list for layouts, sites, and construction-linked properties.',
    resource: 'projects',
    fields: [
      ModuleField(key: 'name', label: 'Project Name', type: 'text', required: true),
      ModuleField(key: 'code', label: 'Project Code', type: 'text', required: true),
      ModuleField(key: 'type', label: 'Type', type: 'select', required: true, options: [
        SelectOption('Plot', 'plot'), SelectOption('Construction', 'construction'),
        SelectOption('Development', 'development'), SelectOption('Mixed', 'mixed'),
      ]),
      ModuleField(key: 'village', label: 'Village', type: 'text'),
      ModuleField(key: 'location', label: 'Location', type: 'text'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'name', label: 'Project'),
      ModuleColumn(key: 'code', label: 'Code'),
      ModuleColumn(key: 'type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Projects', type: 'count', tone: 'accent')],
    emptyState: 'Add projects to organize plots, bookings, and site reports.',
  ),

  ModuleConfig(
    slug: 'plots', section: 'Sales', title: 'Plot Management',
    subtitle: 'Inventory with village, survey number, area, price, and availability.',
    resource: 'plots',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'village', label: 'Village', type: 'text', required: true),
      ModuleField(key: 'survey_number', label: 'Survey Number', type: 'text', required: true),
      ModuleField(key: 'area_sqft', label: 'Area (sq.ft.)', type: 'number'),
      ModuleField(key: 'price', label: 'Price', type: 'number'),
      ModuleField(key: 'location_text', label: 'Location', type: 'text'),
      ModuleField(key: 'status', label: 'Availability', type: 'select', options: [
        SelectOption('Available', 'available'), SelectOption('Sold', 'sold'),
        SelectOption('Blocked', 'blocked'),
      ]),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'survey_number', label: 'Survey No.'),
      ModuleColumn(key: 'area_sqft', label: 'Area', type: 'number'),
      ModuleColumn(key: 'price', label: 'Price', type: 'currency'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Total Plots', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Inventory', type: 'sum', field: 'price', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'Add plot records before sales, bookings, or purchase agreements.',
  ),

  ModuleConfig(
    slug: 'transactions', section: 'Sales', title: 'Buy / Sell Transactions',
    subtitle: 'Purchase and sale entries with payment modes, GST, and P&L.',
    resource: 'transactions',
    fields: [
      ModuleField(key: 'transaction_type', label: 'Entry Type', type: 'select', required: true, options: [
        SelectOption('Sale', 'sale'), SelectOption('Purchase', 'purchase'),
      ]),
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'counterparty_name', label: 'Buyer / Seller Name', type: 'text', required: true),
      ModuleField(key: 'counterparty_phone', label: 'Phone', type: 'tel'),
      ModuleField(key: 'counterparty_photo_url', label: 'Photo / Image', type: 'image'),
      ModuleField(key: 'counterparty_signature_url', label: 'Signature Image', type: 'image'),
      ModuleField(key: 'village', label: 'Village', type: 'text', required: true),
      ModuleField(key: 'survey_number', label: 'Survey Number', type: 'text', required: true),
      ModuleField(key: 'area_sqft', label: 'Area (sq.ft.)', type: 'number'),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'base_amount', label: 'Base Amount', type: 'number', required: true),
      ModuleField(key: 'expense_amount', label: 'Cost / Expense', type: 'number'),
      ModuleField(key: 'gst_enabled', label: 'GST Enabled', type: 'checkbox'),
      ModuleField(key: 'gst_rate', label: 'GST Rate (%)', type: 'number'),
      ModuleField(key: 'transacted_at', label: 'Transaction Date', type: 'datetime-local'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'transaction_type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'counterparty_name', label: 'Party'),
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'total_amount', label: 'Total', type: 'currency'),
      ModuleColumn(key: 'payment_mode', label: 'Mode'),
    ],
    summaries: [
      ModuleSummary(label: 'Entries', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Turnover', type: 'sum', field: 'total_amount', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'Record sales and purchases to activate profitability reporting.',
  ),

  ModuleConfig(
    slug: 'money-transactions', section: 'Finance', title: 'Transaction Management',
    subtitle: 'Income, Expense, Lent, and Borrowed entries.',
    resource: 'money_transactions',
    fields: [
      ModuleField(key: 'name', label: 'Name', type: 'text', required: true),
      ModuleField(key: 'mobile_number', label: 'Mobile', type: 'tel'),
      ModuleField(key: 'transaction_type', label: 'Type', type: 'select', required: true, options: [
        SelectOption('Income (आय)', 'income'), SelectOption('Expense (खर्च)', 'expense'),
        SelectOption('Lent (दिलं)', 'lent'), SelectOption('Borrowed (घेतलं)', 'borrowed'),
      ]),
      ModuleField(key: 'amount', label: 'Amount', type: 'number', required: true),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'bank_name', label: 'Bank Name', type: 'text'),
      ModuleField(key: 'account_number', label: 'Account Number', type: 'text'),
      ModuleField(key: 'transaction_id', label: 'Reference / TXN ID', type: 'text'),
      ModuleField(key: 'date', label: 'Date', type: 'date'),
      ModuleField(key: 'due_date', label: 'Due Date', type: 'date'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: [
        SelectOption('Pending', 'pending'), SelectOption('Paid', 'paid'),
      ]),
      ModuleField(key: 'description', label: 'Description', type: 'textarea'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'transaction_type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'name', label: 'Name'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'date', label: 'Date', type: 'date'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Income', type: 'sum', field: 'amount', prefix: '₹', filter: {'transaction_type': 'income'}, tone: 'success'),
      ModuleSummary(label: 'Expense', type: 'sum', field: 'amount', prefix: '₹', filter: {'transaction_type': 'expense'}, tone: 'warning'),
      ModuleSummary(label: 'Balance', type: 'computed', tone: 'accent'),
    ],
    emptyState: 'Add transactions to manage cash flow and reminders.',
  ),

  ModuleConfig(
    slug: 'advance-bookings', section: 'Sales', title: 'Advance Booking Memo',
    subtitle: 'Client booking memos with PDF and WhatsApp confirmation.',
    resource: 'advance-bookings', pdfRoute: 'advance-bookings',
    fields: [
      ModuleField(key: 'customer_name', label: 'Buyer Name', type: 'text', required: true),
      ModuleField(key: 'seller_name', label: 'Seller Name', type: 'text'),
      ModuleField(key: 'customer_phone', label: 'Mobile', type: 'tel'),
      ModuleField(key: 'customer_email', label: 'Email', type: 'email'),
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'village', label: 'Village', type: 'text', required: true),
      ModuleField(key: 'survey_number', label: 'Survey Number', type: 'text', required: true),
      ModuleField(key: 'area_sqft', label: 'Area (sq.ft.)', type: 'number'),
      ModuleField(key: 'total_amount', label: 'Total Amount', type: 'number', required: true),
      ModuleField(key: 'advance_amount', label: 'Advance Amount', type: 'number', required: true),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'payment_at', label: 'Payment Date', type: 'datetime-local'),
      ModuleField(key: 'gst_enabled', label: 'GST Enabled', type: 'checkbox'),
      ModuleField(key: 'gst_number', label: 'GST Number', type: 'text'),
      ModuleField(key: 'customer_signature_url', label: 'Buyer Signature', type: 'image'),
      ModuleField(key: 'company_signature_url', label: 'Company Signature', type: 'image'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'memo_number', label: 'Memo'),
      ModuleColumn(key: 'customer_name', label: 'Buyer'),
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'advance_amount', label: 'Advance', type: 'currency'),
      ModuleColumn(key: 'remaining_amount', label: 'Remaining', type: 'currency'),
    ],
    summaries: [
      ModuleSummary(label: 'Bookings', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Advance In', type: 'sum', field: 'advance_amount', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'Create booking memos to issue PDFs and send branded confirmations.',
  ),

  ModuleConfig(
    slug: 'advance-agreements', section: 'Sales', title: 'Advance Agreement Memo',
    subtitle: 'Land purchase advance agreements with memo PDF.',
    resource: 'advance-agreements', pdfRoute: 'advance-agreements',
    fields: [
      ModuleField(key: 'owner_name', label: 'Owner / Broker Name', type: 'text', required: true),
      ModuleField(key: 'owner_phone', label: 'Phone', type: 'tel'),
      ModuleField(key: 'owner_email', label: 'Email', type: 'email'),
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'village', label: 'Village', type: 'text', required: true),
      ModuleField(key: 'survey_number', label: 'Survey Number', type: 'text', required: true),
      ModuleField(key: 'area_sqft', label: 'Area (sq.ft.)', type: 'number'),
      ModuleField(key: 'total_amount', label: 'Total Amount', type: 'number', required: true),
      ModuleField(key: 'paid_amount', label: 'Paid Amount', type: 'number', required: true),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'refundable', label: 'Refundable', type: 'checkbox'),
      ModuleField(key: 'agreement_duration_days', label: 'Agreement Duration (days)', type: 'number'),
      ModuleField(key: 'conditions_text', label: 'Conditions', type: 'textarea'),
      ModuleField(key: 'agreement_at', label: 'Agreement Date', type: 'datetime-local'),
      ModuleField(key: 'owner_photo_url', label: 'Owner Photo', type: 'image'),
      ModuleField(key: 'owner_signature_url', label: 'Owner Signature', type: 'image'),
      ModuleField(key: 'company_signature_url', label: 'Company Signature', type: 'image'),
    ],
    columns: [
      ModuleColumn(key: 'owner_name', label: 'Owner'),
      ModuleColumn(key: 'village', label: 'Village'),
      ModuleColumn(key: 'paid_amount', label: 'Advance Paid', type: 'currency'),
      ModuleColumn(key: 'remaining_amount', label: 'Remaining', type: 'currency'),
      ModuleColumn(key: 'agreement_duration_days', label: 'Days', type: 'number'),
    ],
    summaries: [
      ModuleSummary(label: 'Agreements', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Advance Out', type: 'sum', field: 'paid_amount', prefix: '₹', tone: 'warning'),
    ],
    emptyState: 'Add land-owner agreements to produce purchase-side memos.',
  ),

  ModuleConfig(
    slug: 'agents', section: 'Teams', title: 'Agent Management',
    subtitle: 'Profiles, bank details, signatures, and commission tracking.',
    resource: 'agents',
    fields: [
      ModuleField(key: 'name', label: 'Agent Name', type: 'text', required: true),
      ModuleField(key: 'phone', label: 'Phone', type: 'tel'),
      ModuleField(key: 'email', label: 'Email', type: 'email'),
      ModuleField(key: 'photo_url', label: 'Photo / Image', type: 'image'),
      ModuleField(key: 'signature_url', label: 'Signature', type: 'image'),
      ModuleField(key: 'bank_name', label: 'Bank Name', type: 'text'),
      ModuleField(key: 'account_number', label: 'Account Number', type: 'text'),
      ModuleField(key: 'ifsc_code', label: 'IFSC Code', type: 'text'),
      ModuleField(key: 'upi_id', label: 'UPI ID', type: 'text'),
      ModuleField(key: 'commission_percent', label: 'Commission (%)', type: 'number'),
      ModuleField(key: 'commission_fixed', label: 'Fixed Commission', type: 'number'),
      ModuleField(key: 'address', label: 'Address', type: 'textarea'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'name', label: 'Agent'),
      ModuleColumn(key: 'phone', label: 'Phone'),
      ModuleColumn(key: 'bank_name', label: 'Bank'),
      ModuleColumn(key: 'commission_percent', label: 'Commission %', type: 'number'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Total Agents', type: 'count', tone: 'accent')],
    emptyState: 'Add agents to start project-wise and monthly commission reporting.',
  ),

  ModuleConfig(
    slug: 'employees', section: 'Teams', title: 'Employee Management',
    subtitle: 'Staff profiles, salary basis, and field operations.',
    resource: 'employees',
    fields: [
      ModuleField(key: 'name', label: 'Employee Name', type: 'text', required: true),
      ModuleField(key: 'role_title', label: 'Role Title', type: 'text', required: true),
      ModuleField(key: 'phone', label: 'Phone', type: 'tel'),
      ModuleField(key: 'email', label: 'Email', type: 'email'),
      ModuleField(key: 'salary_type', label: 'Salary Type', type: 'select', options: [
        SelectOption('Monthly', 'monthly'), SelectOption('Daily', 'daily'),
        SelectOption('Contract', 'contract'),
      ]),
      ModuleField(key: 'monthly_salary', label: 'Salary / Rate', type: 'number'),
      ModuleField(key: 'joining_date', label: 'Joining Date', type: 'date'),
      ModuleField(key: 'photo_url', label: 'Photo / Image', type: 'image'),
      ModuleField(key: 'signature_url', label: 'Signature', type: 'image'),
      ModuleField(key: 'address', label: 'Address', type: 'textarea'),
      ModuleField(key: 'location_tracking_enabled', label: 'Location Attendance', type: 'checkbox'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'name', label: 'Employee'),
      ModuleColumn(key: 'role_title', label: 'Role'),
      ModuleColumn(key: 'salary_type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'monthly_salary', label: 'Rate', type: 'currency'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Employees', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Monthly Payroll', type: 'sum', field: 'monthly_salary', prefix: '₹', tone: 'warning'),
    ],
    emptyState: 'Create the employee base before attendance and salary tracking.',
  ),

  ModuleConfig(
    slug: 'attendance', section: 'Teams', title: 'Attendance',
    subtitle: 'Location-ready attendance entries with check-in and check-out.',
    resource: 'attendance',
    fields: [
      ModuleField(key: 'employee_id', label: 'Employee ID', type: 'number', required: true),
      ModuleField(key: 'attendance_date', label: 'Attendance Date', type: 'date', required: true),
      ModuleField(key: 'check_in_at', label: 'Check In', type: 'datetime-local'),
      ModuleField(key: 'check_out_at', label: 'Check Out', type: 'datetime-local'),
      ModuleField(key: 'location_label', label: 'Location', type: 'text'),
      ModuleField(key: 'gps_location', label: 'GPS Location', type: 'gps_location'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: [
        SelectOption('Present', 'present'), SelectOption('Absent', 'absent'),
        SelectOption('Half Day', 'half-day'), SelectOption('Leave', 'leave'),
      ]),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'employee_id', label: 'Employee ID', type: 'number'),
      ModuleColumn(key: 'attendance_date', label: 'Date', type: 'date'),
      ModuleColumn(key: 'location_label', label: 'Location'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [ModuleSummary(label: 'Entries', type: 'count', tone: 'accent')],
    emptyState: 'Log daily attendance to build salary and performance reports.',
  ),

  ModuleConfig(
    slug: 'salary-tracker', section: 'Teams', title: 'Salary Tracker',
    subtitle: 'Monthly payroll with bonus, deductions, and payment state.',
    resource: 'salaries',
    fields: [
      ModuleField(key: 'employee_id', label: 'Employee ID', type: 'number', required: true),
      ModuleField(key: 'month_label', label: 'Month Label', type: 'text', required: true, placeholder: '2026-05'),
      ModuleField(key: 'base_amount', label: 'Base Amount', type: 'number', required: true),
      ModuleField(key: 'bonus_amount', label: 'Bonus', type: 'number'),
      ModuleField(key: 'deduction_amount', label: 'Deduction', type: 'number'),
      ModuleField(key: 'paid_at', label: 'Paid At', type: 'datetime-local'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: [
        SelectOption('Pending', 'pending'), SelectOption('Paid', 'paid'),
        SelectOption('Partially Paid', 'partial'),
      ]),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'employee_id', label: 'Employee ID', type: 'number'),
      ModuleColumn(key: 'month_label', label: 'Month'),
      ModuleColumn(key: 'net_amount', label: 'Net', type: 'currency'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
    ],
    summaries: [
      ModuleSummary(label: 'Payroll Rows', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Net Salary', type: 'sum', field: 'net_amount', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'Add payroll periods to track salary obligations and payouts.',
  ),

  ModuleConfig(
    slug: 'performance', section: 'Teams', title: 'Performance Tracking',
    subtitle: 'Scored reviews, highlights, and concerns for field and office staff.',
    resource: 'performances',
    fields: [
      ModuleField(key: 'employee_id', label: 'Employee ID', type: 'number', required: true),
      ModuleField(key: 'review_period', label: 'Review Period', type: 'text', required: true),
      ModuleField(key: 'score', label: 'Score', type: 'number', required: true),
      ModuleField(key: 'highlights', label: 'Highlights', type: 'textarea'),
      ModuleField(key: 'concerns', label: 'Concerns', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'employee_id', label: 'Employee ID', type: 'number'),
      ModuleColumn(key: 'review_period', label: 'Period'),
      ModuleColumn(key: 'score', label: 'Score', type: 'number'),
    ],
    summaries: [
      ModuleSummary(label: 'Reviews', type: 'count', tone: 'accent'),
    ],
    emptyState: 'Track performance to identify top performers and salary context.',
  ),

  ModuleConfig(
    slug: 'communications', section: 'Communication', title: 'Communication Log',
    subtitle: 'Follow-ups, reminder dates, and festival or confirmation messaging.',
    resource: 'communication-logs',
    fields: [
      ModuleField(key: 'contact_name', label: 'Contact Name', type: 'text', required: true),
      ModuleField(key: 'contact_phone', label: 'Phone', type: 'tel'),
      ModuleField(key: 'contact_email', label: 'Email', type: 'email'),
      ModuleField(key: 'channel', label: 'Channel', type: 'select', options: [
        SelectOption('WhatsApp', 'whatsapp'), SelectOption('Email', 'email'),
        SelectOption('Call', 'call'), SelectOption('SMS', 'sms'),
      ]),
      ModuleField(key: 'subject', label: 'Subject', type: 'text'),
      ModuleField(key: 'body', label: 'Message Body', type: 'textarea', required: true),
      ModuleField(key: 'direction', label: 'Direction', type: 'select', options: [
        SelectOption('Outbound', 'outbound'), SelectOption('Inbound', 'inbound'),
      ]),
      ModuleField(key: 'sent_at', label: 'Sent At', type: 'datetime-local'),
      ModuleField(key: 'follow_up_at', label: 'Follow-up Date', type: 'datetime-local'),
      ModuleField(key: 'status', label: 'Status', type: 'select', options: _activeStatus),
    ],
    columns: [
      ModuleColumn(key: 'contact_name', label: 'Contact'),
      ModuleColumn(key: 'channel', label: 'Channel', type: 'badge'),
      ModuleColumn(key: 'status', label: 'Status', type: 'badge'),
      ModuleColumn(key: 'follow_up_at', label: 'Follow-up', type: 'date'),
    ],
    summaries: [ModuleSummary(label: 'Logs', type: 'count', tone: 'accent')],
    emptyState: 'Track calls, reminders, and campaigns in one history.',
  ),

  ModuleConfig(
    slug: 'finance', section: 'Finance', title: 'Finance & GST',
    subtitle: 'Income, expense, GST on or off, and bill split for monthly reporting.',
    resource: 'finance-entries',
    fields: [
      ModuleField(key: 'project_id', label: 'Project', type: 'project_select', required: true),
      ModuleField(key: 'category', label: 'Category', type: 'text', required: true),
      ModuleField(key: 'entry_type', label: 'Entry Type', type: 'select', required: true, options: [
        SelectOption('Income', 'income'), SelectOption('Expense', 'expense'),
      ]),
      ModuleField(key: 'subcategory', label: 'Subcategory', type: 'text'),
      ModuleField(key: 'description', label: 'Description', type: 'textarea'),
      ModuleField(key: 'amount', label: 'Amount', type: 'number', required: true),
      ModuleField(key: 'gst_enabled', label: 'GST Enabled', type: 'checkbox'),
      ModuleField(key: 'gst_rate', label: 'GST Rate (%)', type: 'number'),
      ModuleField(key: 'bill_type', label: 'Bill Type', type: 'select', options: [
        SelectOption('GST Bill', 'gst'), SelectOption('Non-GST Bill', 'non-gst'),
      ]),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'entry_date', label: 'Entry Date', type: 'date'),
      ModuleField(key: 'reference_no', label: 'Reference No.', type: 'text'),
      ModuleField(key: 'vendor_name', label: 'Vendor / Party', type: 'text'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'entry_type', label: 'Type', type: 'badge'),
      ModuleColumn(key: 'category', label: 'Category'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'bill_type', label: 'Bill', type: 'badge'),
      ModuleColumn(key: 'entry_date', label: 'Date', type: 'date'),
    ],
    summaries: [
      ModuleSummary(label: 'Finance Rows', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Gross Amount', type: 'sum', field: 'amount', prefix: '₹', tone: 'success'),
    ],
    emptyState: 'Start monthly finance reporting with GST-aware entries.',
  ),

  ModuleConfig(
    slug: 'construction', section: 'Sites', title: 'Construction Management',
    subtitle: 'Material, labor, contractor entries for site-wise profitability.',
    resource: 'construction-entries',
    fields: [
      ModuleField(key: 'site_id', label: 'Site ID', type: 'number', required: true),
      ModuleField(key: 'category', label: 'Category', type: 'select', required: true, options: [
        SelectOption('Material', 'material'), SelectOption('Labor', 'labor'),
        SelectOption('Contractor', 'contractor'), SelectOption('Engineer', 'engineer'),
        SelectOption('Other', 'other'), SelectOption('Income', 'income'),
      ]),
      ModuleField(key: 'description', label: 'Description', type: 'textarea', required: true),
      ModuleField(key: 'quantity', label: 'Quantity', type: 'number'),
      ModuleField(key: 'rate', label: 'Rate', type: 'number'),
      ModuleField(key: 'amount', label: 'Amount', type: 'number'),
      ModuleField(key: 'supplier_name', label: 'Supplier / Contractor', type: 'text'),
      ModuleField(key: 'bill_number', label: 'Bill Number', type: 'text'),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode),
      ModuleField(key: 'entry_date', label: 'Entry Date', type: 'date'),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'site_id', label: 'Site ID', type: 'number'),
      ModuleColumn(key: 'category', label: 'Category', type: 'badge'),
      ModuleColumn(key: 'supplier_name', label: 'Supplier'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'entry_date', label: 'Date', type: 'date'),
    ],
    summaries: [
      ModuleSummary(label: 'Site Rows', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Construction Value', type: 'sum', field: 'amount', prefix: '₹', tone: 'warning'),
    ],
    emptyState: 'Capture construction spend and income for cost vs sale reporting.',
  ),

  ModuleConfig(
    slug: 'development-sites', section: 'Sites', title: 'Development Site Control',
    subtitle: 'JCB, tractor, damper, labor, and income activity with work slips.',
    resource: 'development-entries', pdfRoute: 'development-entries',
    fields: [
      ModuleField(key: 'site_name', label: 'Site Name', type: 'text', required: true,
        placeholder: 'Type site name; linked site master created automatically.'),
      ModuleField(key: 'entry_date', label: 'Work Date', type: 'date', required: true),
      ModuleField(key: 'category', label: 'Category', type: 'select', required: true, options: [
        SelectOption('JCB', 'jcb'), SelectOption('Tractor', 'tractor'),
        SelectOption('Damper', 'damper'), SelectOption('Labor', 'labor'),
        SelectOption('Misc', 'misc'), SelectOption('Income', 'income'),
      ]),
      ModuleField(key: 'jcb_number', label: 'JCB Number', type: 'text',
        showWhen: {'category': 'jcb'}),
      ModuleField(key: 'tractor_number', label: 'Tractor Number', type: 'text',
        showWhen: {'category': 'tractor'}),
      ModuleField(key: 'damper_number', label: 'Damper Number', type: 'text',
        showWhen: {'category': 'damper'}),
      ModuleField(key: 'owner_name', label: 'Owner Name', type: 'text',
        showWhen: {'category': ['jcb', 'tractor', 'damper']}),
      ModuleField(key: 'mobile_number', label: 'Mobile Number', type: 'tel',
        showWhen: {'category': ['tractor', 'damper', 'labor']}),
      ModuleField(key: 'rent_type', label: 'Rent Type', type: 'select', options: _tractorRent,
        showWhen: {'category': 'tractor'}),
      ModuleField(key: 'amount_mode', label: 'Amount Mode', type: 'select', options: _damperMode,
        showWhen: {'category': 'damper'}),
      ModuleField(key: 'work_type', label: 'Work Type', type: 'select', options: [
        SelectOption('Soil Transport', 'soil_transport'), SelectOption('Murum', 'murum'),
        SelectOption('Sand', 'sand'), SelectOption('Metal', 'metal'), SelectOption('Debris', 'debris'),
      ], showWhen: {'category': 'damper'}),
      ModuleField(key: 'start_date', label: 'Start Date', type: 'date', showWhen: [
        {'category': 'tractor', 'rent_type': 'daily'},
        {'category': 'damper', 'amount_mode': 'daily'},
        {'category': 'labor'},
      ]),
      ModuleField(key: 'end_date', label: 'End Date', type: 'date', showWhen: [
        {'category': 'tractor', 'rent_type': 'daily'},
        {'category': 'damper', 'amount_mode': 'daily'},
        {'category': 'labor'},
      ]),
      ModuleField(key: 'total_days', label: 'Total Days', type: 'number', readOnly: true, showWhen: [
        {'category': 'tractor', 'rent_type': 'daily'},
        {'category': 'damper', 'amount_mode': 'daily'},
        {'category': 'labor'},
      ]),
      ModuleField(key: 'start_time', label: 'Start Time', type: 'time', showWhen: [
        {'category': 'jcb'},
        {'category': 'tractor', 'rent_type': 'hourly'},
        {'category': 'damper'},
      ]),
      ModuleField(key: 'stop_time', label: 'Stop Time', type: 'time', showWhen: [
        {'category': 'jcb'},
        {'category': 'tractor', 'rent_type': 'hourly'},
        {'category': 'damper'},
      ]),
      ModuleField(key: 'total_hours', label: 'Total Hours', type: 'number', readOnly: true, showWhen: [
        {'category': 'jcb'},
        {'category': 'tractor', 'rent_type': 'hourly'},
        {'category': 'damper', 'amount_mode': 'per_hour'},
      ]),
      ModuleField(key: 'rate_per_hour', label: 'Rate Per Hour', type: 'number', showWhen: [
        {'category': 'jcb'},
        {'category': 'tractor', 'rent_type': 'hourly'},
        {'category': 'damper', 'amount_mode': 'per_hour'},
      ]),
      ModuleField(key: 'rate_per_day', label: 'Rate Per Day', type: 'number', showWhen: [
        {'category': 'tractor', 'rent_type': 'daily'},
        {'category': 'damper', 'amount_mode': 'daily'},
        {'category': 'labor'},
      ]),
      ModuleField(key: 'total_trips', label: 'Total Trips', type: 'number',
        showWhen: {'category': 'damper'}),
      ModuleField(key: 'rate_per_trip', label: 'Rate Per Trip', type: 'number',
        showWhen: {'category': 'damper', 'amount_mode': 'per_trip'}),
      ModuleField(key: 'advance_diesel', label: 'Advance Diesel', type: 'number',
        showWhen: {'category': ['jcb', 'tractor', 'damper']}),
      ModuleField(key: 'amount', label: 'Total Amount', type: 'number', readOnly: true),
      ModuleField(key: 'advance_paid', label: 'Advance Paid', type: 'number',
        showWhen: {'category': ['jcb', 'tractor', 'damper', 'labor']}),
      ModuleField(key: 'remaining_amount', label: 'Remaining Amount', type: 'number', readOnly: true,
        showWhen: {'category': ['jcb', 'tractor', 'damper', 'labor']}),
      ModuleField(key: 'payment_status', label: 'Payment Status', type: 'select', options: _payStatus,
        showWhen: {'category': ['tractor', 'damper', 'labor']}),
      ModuleField(key: 'loading_point', label: 'Loading Point', type: 'text',
        showWhen: {'category': 'damper'}),
      ModuleField(key: 'unloading_point', label: 'Unloading Point', type: 'text',
        showWhen: {'category': 'damper'}),
      ModuleField(key: 'work_location', label: 'Work Location', type: 'text',
        showWhen: {'category': ['jcb', 'tractor', 'damper']}),
      ModuleField(key: 'gps_location', label: 'GPS Location', type: 'gps_location'),
      ModuleField(key: 'work_description', label: 'Work Description', type: 'textarea',
        showWhen: {'category': ['tractor', 'damper']}),
      ModuleField(key: 'working_photo_url', label: 'Working Photo', type: 'image',
        showWhen: {'category': ['jcb', 'tractor', 'damper', 'labor']}),
      ModuleField(key: 'before_photo_url', label: 'Before Photo', type: 'image',
        showWhen: {'category': 'jcb'}),
      ModuleField(key: 'after_photo_url', label: 'After Photo', type: 'image',
        showWhen: {'category': 'jcb'}),
      ModuleField(key: 'signature_url', label: 'Signature', type: 'image',
        showWhen: {'category': ['tractor', 'damper', 'labor']}),
      ModuleField(key: 'labor_name', label: 'Labor Name', type: 'text', required: true,
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'labor_aadhaar_number', label: 'Aadhaar Number (Optional)', type: 'text',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'labor_work_type', label: 'Work Type', type: 'text',
        placeholder: 'Excavation, Filling, Laying, etc.',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'attendance_type', label: 'Attendance System', type: 'select', options: [
        SelectOption('Full Day', 'full_day'), SelectOption('Half Day', 'half_day'),
        SelectOption('Overtime', 'overtime'),
      ], showWhen: {'category': 'labor'}),
      ModuleField(key: 'overtime_charges', label: 'Overtime Charges', type: 'number',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'total_salary', label: 'Total Salary (Auto)', type: 'number', readOnly: true,
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'food_expense', label: 'Food Expense', type: 'number',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'travel_expense', label: 'Travel Expense', type: 'number',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'other_expense', label: 'Other Expense', type: 'number',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'labor_photo_url', label: 'Labor Photo', type: 'image',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'aadhaar_upload_url', label: 'Aadhaar Upload', type: 'image',
        showWhen: {'category': 'labor'}),
      ModuleField(key: 'description', label: 'Description', type: 'textarea',
        showWhen: {'category': ['misc', 'income']}),
      ModuleField(key: 'quantity', label: 'Quantity', type: 'number',
        showWhen: {'category': ['misc', 'income']}),
      ModuleField(key: 'rate', label: 'Rate', type: 'number',
        showWhen: {'category': ['misc', 'income']}),
      ModuleField(key: 'vendor_name', label: 'Vendor', type: 'text',
        showWhen: {'category': ['misc', 'income']}),
      ModuleField(key: 'bill_number', label: 'Bill Number', type: 'text',
        showWhen: {'category': ['misc', 'income']}),
      ModuleField(key: 'payment_mode', label: 'Payment Mode', type: 'select', options: _payMode,
        showWhen: {'category': ['misc', 'income']}),
      ModuleField(key: 'notes', label: 'Notes', type: 'textarea'),
    ],
    columns: [
      ModuleColumn(key: 'site_name', label: 'Site'),
      ModuleColumn(key: 'category', label: 'Category', type: 'badge'),
      ModuleColumn(key: 'owner_name', label: 'Owner'),
      ModuleColumn(key: 'amount', label: 'Amount', type: 'currency'),
      ModuleColumn(key: 'entry_date', label: 'Date', type: 'date'),
    ],
    summaries: [
      ModuleSummary(label: 'Entries', type: 'count', tone: 'accent'),
      ModuleSummary(label: 'Development Value', type: 'sum', field: 'amount', prefix: '₹', tone: 'warning'),
    ],
    emptyState: 'Track machine work, trips, diesel, and balances site by site.',
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
