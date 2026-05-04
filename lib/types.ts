export type Role = "admin" | "agent" | "accountant" | "engineer";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "password"
  | "number"
  | "select"
  | "textarea"
  | "date"
  | "datetime-local"
  | "checkbox"
  | "image"
  | "file";

export type ColumnType =
  | "text"
  | "currency"
  | "number"
  | "date"
  | "datetime"
  | "badge"
  | "boolean";

export type SummaryTone = "neutral" | "accent" | "success" | "warning";

export type ModuleSlug =
  | "users"
  | "projects"
  | "plots"
  | "transactions"
  | "advance-bookings"
  | "advance-agreements"
  | "agents"
  | "employees"
  | "attendance"
  | "salary-tracker"
  | "performance"
  | "communications"
  | "finance"
  | "construction"
  | "development-sites"
  | "documents"
  | "settings";

export type ResourceName =
  | "users"
  | "projects"
  | "plots"
  | "transactions"
  | "advance-bookings"
  | "advance-agreements"
  | "agents"
  | "employees"
  | "attendance"
  | "salaries"
  | "performances"
  | "communication-logs"
  | "message-templates"
  | "finance-entries"
  | "construction-sites"
  | "construction-entries"
  | "development-sites"
  | "development-entries"
  | "document-folders"
  | "documents"
  | "reminders";

export type PaymentMode = "GPay" | "PhonePe" | "Cash" | "Bank";

export interface SessionUser {
  userId: number;
  name: string;
  email: string;
  role: Role;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface ModuleField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  step?: string;
  placeholder?: string;
  options?: SelectOption[];
  hint?: string;
}

export interface ModuleColumn {
  key: string;
  label: string;
  type?: ColumnType;
}

export interface ModuleSummary {
  label: string;
  type: "count" | "sum" | "unique";
  field?: string;
  prefix?: string;
  suffix?: string;
  tone?: SummaryTone;
}

export interface ModuleConfig {
  slug: ModuleSlug;
  section: string;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  icon: string;
  resource?: ResourceName;
  fields: ModuleField[];
  columns: ModuleColumn[];
  summaries: ModuleSummary[];
  emptyState: string;
}

export type GenericRecord = Record<string, unknown> & { id?: number };
