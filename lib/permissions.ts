import type { ResourceName, Role } from "@/lib/types";

export type PermissionAction = "read" | "write" | "delete";

const allResources: ResourceName[] = [
  "users",
  "projects",
  "plots",
  "transactions",
  "advance-bookings",
  "advance-agreements",
  "agents",
  "employees",
  "attendance",
  "salaries",
  "performances",
  "communication-logs",
  "message-templates",
  "finance-entries",
  "construction-sites",
  "construction-entries",
  "development-sites",
  "development-entries",
  "document-folders",
  "documents",
  "reminders",
];

const adminPermissions = Object.fromEntries(
  allResources.map((resource) => [resource, ["read", "write", "delete"]]),
) as Record<ResourceName, PermissionAction[]>;

const permissionMatrix: Record<Role, Partial<Record<ResourceName, PermissionAction[]>>> = {
  admin: adminPermissions,
  accountant: {
    projects: ["read"],
    plots: ["read"],
    transactions: ["read", "write"],
    "advance-bookings": ["read", "write"],
    "advance-agreements": ["read", "write"],
    agents: ["read"],
    employees: ["read"],
    attendance: ["read"],
    salaries: ["read", "write"],
    performances: ["read"],
    "communication-logs": ["read", "write"],
    "message-templates": ["read"],
    "finance-entries": ["read", "write"],
    "document-folders": ["read", "write"],
    documents: ["read", "write"],
    reminders: ["read", "write"],
  },
  agent: {
    projects: ["read"],
    plots: ["read", "write"],
    transactions: ["read", "write"],
    "advance-bookings": ["read", "write"],
    "advance-agreements": ["read"],
    agents: ["read"],
    "communication-logs": ["read", "write"],
    "message-templates": ["read"],
    "document-folders": ["read", "write"],
    documents: ["read", "write"],
    reminders: ["read", "write"],
  },
  engineer: {
    projects: ["read"],
    plots: ["read"],
    employees: ["read", "write"],
    attendance: ["read", "write"],
    salaries: ["read"],
    performances: ["read", "write"],
    "finance-entries": ["read"],
    "construction-sites": ["read", "write"],
    "construction-entries": ["read", "write"],
    "development-sites": ["read", "write"],
    "development-entries": ["read", "write"],
    "document-folders": ["read"],
    documents: ["read", "write"],
    reminders: ["read", "write"],
  },
};

export function canAccess(role: Role, resource: ResourceName, action: PermissionAction) {
  const permissions = permissionMatrix[role][resource] ?? [];
  return permissions.includes(action);
}
