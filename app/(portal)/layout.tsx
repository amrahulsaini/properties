import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getServerSession } from "@/lib/auth";

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell user={session}>{children}</AppShell>;
}
