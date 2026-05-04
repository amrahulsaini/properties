import { notFound } from "next/navigation";
import { ModuleScreen } from "@/components/modules/module-screen";
import { getModuleConfig } from "@/lib/modules";

export default async function ModulePage(props: PageProps<"/[module]">) {
  const { module } = await props.params;
  const config = getModuleConfig(module);

  if (!config) {
    notFound();
  }

  return <ModuleScreen slug={config.slug} />;
}
