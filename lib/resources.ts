import { hashPassword } from "@/lib/auth";
import { defaultBranding } from "@/lib/brand";
import { execute, queryRows } from "@/lib/db";
import { applyDevelopmentEntryComputedValues } from "@/lib/development-entries";
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
  hydrateRecord?: (record: GenericRecord) => Promise<GenericRecord> | GenericRecord;
  hydrateList?: (records: GenericRecord[]) => Promise<GenericRecord[]> | GenericRecord[];
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

function asTrimmedString(value: unknown) {
  return String(value ?? "").trim();
}

function buildDocumentFolderLabel(record: GenericRecord) {
  const plotNumber = asTrimmedString(record.plot_number);
  const buyerName = asTrimmedString(record.buyer_name ?? record.client_name);
  const parts = [
    plotNumber ? `Plot-${plotNumber}` : "",
    buyerName ? `Buyer-${buyerName}` : "",
  ].filter(Boolean);

  return parts.join(" / ");
}

function buildDocumentFolderRecord(input: GenericRecord) {
  const buyerName = asTrimmedString(input.buyer_name ?? input.client_name);

  return {
    ...input,
    buyer_name: buyerName,
    client_name: buyerName,
    client_type: asTrimmedString(input.client_type) || "buyer",
    folder_label: buildDocumentFolderLabel({
      ...input,
      buyer_name: buyerName,
      client_name: buyerName,
    }),
    print_layout: asTrimmedString(input.print_layout) || "a4",
    aadhaar_layout: asTrimmedString(input.aadhaar_layout) || "single-page",
    page_orientation: asTrimmedString(input.page_orientation) || "portrait",
    dpi_quality: asTrimmedString(input.dpi_quality) || "standard",
    color_mode: asTrimmedString(input.color_mode) || "color",
    export_type: asTrimmedString(input.export_type) || "pdf",
    admin_lock: Boolean(input.admin_lock),
    is_hidden: Boolean(input.is_hidden),
  } satisfies GenericRecord;
}

async function hydrateDevelopmentEntries(records: GenericRecord[]) {
  const siteIds = Array.from(
    new Set(
      records
        .map((record) => Number(record.site_id ?? 0))
        .filter((siteId) => siteId > 0),
    ),
  );

  if (!siteIds.length) {
    return records;
  }

  const placeholders = siteIds.map(() => "?").join(", ");
  const sites = await queryRows<{ id: number; name: string | null }>(
    `SELECT id, name FROM development_sites WHERE id IN (${placeholders})`,
    siteIds,
  );
  const siteNameMap = new Map(
    sites.map((site) => [Number(site.id), asTrimmedString(site.name)]),
  );

  return records.map((record) => ({
    ...record,
    site_name: siteNameMap.get(Number(record.site_id ?? 0)) ?? "",
  }));
}

async function hydrateDocuments(records: GenericRecord[]) {
  const folderIds = Array.from(
    new Set(
      records
        .map((record) => Number(record.folder_id ?? 0))
        .filter((folderId) => folderId > 0),
    ),
  );

  if (!folderIds.length) {
    return records;
  }

  const placeholders = folderIds.map(() => "?").join(", ");
  const folders = await queryRows<{
    id: number;
    folder_code: string | null;
    folder_label: string | null;
    plot_number: string | null;
    buyer_name: string | null;
  }>(
    `SELECT id, folder_code, folder_label, plot_number, buyer_name
     FROM document_folders
     WHERE id IN (${placeholders})`,
    folderIds,
  );
  const folderMap = new Map(
    folders.map((folder) => [
      Number(folder.id),
      {
        folder_code: asTrimmedString(folder.folder_code),
        folder_label:
          asTrimmedString(folder.folder_label) ||
          buildDocumentFolderLabel(folder as unknown as GenericRecord),
      },
    ]),
  );

  return records.map((record) => {
    const folder = folderMap.get(Number(record.folder_id ?? 0));
    return {
      ...record,
      folder_code: folder?.folder_code ?? "",
      folder_label: folder?.folder_label ?? "",
    };
  });
}

async function resolveDevelopmentSiteId(siteName: string, input: GenericRecord) {
  const existing = await queryRows<{ id: number }>(
    "SELECT id FROM development_sites WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [siteName],
  );

  if (existing[0]?.id) {
    const siteId = Number(existing[0].id);
    const location = asTrimmedString(input.work_location);

    if (location) {
      await execute(
        `UPDATE development_sites
         SET location = COALESCE(NULLIF(location, ''), ?)
         WHERE id = ?`,
        [location, siteId],
      );
    }

    return siteId;
  }

  const result = await execute(
    `INSERT INTO development_sites (name, location, status, notes)
     VALUES (?, ?, 'active', ?)`,
    [
      siteName,
      asTrimmedString(input.work_location) || null,
      asTrimmedString(input.notes) || null,
    ],
  );

  return result.insertId;
}

function requireNonEmpty(value: unknown, label: string) {
  if (!asTrimmedString(value)) {
    throw new ResourceError(`${label} is required.`);
  }
}

function validateDevelopmentEntry(input: GenericRecord) {
  const category = asTrimmedString(input.category).toLowerCase();
  requireNonEmpty(input.site_name, "Site name");
  requireNonEmpty(category, "Category");

  if (category === "jcb") {
    requireNonEmpty(input.jcb_number, "JCB number");
    requireNonEmpty(input.owner_name, "Owner name");
    requireNonEmpty(input.start_time, "Start time");
    requireNonEmpty(input.stop_time, "Stop time");
    requireNonEmpty(input.work_location, "Work location");
    if (toNumeric(input.rate_per_hour) <= 0) {
      throw new ResourceError("Rate per hour must be greater than 0.");
    }
  }

  if (category === "tractor") {
    requireNonEmpty(input.tractor_number, "Tractor number");
    requireNonEmpty(input.owner_name, "Tractor owner name");
    requireNonEmpty(input.mobile_number, "Mobile number");
    requireNonEmpty(input.rent_type, "Rent type");
    requireNonEmpty(input.work_location, "Work location");

    if (asTrimmedString(input.rent_type) === "daily") {
      requireNonEmpty(input.start_date, "Start date");
      requireNonEmpty(input.end_date, "End date");
      if (toNumeric(input.rate_per_day) <= 0) {
        throw new ResourceError("Rate per day must be greater than 0.");
      }
    } else {
      requireNonEmpty(input.start_time, "Start time");
      requireNonEmpty(input.stop_time, "Stop time");
      if (toNumeric(input.rate_per_hour) <= 0) {
        throw new ResourceError("Rate per hour must be greater than 0.");
      }
    }
  }

  if (category === "damper") {
    requireNonEmpty(input.damper_number, "Damper number");
    requireNonEmpty(input.owner_name, "Owner name");
    requireNonEmpty(input.mobile_number, "Mobile number");
    requireNonEmpty(input.amount_mode, "Rent type");
    requireNonEmpty(input.work_type, "Work type");
    requireNonEmpty(input.work_location, "Site location");

    if (asTrimmedString(input.amount_mode) === "per_trip") {
      if (toNumeric(input.rate_per_trip) <= 0) {
        throw new ResourceError("Rate per trip must be greater than 0.");
      }
      if (toNumeric(input.total_trips) <= 0) {
        throw new ResourceError("Total trips must be greater than 0.");
      }
    }

    if (asTrimmedString(input.amount_mode) === "per_hour") {
      requireNonEmpty(input.start_time, "Start time");
      requireNonEmpty(input.stop_time, "Stop time");
      if (toNumeric(input.rate_per_hour) <= 0) {
        throw new ResourceError("Rate per hour must be greater than 0.");
      }
    }

    if (asTrimmedString(input.amount_mode) === "daily") {
      requireNonEmpty(input.start_date, "Start date");
      requireNonEmpty(input.end_date, "End date");
      if (toNumeric(input.rate_per_day) <= 0) {
        throw new ResourceError("Rate per day must be greater than 0.");
      }
    }
  }
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
      "seller_name",
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
      "site_name",
      "site_id",
      "category",
      "jcb_number",
      "tractor_number",
      "damper_number",
      "owner_name",
      "driver_name",
      "mobile_number",
      "rent_type",
      "amount_mode",
      "start_date",
      "end_date",
      "start_time",
      "stop_time",
      "total_days",
      "total_hours",
      "total_trips",
      "rate_per_day",
      "rate_per_hour",
      "rate_per_trip",
      "advance_diesel",
      "diesel_given",
      "diesel_cost",
      "advance_paid",
      "remaining_amount",
      "payment_status",
      "work_type",
      "construction_material",
      "work_location",
      "gps_location",
      "loading_point",
      "unloading_point",
      "work_description",
      "working_photo_url",
      "before_photo_url",
      "after_photo_url",
      "signature_url",
      "description",
      "quantity",
      "rate",
      "amount",
      "vendor_name",
      "bill_number",
      "payment_mode",
      "entry_date",
      "notes",
      // Labor-specific fields
      "labor_name",
      "labor_aadhaar_number",
      "labor_work_type",
      "attendance_type",
      "overtime_charges",
      "total_salary",
      "food_expense",
      "travel_expense",
      "other_expense",
      "labor_photo_url",
      "aadhaar_upload_url",
    ],
    requiredFields: ["site_name", "category"],
    async createTransform(input, session) {
      const computed = applyDevelopmentEntryComputedValues(input);
      validateDevelopmentEntry(computed);

      const siteName = asTrimmedString(computed.site_name);
      const siteId = await resolveDevelopmentSiteId(siteName, computed);
      const persistable = { ...computed };
      delete persistable.site_name;

      return withCreator(
        {
          ...persistable,
          site_id: siteId,
          work_type: asTrimmedString(computed.work_type) || asTrimmedString(computed.category),
          vendor_name: asTrimmedString(computed.vendor_name) || asTrimmedString(computed.owner_name),
        },
        session,
      );
    },
    async updateTransform(input, session) {
      return resourceConfigs["development-entries"].createTransform?.(input, session) ?? input;
    },
    hydrateList(records) {
      return hydrateDevelopmentEntries(records);
    },
    hydrateRecord(record) {
      return hydrateDevelopmentEntries([record]).then((records) => records[0] ?? record);
    },
  },
  "document-folders": {
    table: "document_folders",
    orderBy: "created_at DESC",
    writableFields: [
      "client_name",
      "client_type",
      "project_id",
      "folder_code",
      "folder_label",
      "plot_number",
      "buyer_name",
      "buyer_mobile_number",
      "buyer_aadhaar_number",
      "buyer_pan_number",
      "seller_name",
      "seller_mobile_number",
      "seller_aadhaar_number",
      "seller_pan_number",
      "witness_1_name",
      "witness_1_aadhaar_number",
      "witness_1_pan_number",
      "witness_2_name",
      "witness_2_aadhaar_number",
      "witness_2_pan_number",
      "identifier_name",
      "identifier_mobile_number",
      "identifier_aadhaar_number",
      "identifier_pan_number",
      "identifier_2_name",
      "identifier_2_aadhaar_number",
      "identifier_2_pan_number",
      "print_layout",
      "aadhaar_layout",
      "page_orientation",
      "dpi_quality",
      "color_mode",
      "export_type",
      "admin_lock",
      "is_hidden",
      "notes",
    ],
    requiredFields: ["project_id", "plot_number", "buyer_name"],
    createTransform(input, session) {
      return withCreator(buildDocumentFolderRecord(input), session);
    },
    updateTransform(input, session) {
      return resourceConfigs["document-folders"].createTransform?.(input, session) ?? input;
    },
    async afterCreate(record) {
      const id = Number(record.id ?? 0);
      const code = `DAST-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
      await execute(
        "UPDATE document_folders SET folder_code = ? WHERE id = ?",
        [code, id],
      );
      return getResourceById("document-folders", id);
    },
  },
  documents: {
    table: "documents",
    orderBy: "uploaded_at DESC",
    writableFields: [
      "folder_id",
      "section",
      "party_name",
      "sort_order",
      "title",
      "document_type",
      "file_name",
      "file_path",
      "mime_type",
      "file_size",
      "uploaded_by",
    ],
    requiredFields: ["folder_id", "title", "file_name", "file_path"],
    filterableFields: ["folder_id", "section", "document_type"],
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
    hydrateList(records) {
      return hydrateDocuments(records);
    },
    hydrateRecord(record) {
      return hydrateDocuments([record]).then((records) => records[0] ?? record);
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
  const sanitized = rows.map((row) => sanitizeRecord(row, config));

  if (config.hydrateList) {
    return config.hydrateList(sanitized);
  }

  if (config.hydrateRecord) {
    return Promise.all(sanitized.map((row) => config.hydrateRecord!(row)));
  }

  return sanitized;
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

  const sanitized = sanitizeRecord(row, config);

  if (config.hydrateRecord) {
    return config.hydrateRecord(sanitized);
  }

  if (config.hydrateList) {
    const hydrated = await config.hydrateList([sanitized]);
    return hydrated[0] ?? sanitized;
  }

  return sanitized;
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
