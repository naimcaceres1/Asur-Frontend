import { RegistrationForm } from "@/components/register-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GuideInitializer } from "@/lib/drive/GuideInitializer";

export default async function RegistroPage() {
  const session = await auth();
  const useRole = (session?.user as any)?.role;


  return (
    <div className="min-h-screen bg-gray-100">
      <GuideInitializer />
      <RegistrationForm currentUserRole={useRole} />
    </div>
  );
}


export const metadata = {
  title: "Registrarse | ASUR",
  description: "Crea tu cuenta en ASUR",
};