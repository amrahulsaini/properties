import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { ForgotPasswordScreen } from "@/components/auth/forgot-password-screen";

export const metadata = { title: "Forgot Password" };

export default async function ForgotPasswordPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  }

  return <ForgotPasswordScreen />;
}
