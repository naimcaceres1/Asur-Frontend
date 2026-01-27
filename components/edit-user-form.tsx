// components/edit-user-form.tsx
"use client";

import { useState } from "react";
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

const reSoloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const reCalle = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,\/-]+$/;
const reTelStrict = /^\+?\d{6,20}$/;
const maxDate = new Date();
const minDate = new Date(
  maxDate.getFullYear() - 120,
  maxDate.getMonth(),
  maxDate.getDate()
);

const editUserSchema = z.object({
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
    .regex(reCalle, { message: "Usa letras, números, espacios y . , - /" }),

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
});

interface EditUserFormProps {
  usuario: Usuario;
  onUpdateSuccess?: () => void;
}

export function EditUserForm({ usuario, onUpdateSuccess }: EditUserFormProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const getDefaultValues = () => {
    return {
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
      telefonos:
        usuario.telefonos && usuario.telefonos.length > 0
          ? usuario.telefonos.map((tel: string) => ({ value: tel }))
          : [{ value: "" }],
    };
  };

  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "telefonos",
  });

  async function onSubmit(values: z.infer<typeof editUserSchema>) {
    const accessToken =
      (session as any)?.accessToken ??
      (session as any)?.userData?.accessToken ??
      null;

    if (!accessToken) {
      toast.error("No hay sesión activa");
      return;
    }

    setLoading(true);

    const editedPhones = values.telefonos
      .map((t) => t.value.trim())
      .filter((t) => t.length > 0);

    const originalPhones: string[] = Array.isArray(usuario.telefonos)
      ? (usuario.telefonos as string[])
      : [];

    const nuevosTelefonos = editedPhones.filter(
      (tel) => !originalPhones.includes(tel)
    );

    const payload: any = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      calle: values.calle.trim(),
      nroPuerta: Number(values.nroPuerta),
      nroApto: values.nroApto?.trim() || null,
      fechaNacimiento: format(values.fechaNacimiento, "yyyy-MM-dd"),
    };

    if (nuevosTelefonos.length > 0) {
      payload.telefonos = nuevosTelefonos;
    }

    try {
      const response = await fetch(`${API_BASE}/users/updatebyuser`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Error al actualizar usuario";
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (response.status === 409) {
            errorMessage =
              "Conflicto de integridad de datos (teléfono duplicado u otra restricción).";
          }
        } catch {
          // ignoramos error de parseo
        }
        throw new Error(errorMessage);
      }

      toast.success("Usuario actualizado correctamente");

      if (onUpdateSuccess) {
        onUpdateSuccess();
      } else {
        router.push("/dashboard/profile");
      }
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      toast.error(error.message || "Error al actualizar usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeftCircleIcon className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Editar Mi Perfil
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
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

          <div className="grid grid-cols-4 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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

          <FormField
            control={form.control}
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
                  control={form.control}
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

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link href="/dashboard/profile">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Actualizando..." : "Actualizar Perfil"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}