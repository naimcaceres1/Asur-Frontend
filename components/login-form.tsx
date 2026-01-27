"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPublicPost } from "@/helpers/api-public";

const ERROR_MAP: Record<string, string> = {
  CredentialsSignin: "Usuario o contraseña incorrectos",
  AccessDenied: "Acceso denegado",
  Configuration: "Error de configuración del servidor",
  Default: "No pudimos iniciar sesión. Intentá de nuevo.",
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();


  useEffect(() => {
    const error = searchParams.get("error");
    if (error && error !== "CredentialsSignin") {
      const message = ERROR_MAP[error] || ERROR_MAP.Default;

      toast.error("Error de autenticación", {
        description: message,
        duration: 3000,
        position: "top-center",
      });

      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const passwordInput = e.currentTarget.elements.namedItem(
      "password"
    ) as HTMLInputElement;

    let loginSuccess = false;
    
    try {
      await apiPublicPost("/users/login", {
        username: email,
        password: password,
      });
      loginSuccess = true;
    } catch (error: any) {
      console.log("Error de login:", error);
      
      const errorMessage = error.message || ERROR_MAP.Default;

      if (passwordInput) passwordInput.value = "";

      setSubmitting(false);

      toast.error("Error al iniciar sesión", {
        description: errorMessage,
        duration: 4000,
        position: "top-center",
      });

      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    //console.log(">>> signIn result:", result);

    if (result?.error) {
      const errorMessage = ERROR_MAP[result.error] || ERROR_MAP.Default;

      if (passwordInput) passwordInput.value = "";

      setSubmitting(false);

      toast.error("Error al iniciar sesión", {
        description: errorMessage,
        duration: 4000,
        position: "top-center",
      });

      return;
    }

    if (result?.ok) {
      toast.success("¡Bienvenido!", {
        description: "Sesión iniciada correctamente",
        duration: 2000,
        position: "top-center",
      });

      setTimeout(() => {
        router.push("/dashboard/main");
      }, 1000);

      setSubmitting(false);
      return;
    }

    toast.error("Error inesperado", {
      description: ERROR_MAP.Default,
      duration: 4000,
      position: "top-center",
    });
    setSubmitting(false);
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`Iniciando sesión con ${provider}`, {
      description: "Serás redirigido al proveedor...",
      duration: 2000,
      position: "top-center",
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Bienvenidos a ASUR</h1>
                <p className="text-muted-foreground text-balance">
                  Inicia sesión en tu cuenta de ASUR
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  className="placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/reset-pass-request"
                    className="ml-auto text-slate-400 text-[12px] underline-offset-2 hover:underline"
                    prefetch={false}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                variant="asur-blue"
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Continuar con
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    handleSocialLogin("Google");
                    signIn("google", { callbackUrl: "/dashboard/main" });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Google</span>
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    handleSocialLogin("Facebook");
                    signIn("facebook", { callbackUrl: "/dashboard/main" });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Facebook</span>
                </Button>
              </div>

              <div className="text-center text-sm">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/auth/new-account"
                  className="underline underline-offset-4"
                >
                  Regístrate
                </Link>{" "}
                o{" "}
                <Link
                  href="/dashboard/invite"
                  className="underline underline-offset-4"
                >
                  Ingresa como invitado
                </Link>
              </div>
            </div>
          </form>

          <div className="bg-muted relative hidden md:flex items-center justify-center">
            <Image
              src="/escudo-asur.png"
              alt="ASUR Logo"
              width={300}
              height={300}
              className="object-contain"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        <Link className="text-slate-500" href="#">
          Terms of Service
        </Link>{" "}
        &{" "}
        <Link className="text-slate-500" href="#">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}