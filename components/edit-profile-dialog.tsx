"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea"; 

import { Perfil } from "@/interfaces/profile-interfaces";
import { apiClient } from "@/helpers/api-client";

const formSchema = z.object({
  descripcion: z
    .string()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(100, "La descripción no puede superar los 100 caracteres"),
});

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: Perfil;
  onSuccess: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  perfil,
  onSuccess,
}: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = (session as any)?.userData?.accessToken;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descripcion: perfil.descripcion || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) return;
    setLoading(true);
    try {
      
      await apiClient(`/perfiles/update/${perfil.idPerfil}`, token, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      
      toast.success("Perfil actualizado correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Error al actualizar perfil", {
        description: error.message || "Ocurrió un error inesperado",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Modifica la descripción del perfil <b>{perfil.nomPerfil}</b>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción del rol..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}