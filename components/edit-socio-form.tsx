"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon as Calendar1Icon,
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
import { apiClient } from "../helpers/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Usuario } from "@/interfaces/main-interfaces";

// --- Constantes de Validación ---
const reSoloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const reCalle = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,\/-]+$/;
const reTelStrict = /^\+?\d{6,20}$/;
const maxDate = new Date();
const minDate = new Date(
  maxDate.getFullYear() - 120,
  maxDate.getMonth(),
  maxDate.getDate()
);

// --- Esquema Zod (Simplificado) ---

const editSocioSchema = z.object({
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

// --- Props del Componente ---
interface EditSocioFormProps {
  userData: Usuario; // Recibe los datos de la sesión
  token: string;
  onUpdateSuccess: () => void; // Callback para notificar al padre
}

// --- El Componente de Formulario ---
export function EditSocioForm({
  userData,
  token,
  onUpdateSuccess,
}: EditSocioFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof editSocioSchema>>({
    resolver: zodResolver(editSocioSchema),
    // ---  Llenamos el form con los datos de la sesión (userData) ---
    defaultValues: {
      nombre: userData.nombre || "",
      apellido: userData.apellido || "",
      calle: userData.calle || "",
      nroPuerta: userData.nroPuerta?.toString() || "",
      nroApto: userData.nroApto || "",
      fechaNacimiento: userData.fechaNacimiento
        ? new Date(userData.fechaNacimiento + "T00:00:00")
        : undefined,
      telefonos:
        userData.telefonos && userData.telefonos.length > 0
          ? userData.telefonos.map((tel) => ({ value: tel }))
          : [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "telefonos",
  });

  async function onSubmit(values: z.infer<typeof editSocioSchema>) {
    setLoading(true);
    //console.log("onSubmit INICIADO");

    if (!token) {
      toast.error("Error de autenticación. La sesión no es válida.");
      setLoading(false);
      return;
    }

    const payload: any = {
      // Usamos 'any' para añadir 'telefonos' condicionalmente
      nombre: values.nombre,
      apellido: values.apellido,
      calle: values.calle,
      nroPuerta: Number(values.nroPuerta),
      nroApto: values.nroApto?.trim() || undefined,
      fechaNacimiento: format(values.fechaNacimiento, "yyyy-MM-dd"),
    };

    // --- LÓGICA DE COMPARACIÓN DE TELÉFONOS ---

    // a. Obtenemos los números nuevos (del formulario)
    const newTelefonos = values.telefonos.map((tel) => tel.value.trim());

    // b. Obtenemos los números originales (de las props)
    const originalTelefonos = userData.telefonos || [];

    // c. Comparamos si son diferentes (ordenados para ser precisos)
    const newTelefonosSorted = [...newTelefonos].sort().join(",");
    const originalTelefonosSorted = [...originalTelefonos].sort().join(",");

    const telefonosHanCambiado = newTelefonosSorted !== originalTelefonosSorted;

    // d. Añadimos 'telefonos' al payload SÓLO SI cambiaron
    if (telefonosHanCambiado) {
      //console.log("Detectado cambio en teléfonos. Enviando:", newTelefonos);
      payload.telefonos = newTelefonos;
    } else {
      //console.log("Teléfonos no cambiaron. No se incluirán en el payload.");
    }

    //console.log("Payload de /updatebyuser a enviar:", payload);

    try {
      //console.log("Llamando a apiClient...");

      //REEMPLAZA apiClient CON FETCH DIRECTO TEMPORALMENTE
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/users/updatebyuser`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      //console.log("Response status:", response.status);
      //console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        //console.error("Error response:", errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      // Si llega aquí, la llamada fue exitosa
      //console.log("LLAMADA EXITOSA - Ejecutando onUpdateSuccess");
      onUpdateSuccess();
    } catch (err: any) {
      //console.error("ERROR CAPTURADO:", err);
      //console.error("Error message:", err.message);
      //console.error("Error stack:", err.stack);

      toast.error("Error al actualizar", {
        description: err.message || "No se pudo guardar los cambios.",
      });
    } finally {
      setLoading(false);
      //console.log("onSubmit FINALIZADO");
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <a href="/dashboard/profile">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeftCircleIcon className="h-4 w-4 mr-2" />
            Volver al Perfil
          </Button>
        </a>
        <h1 className="text-2xl font-bold">Editar Mis Datos</h1>
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

          {/* Dirección */}
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

          {/* Fecha de Nacimiento */}
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
                      disabled={(date) => date > new Date() || date < minDate}
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
                  control={form.control}
                  name={
                    `telefonos.${index}.value` as `telefonos.${number}.value`
                  }
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
            {/* 5. CAMBIO: Link reemplazado por <a> */}
            <a href="/dashboard/profile">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </a>
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
