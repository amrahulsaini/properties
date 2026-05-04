import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/login-screen";
import { getServerSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
}
