"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar1Icon,
  Eye,
  EyeOff,
  PlusCircleIcon,
  XCircleIcon,
  Loader2,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { apiPublicPost } from "@/helpers/api-public";
import { toast } from "sonner";

import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Constantes (copiadas de tu código) ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCIO_ID_FALLBACK = 3;
const NO_SOCIO_ID_FALLBACK = 2;
const ADMIN_ID_FALLBACK = 1;
const AUXILIAR_ID_FALLBACK = 4;

const SOCIO_ID = Number(
  process.env.NEXT_PUBLIC_PERFIL_SOCIO_ID ?? SOCIO_ID_FALLBACK
);
const NO_SOCIO_ID = Number(
  process.env.NEXT_PUBLIC_PERFIL_NO_SOCIO_ID ?? NO_SOCIO_ID_FALLBACK
);

const ADMIN_ID = Number(
  process.env.NEXT_PUBLIC_PERFIL_ADMIN_ID ?? ADMIN_ID_FALLBACK
);
const AUXILIAR_ID = Number(
  process.env.NEXT_PUBLIC_PERFIL_AUXILIAR_ID ?? AUXILIAR_ID_FALLBACK
);

// ---*** 1. Definición del Esquema con Zod **---

const reSoloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const reCalle = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,\/-]+$/;
const reTelStrict = /^\+?\d{6,20}$/;
const maxDate = new Date();
const minDate = new Date(
  maxDate.getFullYear() - 120,
  maxDate.getMonth(),
  maxDate.getDate()
);

const createFormSchema = (isAdmin: boolean) => {
  const perfilesDisponibles = isAdmin
    ? ["Socio", "No Socio", "Administrador", "Auxiliar administrativo"]
    : ["Socio", "No Socio"];

  return z
    .object({
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

      email: z
        .string()
        .min(3, { message: "El correo es obligatorio." })
        .email({ message: "Formato de correo inválido." })
        .max(150, { message: "No puede superar los 150 caracteres." })
        .refine((val) => !val.toLowerCase().endsWith("@asur.local"), {
          message: "Cuentas @asur.local se gestionan por AD.",
        }),

      password: z
        .string()
        .min(8, { message: "Mínimo 8 caracteres." })
        .regex(/[A-Z]/, {
          message: "Debe tener al menos una letra mayúscula.",
        })
        .regex(/[a-z]/, {
          message: "Debe tener al menos una letra minúscula.",
        })
        .regex(/[0-9]/, { message: "Debe tener al menos un número." })
        .regex(/[^A-Za-z0-9]/, {
          message: "Debe tener al menos un caracter especial (ej: !@#$).",
        }),

      tipoDocumento: z.enum(["CI", "PASAPORTE", "OTRO"] as const, {
        required_error: "Selecciona el tipo de documento.",
      }),

      documento: z
        .string()
        .trim()
        .min(1, { message: "El número de documento es obligatorio." }),

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

      perfil: z.enum(perfilesDisponibles as const, {
        required_error: "Selecciona el perfil.",
      }),

      usoLenSenias: z.boolean().default(false),
      difAuditiva: z.boolean().default(false),
      desDifAuditiva: z.string().optional(),

      terminosAceptados: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (
        data.perfil === "Socio" &&
        data.difAuditiva === true &&
        !data.desDifAuditiva?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "La descripción es obligatoria si marcaste 'Dificultad auditiva'.",
          path: ["desDifAuditiva"],
        });
      }

      if (!isAdmin && data.terminosAceptados === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes aceptar los términos y condiciones.",
          path: ["terminosAceptados"],
        });
      }
    });
};

export function RegistrationForm({
  currentUserRole,
}: {
  currentUserRole?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const isAdmin =
    currentUserRole === "Administrador" ||
    currentUserRole === "Auxiliar administrativo";

  const formSchema = createFormSchema(isAdmin);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      tipoDocumento: undefined,
      documento: "",
      calle: "",
      nroPuerta: "",
      nroApto: "",
      fechaNacimiento: undefined,
      telefonos: [{ value: "" }],
      perfil: undefined,
      usoLenSenias: false,
      difAuditiva: false,
      desDifAuditiva: "",
      terminosAceptados: !isAdmin,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "telefonos",
  });

  const perfilSeleccionado = form.watch("perfil");
  const difAuditivaSeleccionada = form.watch("difAuditiva");

  type ErrorKey = keyof z.infer<typeof formSchema>;
  const mapServerFieldToClient = (field: string): ErrorKey | undefined => {
    if (!field) return undefined;
    const f = field.toLowerCase();
    if (f.includes("correo") || f === "email") return "email";
    if (f.includes("contrasenia") || f === "password") return "password";
    if (f.includes("calle")) return "calle";
    if (f.includes("nropuerta")) return "nroPuerta";
    if (f.includes("fechanacimiento")) return "fechaNacimiento";
    if (f.startsWith("telefonos")) return "telefonos";
    return undefined;
  };

  const parseServerErrors = (
    data: any
  ): [ErrorKey, string] | [undefined, string] => {
    const generic = (
      data?.message ||
      data?.error ||
      "Error del servidor"
    ).toString();
    const firstKey = Object.keys(data?.errors || {})[0];
    const clientKey = mapServerFieldToClient(firstKey);
    return [clientKey, generic];
  };

  const getPerfilId = (perfil: string) => {
    switch (perfil) {
      case "Socio":
        return SOCIO_ID;
      case "No Socio":
        return NO_SOCIO_ID;
      case "Administrador":
        return ADMIN_ID;
      case "Auxiliar administrativo":
        return AUXILIAR_ID;
      default:
        return NO_SOCIO_ID;
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    clearBanner();
    setLoading(true);

    const socioPayload =
      values.perfil === "Socio"
        ? {
            usoLenSenias: values.usoLenSenias,
            difAuditiva: values.difAuditiva,
            ...(values.desDifAuditiva?.trim()
              ? { desDifAuditiva: values.desDifAuditiva.trim() }
              : {}),
          }
        : undefined;

    const payload = {
      nombre: values.nombre,
      apellido: values.apellido,
      correo: values.email.trim().toLowerCase(),
      tipoDocumento: values.tipoDocumento,
      documento: values.documento,
      contrasenia: values.password,
      calle: values.calle,
      nroPuerta: Number(values.nroPuerta),
      nroApto: values.nroApto?.trim() || undefined,
      fechaNacimiento: format(values.fechaNacimiento, "yyyy-MM-dd"),
      idPerfil: getPerfilId(values.perfil),
      telefonos: values.telefonos.map((tel) => tel.value),
      socio: socioPayload,
    };

    //console.log("Payload a enviar:", payload);

    try {
      const res = await apiPublicPost("/users/register", payload);
      toast.success(isAdmin ? "¡Usuario Creado!" : "¡Registro realizado!", {
        description: `El usuario ${values.email} ha sido creado.`,
      });
      form.reset();

      if (!isAdmin) {
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err: any) {
      const [field, message] = parseServerErrors(err?.data);
      const errorMsg =
        message ||
        err.message ||
        "Error desconocido. Por favor, intente de nuevo.";

      if (field) {
        form.setError(field, { type: "server", message: errorMsg });
      } else {
        setBanner(errorMsg || err.message);
        toast.error("Error en el registro", {
          description: errorMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const clearBanner = () => banner && setBanner("");

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm mb-6 p-8 text-center">
          <Link href="/auth/login" className="flex justify-center mb-4">
            <Image
              src="/Logo_ASUR.png"
              alt="ASUR Logo"
              className="object-contain"
              width={500}
              height={500}
            />
          </Link>
        </div>

        <Card className="bg-gray-600 border-0">
          <CardContent className="px-8 py-2">
            <h2 className="text-white text-2xl font-semibold text-center mb-8">
              {isAdmin ? "Crear Nuevo Usuario" : "Registrarse"}
            </h2>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
              >
                {/* Banner de Error General */}
                {banner && (
                  <div className="p-3 bg-red-700 border border-red-500 text-white rounded">
                    {banner}
                  </div>
                )}

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Nombre</FormLabel>
                        <FormControl>
                          <Input className="bg-white w-full" placeholder="Juan" {...field} />
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
                        <FormLabel className="text-white">Apellido</FormLabel>
                        <FormControl>
                          <Input className="bg-white w-full" placeholder="Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email y Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Correo electrónico
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white w-full"
                            placeholder="usuario@dominio.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Contraseña</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              className="bg-white pr-10 w-full"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-slate-500"
                            aria-label={showPassword ? "Ocultar" : "Mostrar"}
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Documento y Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Documento</FormLabel>
                        <FormControl>
                          <Input className="bg-white w-full" placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white w-full">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CI">
                              Cédula de Identidad
                            </SelectItem>
                            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <FormLabel className="text-white">Calle</FormLabel>
                        <FormControl>
                          <Input className="bg-white" placeholder="Av. Siempre Viva" {...field} />
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
                        <FormLabel className="text-white">N° puerta</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-white"
                            placeholder="123"
                            {...field}
                          />
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
                        <FormLabel className="text-white">
                          Apto (opcional)
                        </FormLabel>
                        <FormControl>
                          <Input className="bg-white" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* --- NUEVO: Fecha de Nacimiento (Con Dropdowns) --- */}
                <FormField
                  control={form.control}
                  name="fechaNacimiento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-white">
                        Fecha de Nacimiento
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal bg-white",
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
                            className="rounded-lg border shadow-sm bg-white"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- Teléfonos Dinámicos --- */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-white text-sm font-medium">
                      Teléfonos (Celular es obligatorio)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
                      disabled={fields.length >= 3} // Límite de 3 teléfonos
                      onClick={() => append({ value: "" })}
                    >
                      <PlusCircleIcon className="mr-2 h-4 w-4" />
                      Añadir
                    </Button>
                  </div>

                  {/* Lista de campos de teléfono */}
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`telefonos.${index}.value`}
                        render={({ field: inputField }) => (
                          <FormItem>
                            {index === 0 && (
                              <FormLabel className="text-white sr-only">
                                Celular
                              </FormLabel>
                            )}
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Input
                                  type="tel"
                                  className="bg-white"
                                  placeholder={
                                    index === 0
                                      ? "Celular (ej: +5989...)"
                                      : "Otro teléfono (opcional)"
                                  }
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

                {/* Perfil */}
                <FormField
                  control={form.control}
                  name="perfil"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-white">Perfil</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-6"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem
                                value="No Socio"
                                className="border-white text-white"
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-white">
                              No Socio
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem
                                value="Socio"
                                className="border-white text-white"
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-white">
                              Socio
                            </FormLabel>
                          </FormItem>
                          {isAdmin && (
                            <>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Auxiliar administrativo"
                                    className="border-white text-white"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-white">
                                  Auxiliar administrativo
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Administrador"
                                    className="border-white text-white"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-white">
                                  Administrador
                                </FormLabel>
                              </FormItem>
                            </>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos Condicionales de Socio */}
                {perfilSeleccionado === "Socio" && (
                  <Card className="bg-gray-700 border-gray-500 pt-5">
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="usoLenSenias"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                              />
                            </FormControl>
                            <FormLabel className="text-white font-normal">
                              ¿Utiliza Lengua de Señas?
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="difAuditiva"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                              />
                            </FormControl>
                            <FormLabel className="text-white font-normal">
                              ¿Tiene alguna dificultad auditiva?
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {difAuditivaSeleccionada && (
                        <FormField
                          control={form.control}
                          name="desDifAuditiva"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">
                                Describa la dificultad (opcional si no marcó)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  className="bg-white"
                                  placeholder="Escriba aquí..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Términos y Botón */}

                {!isAdmin && (
                  <FormField
                    control={form.control}
                    name="terminosAceptados"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-white">
                            Acepto los términos y condiciones.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {loading
                    ? isAdmin
                      ? "Creando usuario..."
                      : "Registrando..."
                    : isAdmin
                    ? "Crear Usuario"
                    : "Crear Cuenta"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="bg-gray-800 rounded-lg mt-6 p-6">
          <div className="flex justify-center space-x-6">
            <Link
              href="#"
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>
            <Link
              href="#"
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
            </Link>
            <Link
              href="#"
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
              </svg>
            </Link>
          </div>
          <div className="text-center mt-4 text-gray-400 text-sm">
            Privacy Terms | Copyright © 2025 TB Dine
          </div>
        </div>
      </div>
    </div>
  );
}
