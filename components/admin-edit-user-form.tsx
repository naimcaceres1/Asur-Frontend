// components/admin-edit-user-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar1Icon,
  PlusCircleIcon,
  XCircleIcon,
  Loader2,
  ArrowLeftCircleIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Usuario } from "@/interfaces/main-interfaces";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// ID del perfil Socio (por si lo usás luego)
const SOCIO_PERFIL_ID = 3;

export type PerfilOption = {
  idPerfil: number;
  nomPerfil: string;
  descripcion?: string | null;
  estado: boolean;
};

// Validaciones básicas
const reSoloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const reCalle = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,\/-]+$/;
const reTelStrict = /^\+?\d{6,20}$/;
const maxDate = new Date();
const minDate = new Date(
  maxDate.getFullYear() - 120,
  maxDate.getMonth(),
  maxDate.getDate()
);

// Datos de socio opcionales: si vienen, se validan; si no, no bloquean
const socioSchema = z.object({
  usoLenSenias: z.boolean().optional(),
  difAuditiva: z.boolean().optional(),
  desDifAuditiva: z.string().max(255).optional().or(z.literal("")),
});

const adminEditUserSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: "Debe tener entre 3 y 50 caracteres." })
    .max(50, { message: "Debe tener entre 3 y 50 caracteres." })
    .regex(reSoloLetras, { message: "Solo letras y espacios." }),

  apellido: z
    .string()
    .trim()
    .min(3, { message: "Debe tener entre 3 y 50 caracteres." })
    .max(50, { message: "Debe tener entre 3 y 50 caracteres." })
    .regex(reSoloLetras, { message: "Solo letras y espacios." }),

  calle: z
    .string()
    .trim()
    .min(2, { message: "Debe tener entre 2 y 50 caracteres." })
    .max(50, { message: "Debe tener entre 2 y 50 caracteres." })
    .regex(reCalle, {
      message: "Usa letras, números, espacios y . , - /",
    }),

  nroPuerta: z
  .string()
  .min(1, { message: "N° de puerta es obligatorio." })
  .refine(
    (val) =>
      !isNaN(Number(val)) &&
      Number(val) >= 0 &&
      Number.isInteger(Number(val)),
    {
      message: "Debe ser un número entero positivo.",
    }
  ),


  nroApto: z.string().optional(),

  fechaNacimiento: z
    .date({
      required_error: "La fecha de nacimiento es obligatoria.",
    })
    .refine((date) => date <= maxDate, {
      message: "La fecha no puede ser futura.",
    })
    .refine((date) => date >= minDate, {
      message: "Fecha demasiado antigua.",
    }),

  idPerfil: z.string().min(1, { message: "El rol es obligatorio." }),

  telefonos: z
    .array(
      z.object({
        value: z.string().trim().regex(reTelStrict, {
          message: "Formato inválido (6-20 dígitos, '+' opcional).",
        }),
      })
    )
    .min(1, { message: "Se requiere al menos un número de celular." })
    .max(9, { message: "No puedes añadir más de 9 teléfonos." }),

  socio: socioSchema.optional(),
});

interface AdminEditUserFormProps {
  usuario: Usuario;
  perfiles: PerfilOption[];
  onUpdateSuccess?: () => void;
}

export function AdminEditUserForm({
  usuario,
  perfiles,
  onUpdateSuccess,
}: AdminEditUserFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Estado inicial: usa usuario.estado o estadoDescripcion
  const initialEstado =
    (usuario as any).estado ??
    ((usuario as any).estadoDescripcion === "Activo");

  const [estadoActivo, setEstadoActivo] = useState<boolean>(
    Boolean(initialEstado)
  );
  const [estadoLoading, setEstadoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Perfil actual
  const perfilActualIdFromUser =
    (usuario as any).idPerfil ??
    (usuario as any).perfil?.idPerfil ??
    perfiles.find((p) => p.nomPerfil === (usuario as any).nombrePerfil)
      ?.idPerfil ??
    null;

  const socioActual: any = (usuario as any).socio ?? null;

  const form = useForm<z.infer<typeof adminEditUserSchema>>({
    resolver: zodResolver(adminEditUserSchema),
    defaultValues: {
      nombre: usuario.nombre || "",
      apellido: usuario.apellido || "",
      calle: usuario.calle || "",
      nroPuerta:
        typeof usuario.nroPuerta === "number"
          ? usuario.nroPuerta.toString()
          : "",
      nroApto: usuario.nroApto || "",
      fechaNacimiento: usuario.fechaNacimiento
        ? new Date(usuario.fechaNacimiento as any)
        : undefined,
      idPerfil: perfilActualIdFromUser ? String(perfilActualIdFromUser) : "",
      telefonos:
        usuario.telefonos && usuario.telefonos.length > 0
          ? usuario.telefonos.map((tel: string) => ({ value: tel }))
          : [{ value: "" }],
      socio: socioActual
        ? {
            usoLenSenias: Boolean(socioActual.usoLenSenias),
            difAuditiva: Boolean(socioActual.difAuditiva),
            desDifAuditiva: socioActual.desDifAuditiva ?? "",
          }
        : undefined,
    },
    mode: "onChange", // clave para que isDirty se actualice cuando cambian campos
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { isDirty, isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "telefonos",
  });

  const watchPerfil = watch("idPerfil");
  const watchDifAuditiva = watch("socio.difAuditiva");

  // Limpia descripción si se desmarca dificultad auditiva
  useEffect(() => {
    if (!watchDifAuditiva) {
      form.setValue("socio.desDifAuditiva", "");
    }
  }, [watchDifAuditiva, form]);

  // Toggle activar / desactivar
  async function handleToggleEstado() {
    const accessToken =
      (session as any)?.accessToken ??
      (session as any)?.userData?.accessToken ??
      null;

    if (!accessToken) {
      toast.error("No hay sesión activa");
      return;
    }

    if (!usuario.idUsuario) {
      toast.error("Usuario sin id válido");
      return;
    }

    const endpoint = estadoActivo
      ? `${API_BASE}/users/delete/${usuario.idUsuario}`
      : `${API_BASE}/users/activate/${usuario.idUsuario}`;

    setEstadoLoading(true);
    try {
      const resp = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!resp.ok) {
        let msg = estadoActivo
          ? "Error al desactivar usuario"
          : "Error al activar usuario";
        try {
          const data = await resp.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const nuevoEstado = !estadoActivo;
      setEstadoActivo(nuevoEstado);

      toast.success(
        nuevoEstado
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente"
      );
    } catch (err: any) {
      console.error("Error cambiando estado de usuario:", err);
      toast.error(err?.message || "No se pudo cambiar el estado del usuario");
    } finally {
      setEstadoLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof adminEditUserSchema>) {
    const accessToken =
      (session as any)?.accessToken ??
      (session as any)?.userData?.accessToken ??
      null;

    if (!accessToken) {
      toast.error("No hay sesión activa");
      return;
    }

    if (!usuario.idUsuario) {
      toast.error("Usuario sin id válido");
      return;
    }

    const selectedPerfilId = Number(values.idPerfil);
    setSaving(true);

    const telefonosLimpios = values.telefonos
      .map((t) => t.value.trim())
      .filter((t) => t.length > 0);

    const payload: any = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      calle: values.calle.trim(),
      nroPuerta: Number(values.nroPuerta),
      nroApto: values.nroApto?.trim() || null,
      fechaNacimiento: format(values.fechaNacimiento, "yyyy-MM-dd"),
      idPerfil: selectedPerfilId,
      telefonos: telefonosLimpios,
    };

    if (values.socio) {
      payload.socio = {
        usoLenSenias: values.socio.usoLenSenias ?? false,
        difAuditiva: values.socio.difAuditiva ?? false,
        desDifAuditiva:
          values.socio.desDifAuditiva &&
          values.socio.desDifAuditiva.trim() !== ""
            ? values.socio.desDifAuditiva.trim()
            : null,
      };
    }

    try {
      const response = await fetch(
        `${API_BASE}/users/update/${usuario.idUsuario}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMessage = "Error al actualizar usuario";
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }

      toast.success("Usuario actualizado correctamente");

      if (onUpdateSuccess) {
        onUpdateSuccess();
      } else {
        router.push("/dashboard/main");
      }
    } catch (error: any) {
      console.error("Error al actualizar usuario (admin):", error);
      toast.error(error.message || "Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/main">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeftCircleIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            Editar Usuario (Admin): {usuario.nombre} {usuario.apellido}
          </h1>
        </div>

        <Button
          type="button"
          variant={estadoActivo ? "destructive" : "outline"}
          onClick={handleToggleEstado}
          disabled={estadoLoading}
        >
          {estadoLoading
            ? "Procesando..."
            : estadoActivo
            ? "Desactivar"
            : "Activar"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dirección */}
          <div className="grid grid-cols-4 gap-4">
            <FormField
              control={control}
              name="calle"
              render={({ field }) => (
                <FormItem className="col-span-4 md:col-span-2">
                  <FormLabel>Calle</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="nroPuerta"
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>N° puerta</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="nroApto"
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Apto (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fecha de nacimiento */}
          <FormField
            control={control}
            name="fechaNacimiento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Nacimiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <Calendar1Icon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      locale={es}
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < minDate
                      }
                      captionLayout="dropdown"
                      fromYear={minDate.getFullYear()}
                      toYear={maxDate.getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rol / Perfil */}
          <FormField
            control={control}
            name="idPerfil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <FormControl>
                  <select
                    className="border rounded-md px-3 py-2 text-sm w-full bg-background"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="">Seleccione un rol</option>
                    {perfiles.map((p) => (
                      <option key={p.idPerfil} value={String(p.idPerfil)}>
                        {p.nomPerfil}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Datos de Socio (opcionales, solo se muestran si eligís Socio) */}
          {Number(watchPerfil) === SOCIO_PERFIL_ID && (
            <div className="space-y-4 border rounded-md p-4">
              <h2 className="text-sm font-semibold">Datos de Socio</h2>

              <FormField
                control={control}
                name="socio.usoLenSenias"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="mb-0">
                      ¿Usa lengua de señas?
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="socio.difAuditiva"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="mb-0">
                      ¿Tiene dificultad auditiva?
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="socio.desDifAuditiva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Descripción de la dificultad auditiva (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Pérdida moderada, usa audífono en oído derecho..."
                        disabled={!watchDifAuditiva}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Teléfonos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium">Teléfonos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fields.length >= 9}
                onClick={() => append({ value: "" })}
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Añadir
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={control}
                  name={`telefonos.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Número de teléfono"
                            {...inputField}
                            value={inputField.value || ""}
                          />
                        </FormControl>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link href="/dashboard/main">
              <Button type="button" variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving || isSubmitting || !isDirty}
            >
              {(saving || isSubmitting) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {saving || isSubmitting
                ? "Actualizando..."
                : "Actualizar Usuario"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
