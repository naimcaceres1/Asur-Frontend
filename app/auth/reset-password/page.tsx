"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
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
const RESET_URL = `${API_BASE}/users/reset-password`;

// --- mismo esquema de contraseña que en cambio de contraseña ---
const passwordSchema = z
  .string()
  .min(8, { message: "Mínimo 8 caracteres." })
  .regex(/[A-Z]/, { message: "Debe tener al menos una letra mayúscula." })
  .regex(/[a-z]/, { message: "Debe tener al menos una letra minúscula." })
  .regex(/[0-9]/, { message: "Debe tener al menos un número." })
  .regex(/[^A-Za-z0-9]/, {
    message: "Debe tener al menos un caracter especial (ej: !@#$%).",
  });

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = (search?.get("token") ?? "").trim();

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange", // 🔥 valida mientras escribe
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setServerError(null);
    setServerMsg(null);

    if (!token) {
      setServerError("Token inválido o faltante.");
      return;
    }

    try {
      const res = await fetch(RESET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, nuevaContrasenia: values.password }),
      });

      if (res.status === 204 || res.ok) {
        setDone(true);
        setServerMsg("¡Listo! Tu contraseña fue actualizada.");
        reset();
      } else {
        const maybeJson = await res.json().catch(() => null);
        setServerError(maybeJson?.message ?? "No se pudo restablecer la contraseña.");
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
                    alt="ASUR Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                  <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
                </div>

                <p className="text-muted-foreground text-center text-balance">
                  Ingresá tu nueva contraseña.
                </p>

                {/* Nueva contraseña */}
                <div className="grid gap-1.5">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        disabled={isSubmitting || done}
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Debe tener al menos 8 caracteres, con mayúsculas, minúsculas, números y caracteres especiales.
                  </p>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      disabled={isSubmitting || done}
                      {...register("confirm")}
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
                  {errors.confirm && (
                    <p className="text-sm text-red-500">{errors.confirm.message}</p>
                  )}
                </div>

                {/* Error global */}
                {serverError && (
                  <p className="text-sm text-red-500">{serverError}</p>
                )}

                <Button
                  variant="asur-blue"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Actualizando..." : "Guardar nueva contraseña"}
                </Button>

                {done && (
                  <div className="space-y-4">
                    <div className="text-sm leading-relaxed bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-neutral-50">
                      {serverMsg}
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        router.push("/auth/login");
                      }}
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
                alt="ASUR Logo"
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
