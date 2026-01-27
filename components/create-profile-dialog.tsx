"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/helpers/api-client";

const formSchema = z.object({
  nomPerfil: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres"),
  descripcion: z
    .string()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(100, "La descripción no puede superar los 100 caracteres"),
});

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProfileDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = (session as any)?.userData?.accessToken;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomPerfil: "",
      descripcion: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      toast.error("Error de autenticación");
      return;
    }

    setLoading(true);

    try {
      await apiClient("/perfiles/create", token, {
        method: "POST",
        body: JSON.stringify(values),
      });

      toast.success("Perfil creado correctamente");
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al crear perfil:", error);
      toast.error("Error al crear perfil", {
        description: error.message || "Intente nuevamente",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Perfil</DialogTitle>
          <DialogDescription>
            Complete los campos para crear un nuevo perfil de usuario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomPerfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Perfil</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Coordinador, Supervisor, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa las funciones y responsabilidades de este perfil..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Perfil
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}