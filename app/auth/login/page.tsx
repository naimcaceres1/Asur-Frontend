import { LoginForm } from "@/components/login-form"
import { GuideInitializer } from "@/lib/drive/GuideInitializer"


export default function LoginPage() {
  return (
    <div className="bg-slate-300 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <GuideInitializer />
        <LoginForm />
      </div>
    </div>
  )
}