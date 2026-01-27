"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Perfil } from "@/interfaces/profile-interfaces";
import { apiClient } from "@/helpers/api-client";
import { EditProfileDialog } from "./edit-profile-dialog";

interface ProfileActionsProps {
  perfil: Perfil;
  onProfileUpdated: () => void;
}

export function ProfileActions({
  perfil,
  onProfileUpdated,
}: ProfileActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { data: session } = useSession();
  const token = (session as any)?.userData?.accessToken;

  const handleEstadoChange = async (nuevoEstado: boolean) => {
    if (!token) return;
    setLoading(true);

    try {
      if (nuevoEstado) {
        await apiClient(`/perfiles/activate/${perfil.idPerfil}`, token, {
          method: "PUT",
        });
        toast.success(`Perfil ${perfil.nomPerfil} activado.`);
      } else {
        await apiClient(`/perfiles/delete/${perfil.idPerfil}`, token, {
          method: "PUT",
        });
        toast.success(`Perfil ${perfil.nomPerfil} desactivado.`);
      }
      onProfileUpdated();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al cambiar estado", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {perfil.estado ? (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => handleEstadoChange(false)}
            >
              <XCircle className="mr-2 h-4 w-4" /> Desactivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-green-600 focus:text-green-600"
              onClick={() => handleEstadoChange(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Activar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showEditDialog && (
        <EditProfileDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          perfil={perfil}
          onSuccess={onProfileUpdated}
        />
      )}
    </>
  );
}
