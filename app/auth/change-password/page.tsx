"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
if (!API_BASE) {
  console.error("Falta NEXT_PUBLIC_API_BASE en .env.local (o en el entorno de despliegue)");
}

const CHANGE_PW_URL = `${API_BASE}/users/change-password`;

// --- Esquema Zod para cambio de contraseña ---
const passwordSchema = z
  .string()
  .min(8, { message: "Mínimo 8 caracteres." })
  .regex(/[A-Z]/, { message: "Debe tener al menos una letra mayúscula." })
  .regex(/[a-z]/, { message: "Debe tener al menos una letra minúscula." })
  .regex(/[0-9]/, { message: "Debe tener al menos un número." })
  .regex(/[^A-Za-z0-9]/, {
    message: "Debe tener al menos un caracter especial (ej: !@#$%).",
  });

const changePasswordSchema = z
  .object({
    currentPw: z
      .string()
      .min(1, { message: "Ingresá tu contraseña actual." }),
    newPw: passwordSchema,
    confirmPw: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPw === data.currentPw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPw"],
        message: "La nueva contraseña debe ser distinta a la actual.",
      });
    }
    if (data.newPw !== data.confirmPw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPw"],
        message: "Las contraseñas nuevas no coinciden.",
      });
    }
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as any)?.userData?.accessToken;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [done, setDone] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange", // 🔥 valida mientras escribe
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setServerError(null);
    setServerMsg(null);

    try {
      const res = await fetch(CHANGE_PW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          contraseniaActual: values.currentPw,
          nuevaContrasenia: values.newPw,
        }),
      });

      if (res.ok) {
        const text = await res.text().catch(() => null);
        setDone(true);
        setServerMsg(text || "Contraseña actualizada correctamente.");
        reset();
      } else {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const json = await res.json().catch(() => null);
          const msg =
            json?.message ||
            json?.error ||
            json?.errors?.[0]?.defaultMessage ||
            "No se pudo cambiar la contraseña.";

          // Por defecto lo enganchamos al campo newPw
          setError("newPw", { type: "server", message: msg });
        } else {
          const text = await res.text().catch(() => null);
          setServerError(text || "No se pudo cambiar la contraseña.");
        }
      }
    } catch (err: any) {
      setServerError(err?.message ?? "Error inesperado.");
    }
  };

  return (
    <div className="bg-slate-300 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center gap-3 text-center">
                  <Image
                    src="/escudo-asur.png"
                    alt="Escudo de ASUR"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                  <h1 className="text-2xl font-bold">Cambiar contraseña</h1>
                </div>

                <p className="text-muted-foreground text-center text-balance">
                  Ingresá tu contraseña actual y la nueva contraseña.
                </p>

                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Por seguridad, al cambiar tu contraseña se cerrará tu sesión actual y deberás volver a iniciar sesión.
                </div>

                {/* Contraseña actual */}
                <div className="grid gap-2">
                  <Label htmlFor="currentPw">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPw"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      disabled={isSubmitting || done}
                      {...register("currentPw")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label={showCurrent ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.currentPw && (
                    <p className="text-sm text-red-500">{errors.currentPw.message}</p>
                  )}
                </div>

                {/* Nueva contraseña */}
                <div className="grid gap-1.5">
                  <div className="grid gap-2">
                    <Label htmlFor="newPw">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPw"
                        type={showNew ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        disabled={isSubmitting || done}
                        {...register("newPw")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        aria-label={showNew ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Debe tener al menos 8 caracteres, con mayúsculas, minúsculas, números y caracteres especiales.
                  </p>
                  {errors.newPw && (
                    <p className="text-sm text-red-500">{errors.newPw.message}</p>
                  )}
                </div>

                {/* Confirmar nueva contraseña */}
                <div className="grid gap-2">
                  <Label htmlFor="confirmPw">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPw"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      disabled={isSubmitting || done}
                      {...register("confirmPw")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPw && (
                    <p className="text-sm text-red-500">{errors.confirmPw.message}</p>
                  )}
                </div>

                {/* Error global de servidor */}
                {serverError && (
                  <p className="text-sm text-red-500">{serverError}</p>
                )}

                <Button
                  variant="asur-blue"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || done}
                >
                  {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
                </Button>

                {done && (
                  <div className="space-y-4">
                    <div className="text-sm leading-relaxed bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-neutral-50">
                      {serverMsg ?? "Contraseña actualizada correctamente."}
                      <br />
                      <span className="font-medium">
                        Por seguridad, tu sesión actual se cerró. Volvé a iniciar sesión con tu nueva contraseña.
                      </span>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() =>
                        signOut({
                          callbackUrl: "/auth/login",
                        })
                      }
                    >
                      Volver a iniciar sesión
                    </Button>
                  </div>
                )}
              </div>
            </form>

            <div className="bg-muted relative hidden md:flex items-center justify-center">
              <Image
                src="/escudo-asur.png"
                alt="Escudo de ASUR"
                width={300}
                height={300}
                className="object-contain"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
