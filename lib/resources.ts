import { hashPassword } from "@/lib/auth";
import { defaultBranding } from "@/lib/brand";
import { execute, queryRows } from "@/lib/db";
import { toNumeric } from "@/lib/format";
import { canAccess, type PermissionAction } from "@/lib/permissions";
import { sendAdvanceBookingNotifications } from "@/lib/services/notifications";
import type { GenericRecord, ResourceName, SessionUser } from "@/lib/types";

type ResourceConfig = {
  table: string;
  orderBy: string;
  writableFields: string[];
  requiredFields?: string[];
  hiddenFields?: string[];
  filterableFields?: string[];
  createTransform?: (
    input: GenericRecord,
    session: SessionUser,
  ) => Promise<GenericRecord> | GenericRecord;
  updateTransform?: (
    input: GenericRecord,
    session: SessionUser,
  ) => Promise<GenericRecord> | GenericRecord;
  afterCreate?: (
    record: GenericRecord,
    session: SessionUser,
  ) => Promise<GenericRecord | void>;
};

export class ResourceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeInput(input: GenericRecord) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (value === "") {
        return [key, null];
      }

      if (value === "true") {
        return [key, true];
      }

      if (value === "false") {
        return [key, false];
      }

      return [key, value];
    }),
  ) as GenericRecord;
}

function pickFields(input: GenericRecord, allowedFields: string[]) {
  return Object.fromEntries(
    Object.entries(input).filter(([key, value]) => allowedFields.includes(key) && value !== undefined),
  ) as GenericRecord;
}

function sanitizeRecord(record: GenericRecord, config: ResourceConfig) {
  const hidden = new Set(config.hiddenFields ?? []);
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !hidden.has(key)),
  ) as GenericRecord;
}

function buildMemoNumber(prefix: string) {
  return `${prefix}-${new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 12)}`;
}

function computeGstAmount(amount: number, gstEnabled: unknown, gstRate: unknown) {
  if (!gstEnabled) {
    return 0;
  }

  return (amount * toNumeric(gstRate || 0)) / 100;
}

function withCreator(input: GenericRecord, session: SessionUser) {
  return {
    ...input,
    created_by: session.userId,
  };
}

const resourceConfigs: Record<ResourceName, ResourceConfig> = {
  users: {
    table: "users",
    orderBy: "created_at DESC",
    writableFields: [
      "full_name",
      "email",
      "phone",
      "role",
      "password",
      "status",
      "avatar_url",
      "signature_url",
    ],
    requiredFields: ["full_name", "email", "role"],
    hiddenFields: ["password_hash"],
    async createTransform(input) {
      if (!input.password) {
        throw new ResourceError("Password is required for new users.");
      }

      return {
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        password_hash: await hashPassword(String(input.password)),
        status: input.status ?? "active",
        avatar_url: input.avatar_url,
        signature_url: input.signature_url,
      };
    },
    async updateTransform(input) {
      const next = {
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        status: input.status ?? "active",
        avatar_url: input.avatar_url,
        signature_url: input.signature_url,
      } as GenericRecord;

      if (input.password) {
        next.password_hash = await hashPassword(String(input.password));
      }

      return next;
    },
  },
  money_transactions: {
    table: "money_transactions",
    orderBy: "date DESC, created_at DESC",
    writableFields: [
      "name",
      "mobile_number",
      "transaction_type",
      "amount",
      "payment_mode",
      "bank_name",
      "account_number",
      "transaction_id",
      "date",
      "due_date",
      "status",
      "reminder_at",
      "description",
      "notes",
    ],
    requiredFields: ["name", "transaction_type", "amount"],
    createTransform(input, session) {
      return withCreator(
        {
          ...input,
          amount: toNumeric(input.amount),
          status: input.status ?? "pending",
          date: input.date ?? new Date().toISOString().slice(0, 10),
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs.money_transactions.createTransform?.(input, session) ?? input;
    },
  },
  projects: {
    table: "projects",
    orderBy: "created_at DESC",
    writableFields: ["name", "code", "type", "village", "location", "status", "notes"],
    requiredFields: ["name", "type"],
  },
  plots: {
    table: "plots",
    orderBy: "created_at DESC",
    writableFields: [
      "project_id",
      "village",
      "survey_number",
      "area_sqft",
      "price",
      "location_text",
      "map_url",
      "status",
      "notes",
      "latitude",
      "longitude",
    ],
    requiredFields: ["village", "survey_number", "area_sqft", "price"],
  },
  transactions: {
    table: "transactions",
    orderBy: "transacted_at DESC, created_at DESC",
    writableFields: [
      "plot_id",
      "project_id",
      "transaction_type",
      "counterparty_name",
      "counterparty_phone",
      "counterparty_email",
      "counterparty_photo_url",
      "counterparty_signature_url",
      "village",
      "survey_number",
      "area_sqft",
      "payment_mode",
      "base_amount",
      "expense_amount",
      "gst_enabled",
      "gst_rate",
      "transacted_at",
      "notes",
    ],
    requiredFields: ["transaction_type", "counterparty_name", "village", "survey_number", "base_amount"],
    createTransform(input, session) {
      const baseAmount = toNumeric(input.base_amount);
      const expenseAmount = toNumeric(input.expense_amount);
      const gstEnabled = Boolean(input.gst_enabled);
      const gstRate = gstEnabled ? toNumeric(input.gst_rate || 0) : 0;
      const gstAmount = computeGstAmount(baseAmount, gstEnabled, gstRate);
      const totalAmount = baseAmount + gstAmount;
      const isSale = input.transaction_type === "sale";

      return withCreator(
        {
          ...input,
          base_amount: baseAmount,
          expense_amount: expenseAmount,
          gst_enabled: gstEnabled,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          profit_loss: isSale ? totalAmount - expenseAmount : expenseAmount - totalAmount,
          transacted_at: input.transacted_at ?? new Date().toISOString().slice(0, 16),
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs.transactions.createTransform?.(input, session) ?? input;
    },
  },
  "advance-bookings": {
    table: "advance_bookings",
    orderBy: "payment_at DESC, created_at DESC",
    writableFields: [
      "plot_id",
      "project_id",
      "customer_name",
      "customer_phone",
      "customer_email",
      "village",
      "survey_number",
      "area_sqft",
      "total_amount",
      "advance_amount",
      "payment_mode",
      "payment_at",
      "customer_signature_url",
      "company_signature_url",
      "gst_enabled",
      "gst_number",
      "notes",
    ],
    requiredFields: [
      "customer_name",
      "village",
      "survey_number",
      "total_amount",
      "advance_amount",
    ],
    createTransform(input, session) {
      const totalAmount = toNumeric(input.total_amount);
      const advanceAmount = toNumeric(input.advance_amount);

      return withCreator(
        {
          ...input,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          remaining_amount: totalAmount - advanceAmount,
          payment_at: input.payment_at ?? new Date().toISOString().slice(0, 16),
          memo_number: buildMemoNumber("ABM"),
          message_status: "pending",
          status: "confirmed",
          gst_enabled: Boolean(input.gst_enabled),
          gst_number: input.gst_number ?? defaultBranding.gstin,
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs["advance-bookings"].createTransform?.(input, session) ?? input;
    },
    async afterCreate(record, session) {
      const notifications = await sendAdvanceBookingNotifications({
        customerName: String(record.customer_name ?? ""),
        customerPhone: String(record.customer_phone ?? ""),
        customerEmail: String(record.customer_email ?? ""),
        village: String(record.village ?? ""),
        surveyNumber: String(record.survey_number ?? ""),
        area: `${record.area_sqft ?? 0} sq.ft.`,
        totalAmount: toNumeric(record.total_amount),
        advanceAmount: toNumeric(record.advance_amount),
        remainingAmount: toNumeric(record.remaining_amount),
        paymentAt: String(record.payment_at ?? new Date().toISOString()),
      });

      await execute("UPDATE advance_bookings SET message_status = ? WHERE id = ?", [
        notifications.email === "sent" || notifications.whatsapp === "sent"
          ? "sent"
          : "queued",
        Number(record.id ?? 0),
      ]);

      await execute(
        `INSERT INTO communication_logs
          (related_type, related_id, contact_name, contact_phone, contact_email, channel, style, subject, body, direction, sent_at, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "advance-booking",
          Number(record.id ?? 0),
          String(record.customer_name ?? ""),
          String(record.customer_phone ?? ""),
          String(record.customer_email ?? ""),
          notifications.whatsapp === "sent" ? "whatsapp" : "email",
          "professional",
          notifications.subject,
          notifications.body,
          "outbound",
          new Date(),
          notifications.email === "sent" || notifications.whatsapp === "sent"
            ? "sent"
            : "queued",
          session.userId,
        ],
      );

      return getResourceById("advance-bookings", Number(record.id));
    },
  },
  "advance-agreements": {
    table: "advance_agreements",
    orderBy: "agreement_at DESC, created_at DESC",
    writableFields: [
      "plot_id",
      "project_id",
      "owner_name",
      "owner_phone",
      "owner_email",
      "village",
      "survey_number",
      "area_sqft",
      "total_amount",
      "paid_amount",
      "gst_enabled",
      "gst_number",
      "owner_photo_url",
      "owner_signature_url",
      "company_signature_url",
      "gst_rate",
      "gst_amount",
      "payment_mode",
      "refundable",
      "agreement_duration_days",
      "conditions_text",
      "inspection_rights",
      "agreement_at",
      "notes",
    ],
    requiredFields: ["owner_name", "village", "survey_number", "total_amount", "paid_amount"],
    createTransform(input, session) {
      const totalAmount = toNumeric(input.total_amount);
      const paidAmount = toNumeric(input.paid_amount);
      const gstEnabled = Boolean(input.gst_enabled);
      const gstRate = gstEnabled ? toNumeric(input.gst_rate || 0) : 0;
      const gstAmount = computeGstAmount(totalAmount, gstEnabled, gstRate);

      return withCreator(
        {
          ...input,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          remaining_amount: totalAmount - paidAmount,
          refundable: Boolean(input.refundable),
          agreement_duration_days: toNumeric(input.agreement_duration_days),
          agreement_at: input.agreement_at ?? new Date().toISOString().slice(0, 16),
          gst_enabled: gstEnabled,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total_with_gst: totalAmount + gstAmount,
          status: "active",
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs["advance-agreements"].createTransform?.(input, session) ?? input;
    },
  },
  agents: {
    table: "agents",
    orderBy: "created_at DESC",
    writableFields: [
      "user_id",
      "name",
      "phone",
      "email",
      "photo_url",
      "signature_url",
      "bank_name",
      "account_number",
      "ifsc_code",
      "upi_id",
      "commission_percent",
      "commission_fixed",
      "address",
      "status",
    ],
    requiredFields: ["name"],
  },
  employees: {
    table: "employees",
    orderBy: "created_at DESC",
    writableFields: [
      "user_id",
      "name",
      "role_title",
      "phone",
      "email",
      "salary_type",
      "monthly_salary",
      "joining_date",
      "photo_url",
      "signature_url",
      "address",
      "location_tracking_enabled",
      "status",
    ],
    requiredFields: ["name", "role_title"],
    createTransform(input, session) {
      return withCreator(
        {
          ...input,
          location_tracking_enabled: Boolean(input.location_tracking_enabled),
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs.employees.createTransform?.(input, session) ?? input;
    },
  },
  attendance: {
    table: "attendance_entries",
    orderBy: "attendance_date DESC, created_at DESC",
    writableFields: [
      "employee_id",
      "attendance_date",
      "check_in_at",
      "check_out_at",
      "location_label",
      "latitude",
      "longitude",
      "status",
      "notes",
    ],
    requiredFields: ["employee_id", "attendance_date"],
  },
  salaries: {
    table: "salary_entries",
    orderBy: "created_at DESC",
    writableFields: [
      "employee_id",
      "month_label",
      "base_amount",
      "bonus_amount",
      "deduction_amount",
      "net_amount",
      "paid_at",
      "status",
      "notes",
    ],
    requiredFields: ["employee_id", "month_label", "base_amount"],
    createTransform(input, session) {
      const base = toNumeric(input.base_amount);
      const bonus = toNumeric(input.bonus_amount);
      const deduction = toNumeric(input.deduction_amount);

      return withCreator(
        {
          ...input,
          base_amount: base,
          bonus_amount: bonus,
          deduction_amount: deduction,
          net_amount: base + bonus - deduction,
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs.salaries.createTransform?.(input, session) ?? input;
    },
  },
  performances: {
    table: "performance_entries",
    orderBy: "created_at DESC",
    writableFields: ["employee_id", "review_period", "score", "highlights", "concerns"],
    requiredFields: ["employee_id", "review_period", "score"],
    createTransform(input, session) {
      return withCreator(input, session);
    },
    updateTransform(input, session) {
      return resourceConfigs.performances.createTransform?.(input, session) ?? input;
    },
  },
  "communication-logs": {
    table: "communication_logs",
    orderBy: "created_at DESC",
    writableFields: [
      "related_type",
      "related_id",
      "contact_name",
      "contact_phone",
      "contact_email",
      "channel",
      "style",
      "subject",
      "body",
      "direction",
      "sent_at",
      "follow_up_at",
      "reminder_at",
      "status",
    ],
    requiredFields: ["contact_name", "body"],
    createTransform(input, session) {
      return withCreator(
        {
          ...input,
          sent_at: input.sent_at ?? new Date().toISOString().slice(0, 16),
          status: input.status ?? "active",
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs["communication-logs"].createTransform?.(input, session) ?? input;
    },
  },
  "message-templates": {
    table: "message_templates",
    orderBy: "created_at DESC",
    writableFields: [
      "title",
      "occasion",
      "channel",
      "style",
      "language",
      "subject_template",
      "body_template",
      "is_active",
    ],
    requiredFields: ["title", "channel", "style", "body_template"],
  },
  "finance-entries": {
    table: "finance_entries",
    orderBy: "entry_date DESC, created_at DESC",
    writableFields: [
      "project_id",
      "category",
      "entry_type",
      "subcategory",
      "description",
      "amount",
      "gst_enabled",
      "gst_rate",
      "bill_type",
      "payment_mode",
      "entry_date",
      "reference_no",
      "vendor_name",
      "notes",
    ],
    requiredFields: ["category", "entry_type", "amount"],
    createTransform(input, session) {
      const amount = toNumeric(input.amount);
      const gstEnabled = Boolean(input.gst_enabled);
      const gstRate = gstEnabled ? toNumeric(input.gst_rate || 0) : 0;

      return withCreator(
        {
          ...input,
          amount,
          gst_enabled: gstEnabled,
          gst_rate: gstRate,
          gst_amount: computeGstAmount(amount, gstEnabled, gstRate),
          bill_type: input.bill_type ?? (gstEnabled ? "gst" : "non-gst"),
          entry_date: input.entry_date ?? new Date().toISOString().slice(0, 10),
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs["finance-entries"].createTransform?.(input, session) ?? input;
    },
  },
  "construction-sites": {
    table: "construction_sites",
    orderBy: "created_at DESC",
    writableFields: ["project_id", "name", "location", "engineer_name", "status", "start_date", "end_date", "notes"],
    requiredFields: ["name"],
  },
  "construction-entries": {
    table: "construction_entries",
    orderBy: "entry_date DESC, created_at DESC",
    writableFields: [
      "site_id",
      "category",
      "description",
      "quantity",
      "rate",
      "amount",
      "supplier_name",
      "bill_number",
      "payment_mode",
      "entry_date",
      "notes",
    ],
    requiredFields: ["site_id", "category", "description"],
    createTransform(input, session) {
      const quantity = toNumeric(input.quantity);
      const rate = toNumeric(input.rate);
      const amount = toNumeric(input.amount) || quantity * rate;

      return withCreator(
        {
          ...input,
          quantity,
          rate,
          amount,
          entry_date: input.entry_date ?? new Date().toISOString().slice(0, 10),
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs["construction-entries"].createTransform?.(input, session) ?? input;
    },
  },
  "development-sites": {
    table: "development_sites",
    orderBy: "created_at DESC",
    writableFields: ["project_id", "name", "location", "status", "notes"],
    requiredFields: ["name"],
  },
  "development-entries": {
    table: "development_entries",
    orderBy: "entry_date DESC, created_at DESC",
    writableFields: [
      "site_id",
      "work_type",
      "category",
      "description",
      "quantity",
      "rate",
      "amount",
      "vendor_name",
      "bill_number",
      "payment_mode",
      "entry_date",
      "notes",
    ],
    requiredFields: ["site_id", "work_type", "category", "description"],
    createTransform(input, session) {
      const quantity = toNumeric(input.quantity);
      const rate = toNumeric(input.rate);
      const amount = toNumeric(input.amount) || quantity * rate;

      return withCreator(
        {
          ...input,
          quantity,
          rate,
          amount,
          entry_date: input.entry_date ?? new Date().toISOString().slice(0, 10),
        },
        session,
      );
    },
    updateTransform(input, session) {
      return resourceConfigs["development-entries"].createTransform?.(input, session) ?? input;
    },
  },
  "document-folders": {
    table: "document_folders",
    orderBy: "created_at DESC",
    writableFields: ["client_name", "client_type", "project_id", "notes"],
    requiredFields: ["client_name"],
    createTransform(input, session) {
      return withCreator(input, session);
    },
    updateTransform(input, session) {
      return resourceConfigs["document-folders"].createTransform?.(input, session) ?? input;
    },
  },
  documents: {
    table: "documents",
    orderBy: "uploaded_at DESC",
    writableFields: [
      "folder_id",
      "title",
      "document_type",
      "file_name",
      "file_path",
      "mime_type",
      "file_size",
      "uploaded_by",
    ],
    requiredFields: ["folder_id", "title", "file_name", "file_path"],
    createTransform(input, session) {
      return {
        ...input,
        uploaded_by: session.userId,
      };
    },
    updateTransform(input, session) {
      return {
        ...input,
        uploaded_by: session.userId,
      };
    },
  },
  reminders: {
    table: "reminders",
    orderBy: "remind_at ASC",
    writableFields: ["title", "related_type", "related_id", "remind_at", "status", "notes"],
    requiredFields: ["title", "remind_at"],
    createTransform(input, session) {
      return withCreator(input, session);
    },
    updateTransform(input, session) {
      return resourceConfigs.reminders.createTransform?.(input, session) ?? input;
    },
  },
};

export function getResourceConfig(resource: string) {
  const config = resourceConfigs[resource as ResourceName];
  if (!config) {
    throw new ResourceError(`Unknown resource: ${resource}`, 404);
  }

  return config;
}

export function assertResourceAccess(
  session: SessionUser | null,
  resource: string,
  action: PermissionAction,
) {
  if (!session) {
    throw new ResourceError("Authentication required.", 401);
  }

  const typedResource = resource as ResourceName;
  getResourceConfig(typedResource);

  if (!canAccess(session.role, typedResource, action)) {
    throw new ResourceError("You do not have permission for this action.", 403);
  }
}

export async function listResource(resource: string, searchParams?: URLSearchParams) {
  const typedResource = resource as ResourceName;
  const config = getResourceConfig(typedResource);
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  const limit = Number(searchParams?.get("limit") ?? 100);

  for (const field of config.filterableFields ?? []) {
    const value = searchParams?.get(field);
    if (value) {
      whereClauses.push(`${field} = ?`);
      values.push(value);
    }
  }

  const sql = `SELECT * FROM ${config.table}${
    whereClauses.length ? ` WHERE ${whereClauses.join(" AND ")}` : ""
  } ORDER BY ${config.orderBy} LIMIT ?`;

  const rows = await queryRows<GenericRecord>(sql, [...values, limit]);
  return rows.map((row) => sanitizeRecord(row, config));
}

export async function getResourceById(resource: string, id: number) {
  const typedResource = resource as ResourceName;
  const config = getResourceConfig(typedResource);
  const rows = await queryRows<GenericRecord>(
    `SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`,
    [id],
  );

  const row = rows[0];
  if (!row) {
    throw new ResourceError("Record not found.", 404);
  }

  return sanitizeRecord(row, config);
}

export async function createResource(
  resource: string,
  payload: GenericRecord,
  session: SessionUser,
) {
  const typedResource = resource as ResourceName;
  const config = getResourceConfig(typedResource);
  const cleaned = pickFields(normalizeInput(payload), config.writableFields);

  for (const field of config.requiredFields ?? []) {
    if (cleaned[field] === undefined || cleaned[field] === null) {
      throw new ResourceError(`Missing required field: ${field}`);
    }
  }

  const transformed = config.createTransform
    ? await config.createTransform(cleaned, session)
    : cleaned;
  const record = Object.fromEntries(
    Object.entries(transformed).filter(([, value]) => value !== undefined),
  ) as GenericRecord;
  const columns = Object.keys(record);

  if (!columns.length) {
    throw new ResourceError("No writable fields were provided.");
  }

  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((column) => record[column]);

  const result = await execute(
    `INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  let created = await getResourceById(resource, result.insertId);

  if (config.afterCreate) {
    const next = await config.afterCreate(created, session);
    if (next) {
      created = next;
    }
  }

  return created;
}

export async function updateResource(
  resource: string,
  id: number,
  payload: GenericRecord,
  session: SessionUser,
) {
  const typedResource = resource as ResourceName;
  const config = getResourceConfig(typedResource);
  const cleaned = pickFields(normalizeInput(payload), config.writableFields);
  const transformed = config.updateTransform
    ? await config.updateTransform(cleaned, session)
    : cleaned;
  const record = Object.fromEntries(
    Object.entries(transformed).filter(([, value]) => value !== undefined),
  ) as GenericRecord;
  const columns = Object.keys(record);

  if (!columns.length) {
    throw new ResourceError("No writable fields were provided.");
  }

  const assignments = columns.map((column) => `${column} = ?`).join(", ");
  const values = columns.map((column) => record[column]);

  await execute(`UPDATE ${config.table} SET ${assignments} WHERE id = ?`, [...values, id]);
  return getResourceById(resource, id);
}

export async function deleteResource(resource: string, id: number) {
  const typedResource = resource as ResourceName;
  const config = getResourceConfig(typedResource);

  await execute(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
  return { success: true, id, table: config.table };
}
