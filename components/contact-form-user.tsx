// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Loader2, Send } from "lucide-react";
// import { toast } from "sonner";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// // Esquema de validación con Zod
// const contactSchema = z.object({
//   nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
//   email: z.string().email("Por favor ingresa un correo válido"),
//   asunto: z.string().min(5, "El asunto debe ser más descriptivo"),
//   tipoConsulta: z.string({
//     required_error: "Por favor selecciona un tipo de consulta",
//   }),
//   mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
// });

// export function ContactFormUser() {
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const form = useForm<z.infer<typeof contactSchema>>({
//     resolver: zodResolver(contactSchema),
//     defaultValues: {
//       nombre: "",
//       email: "",
//       asunto: "",
//       mensaje: "",
//     },
//   });

//   async function onSubmit(values: z.infer<typeof contactSchema>) {
//     setIsSubmitting(true);

//     // Simulamos una llamada a API (aquí iría tu fetch real)
//     await new Promise((resolve) => setTimeout(resolve, 2000));

//     console.log(values);

//     toast.success("¡Mensaje enviado!", {
//       description: "Nos pondremos en contacto contigo pronto.",
//     });

//     form.reset();
//     setIsSubmitting(false);
//   }

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-4xl mx-auto px-4">
//         <div className="rounded-lg shadow-sm mb-6 p-8 text-center">
//           <Link href="/auth/login" className="flex justify-center mb-4">
//             <Image
//               src="/Logo_ASUR.png"
//               alt="ASUR Logo"
//               className="object-contain"
//               width={500}
//               height={500}
//             />
//           </Link>
//         </div>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="nombre"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Nombre Completo</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Juan Pérez" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Correo Electrónico</FormLabel>
//                     <FormControl>
//                       <Input placeholder="juan@ejemplo.com" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="tipoConsulta"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Tipo de Consulta</FormLabel>
//                     <Select
//                       onValueChange={field.onChange}
//                       defaultValue={field.value}
//                     >
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Selecciona un motivo" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectItem value="general">
//                           Consulta General
//                         </SelectItem>
//                         <SelectItem value="soporte">Soporte Técnico</SelectItem>
//                         <SelectItem value="ventas">
//                           Ventas / Presupuesto
//                         </SelectItem>
//                         <SelectItem value="reclamo">Reclamo</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="asunto"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Asunto</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Resumen breve..." {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <FormField
//               control={form.control}
//               name="mensaje"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Mensaje</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder="Escribe tu mensaje aquí..."
//                       className="min-h-[120px]"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <Button type="submit" className="w-full" disabled={isSubmitting}>
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Enviando...
//                 </>
//               ) : (
//                 <>
//                   <Send className="mr-2 h-4 w-4" /> Enviar Mensaje
//                 </>
//               )}
//             </Button>
//           </form>
//         </Form>
//       </div>
//     </div>
//   );
// }

/*
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react"; 
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

// Esquema de validación con Zod
const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Por favor ingresa un correo válido"),
  asunto: z.string().min(5, "El asunto debe ser más descriptivo"),
  tipoConsulta: z.string({
    required_error: "Por favor selecciona un tipo de consulta",
  }),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export function ContactFormUser() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nombre: "",
      email: "",
      asunto: "",
      mensaje: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    setIsSubmitting(true);

    // Simulamos una llamada a API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(values);

    toast.success("¡Mensaje enviado!", {
      description: "Nos pondremos en contacto contigo pronto.",
    });

    form.reset();
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-4xl mx-auto px-4">

        <div className="flex flex-col items-center justify-center mb-8">
          <Link
            href="/auth/login"
            className="mb-6 transition-transform hover:scale-105"
          >
            <Image
              src="/Logo_ASUR.png"
              alt="ASUR Logo"
              className="object-contain drop-shadow-sm"
              width={400}
              height={150} // Ajustado para mejor proporción
              priority
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <Card className="lg:col-span-1 bg-white h-fit">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Nuestras Oficinas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Calle Principal 123
                  <br />
                  Ciudad, País
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Contacto Directo
                </h3>
                <p className="text-sm text-muted-foreground">
                  contacto@asur.com.uy
                  <br />
                  +598 99 123 456
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Síguenos</h3>
                <div className="flex gap-4 justify-start">
                  <a
                    href="#"
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-sky-500 transition-colors"
                  >
                    <Twitter className="h-6 w-6" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-pink-600 transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-blue-700 transition-colors"
                  >
                    <Linkedin className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

    
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardTitle className="pt-6 text-center text-2xl font-bold">
              Envíanos tu Consulta
            </CardTitle>
            <CardContent className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Juan Pérez"
                              className="bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="juan@ejemplo.com"
                              className="bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tipoConsulta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Consulta</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecciona un motivo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">
                                Consulta General
                              </SelectItem>
                              <SelectItem value="soporte">
                                Soporte Técnico
                              </SelectItem>
                              <SelectItem value="ventas">
                                Ventas / Presupuesto
                              </SelectItem>
                              <SelectItem value="reclamo">Reclamo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="asunto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Resumen breve..."
                              className="bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="mensaje"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe tu mensaje aquí..."
                            className="min-h-[120px] bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 font-semibold text-lg h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" /> Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
*/

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

// Esquema de validación con Zod
const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Por favor ingresa un correo válido"),
  asunto: z.string().min(5, "El asunto debe ser más descriptivo"),
  tipoConsulta: z.string({
    required_error: "Por favor selecciona un tipo de consulta",
  }),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export function ContactFormUser() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nombre: "",
      email: "",
      asunto: "",
      mensaje: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("¡Mensaje enviado!", {
      description: "Nos pondremos en contacto contigo pronto.",
    });

    form.reset();
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-100/5 py-12">
      <div className="max-w-5xl mx-auto px-4">

        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-10 border-2 p-4 rounded-lg shadow-sm">
          <Link href="/auth/main" className="mb-6 transition-transform hover:scale-105">
            <Image
              src="/Logo_ASUR.png"
              alt="ASUR Logo"
              className="object-contain drop-shadow-sm"
              width={400}
              height={150}
              priority
            />
          </Link>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna Izquierda */}
          <Card className="flex flex-col h-full bg-white shadow-md lg:col-span-1">
            <CardContent className="pt-6 space-y-6 h-full flex flex-col">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Nuestras Oficinas</h3>
                <p className="text-sm text-muted-foreground">
                  Hermanos Gil 945
                  <br />
                  Montevideo, Uruguay
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contacto Directo</h3>
                <p className="text-sm text-muted-foreground">
                  contacto@asur.com.uy
                  <br />
                  2308 3212
                </p>
              </div>

              <div className="pt-4 border-t mt-auto">
                <h3 className="font-semibold text-gray-900 mb-4">Síguenos</h3>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                    <Facebook className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-500 hover:text-sky-500 transition-colors">
                    <Twitter className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-500 hover:text-pink-600 transition-colors">
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-500 hover:text-blue-700 transition-colors">
                    <Linkedin className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Columna Derecha - Formulario */}
          <Card className="flex flex-col h-full lg:col-span-2 border-0 shadow-lg">
            <CardTitle className="pt-6 text-center text-2xl font-bold">
              Envíanos tu Consulta
            </CardTitle>

            <CardContent className="p-6 md:p-8 flex-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Nombre y Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Pérez" className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input placeholder="juan@ejemplo.com" className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tipo consulta + Asunto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tipoConsulta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Consulta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecciona un motivo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">Consulta General</SelectItem>
                              <SelectItem value="soporte">Soporte Técnico</SelectItem>
                              <SelectItem value="ventas">Ventas / Presupuesto</SelectItem>
                              <SelectItem value="reclamo">Reclamo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="asunto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Resumen breve..." className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Mensaje */}
                  <FormField
                    control={form.control}
                    name="mensaje"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe tu mensaje aquí..."
                            className="min-h-[140px] bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botón */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 font-semibold text-lg h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" /> Enviar Mensaje
                      </>
                    )}
                  </Button>

                </form>
              </Form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
