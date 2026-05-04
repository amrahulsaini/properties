"use client";

import { ResourceWorkspace } from "@/components/modules/resource-workspace";
import { DocumentsWorkspace } from "@/components/modules/documents-workspace";
import { SettingsWorkspace } from "@/components/modules/settings-workspace";
import { getModuleConfig } from "@/lib/modules";

interface ModuleScreenProps {
  slug: string;
}

export function ModuleScreen({ slug }: ModuleScreenProps) {
  if (slug === "documents") {
    return <DocumentsWorkspace />;
  }

  if (slug === "settings") {
    return <SettingsWorkspace />;
  }

  const selectedModule = getModuleConfig(slug);
  if (!selectedModule) {
    return null;
  }

  return <ResourceWorkspace module={selectedModule} />;
}
