import {Usuario} from "./main-interfaces"

export interface UserActionsProps {
  usuario: Usuario;
  onUserUpdated: () => void;

  //WIP:
  onEditClick: () => void;
}