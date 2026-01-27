"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
if (!API_BASE) {
  console.error(
    "Falta NEXT_PUBLIC_API_BASE en .env.local (o en el entorno de despliegue)"
  );
}

const FORGOT_URL = `${API_BASE}/users/request-password-reset`;

export function ResetPassRequestForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  const sendRequest = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      const payload: { correo: string } = { correo: email.trim() };

      const res = await fetch(FORGOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await res.json().catch(() => null) : null;

      setServerMsg(
        data?.message ??
          "Si el correo existe, te enviamos un enlace para restablecer la contraseña."
      );
    } catch {
      setServerMsg(
        "Si el correo existe, te enviamos un enlace para restablecer la contraseña."
      );
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  return (
    <div className={className} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              void sendRequest();
            }}
          >
            <div className="flex flex-col gap-6">
              {/* Título */}
              <div className="flex items-center justify-center gap-3 text-center">
                <h1 className="text-2xl font-bold">
                  Recuperación de contraseña
                </h1>
              </div>

              {/* Subtítulo */}
              <p className="text-muted-foreground text-center text-balance">
                Ingresá tu correo y te enviaremos un link para restablecerla.
              </p>

              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">Ingrese su email:</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  className="placeholder:text-gray-300"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || done}
                />
              </div>

              {/* Botón enviar */}
              <Button
                variant="asur-blue"
                type="submit"
                className="w-full"
                disabled={submitting || !email}
              >
                {submitting ? (
                  <>
                    <span
                      role="status"
                      aria-hidden={true}
                      className="mr-2 h-5 w-5 inline-block animate-spin rounded-full border-5 border-gray-100"
                      style={{ borderTopColor: "var(--asur-blue)" }}
                    />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>

              {/* Mensaje + botón volver cuando termina */}
              {done && (
                <div className="space-y-4">
                  <div className="text-sm leading-relaxed bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                    {serverMsg}
                  </div>
                  <Button type="button" className="w-full" onClick={() => {
  router.push("/auth/login");
}}>
                      Volver a iniciar sesión
                    </Button>
                </div>
              )}
            </div>
          </form>

          {/* Columna derecha: logo */}
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
  );
}
