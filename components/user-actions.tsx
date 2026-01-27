// components/user-actions.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import type { Usuario } from "@/interfaces/main-interfaces";

type UserActionsProps = {
  usuario: Usuario;
  onUserUpdated?: () => void;
};

export function UserActions({ usuario, onUserUpdated }: UserActionsProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/update-account?id=${usuario.idUsuario}`);
  };

  const handleDelete = () => {
    // lógica futura
    onUserUpdated?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconDotsVertical className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <IconPencil className="mr-2 h-4 w-4" />
          Editar usuario
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>
          <IconTrash className="mr-2 h-4 w-4" />
          Desactivar / borrar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
