// components/profile-functionalities-page-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { apiClient } from "@/helpers/api-client";
import type { Funcionalidad, FuncionalidadPage } from "@/interfaces";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PerfilResumen = {
  idPerfil: number;
  nomPerfil: string;
  descripcion?: string | null;
  estado: boolean;
};

export function ProfileFunctionalitiesPageClient() {
  const { data: session } = useSession();

  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const [profiles, setProfiles] = useState<PerfilResumen[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<PerfilResumen | null>(
    null
  );

  const [available, setAvailable] = useState<Funcionalidad[]>([]);
  const [assigned, setAssigned] = useState<Funcionalidad[]>([]);

  const [availableFilter, setAvailableFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  const [selectedAvailableIds, setSelectedAvailableIds] = useState<number[]>(
    []
  );
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>([]);

  const [loadingProfileData, setLoadingProfileData] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [savingFullSet, setSavingFullSet] = useState(false);

  function ensureToken(): string | null {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return null;
    }
    return token;
  }

  // --------- Carga de perfiles con debounce sobre el nombre ---------

  async function fetchProfiles(term: string) {
    const tk = ensureToken();
    if (!tk) return;

    try {
      setProfilesLoading(true);

      const params = new URLSearchParams();
      if (term.trim()) {
        params.set("nombre", term.trim());
      }
      // Si querés solo activos:
      // params.set("estado", "true");

      const qs = params.toString();
      const url = `/perfiles/getall${qs ? `?${qs}` : ""}`;

      const perfiles = await apiClient<PerfilResumen[]>(url, tk);
      setProfiles(perfiles);
    } catch (error: any) {
      console.error("Error cargando perfiles:", error);
      toast.error(
        error?.message || "Error al cargar los perfiles. Intentá nuevamente."
      );
    } finally {
      setProfilesLoading(false);
    }
  }

  useEffect(() => {
    fetchProfiles("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchProfiles(profileSearch);
    }, 400);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileSearch]);

  // --------- Carga de funcionalidades para el perfil seleccionado ---------

  async function loadProfileFunctionalities(perfil: PerfilResumen) {
    const tk = ensureToken();
    if (!tk) return;

    try {
      setLoadingProfileData(true);
      setSelectedAvailableIds([]);
      setSelectedAssignedIds([]);

      const [allActivesPage, assignedList] = await Promise.all([
        apiClient<FuncionalidadPage>(
          "/funcionalidades/listar-filtros?estado=activos&page=0&size=500",
          tk
        ),
        apiClient<Funcionalidad[]>(
          `/funcionalidades/perfil/${perfil.idPerfil}`,
          tk
        ),
      ]);

      const allActives = allActivesPage.content ?? [];
      const assignedIds = new Set(
        assignedList.map((f) => f.idFuncionalidad)
      );

      setAssigned(assignedList);
      setAvailable(
        allActives.filter((f) => !assignedIds.has(f.idFuncionalidad))
      );
    } catch (error: any) {
      console.error("Error cargando funcionalidades del perfil:", error);
      toast.error(
        error?.message ||
          "Error al cargar las funcionalidades del perfil seleccionado."
      );
    } finally {
      setLoadingProfileData(false);
    }
  }

  function handleSelectProfile(perfil: PerfilResumen) {
    setSelectedProfile(perfil);
    loadProfileFunctionalities(perfil);
  }

  // --------- Helpers de selección ---------

  function toggleAvailable(id: number) {
    setSelectedAvailableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAssigned(id: number) {
    setSelectedAssignedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // --------- Acciones contra la API ---------

  async function handleAssignSelected() {
    if (!selectedProfile) {
      toast.error("Primero seleccioná un perfil.");
      return;
    }
    if (selectedAvailableIds.length === 0) {
      toast.error("Seleccioná al menos una funcionalidad disponible.");
      return;
    }

    const tk = ensureToken();
    if (!tk) return;

    try {
      setAssigning(true);

      await apiClient<void>(
        `/funcionalidades/asignar/${selectedProfile.idPerfil}`,
        tk,
        {
          method: "POST",
          body: JSON.stringify({
            funcionalidadesIds: selectedAvailableIds,
          }),
        }
      );

      toast.success("Funcionalidades asignadas correctamente.");
      await loadProfileFunctionalities(selectedProfile);
    } catch (error: any) {
      console.error("Error asignando funcionalidades:", error);
      toast.error(
        error?.message || "No se pudieron asignar las funcionalidades."
      );
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassignSelected() {
    if (!selectedProfile) {
      toast.error("Primero seleccioná un perfil.");
      return;
    }
    if (selectedAssignedIds.length === 0) {
      toast.error("Seleccioná al menos una funcionalidad asignada.");
      return;
    }

    const tk = ensureToken();
    if (!tk) return;

    try {
      setUnassigning(true);

      await apiClient<void>(
        `/funcionalidades/desasignar/${selectedProfile.idPerfil}`,
        tk,
        {
          method: "DELETE",
          body: JSON.stringify({
            funcionalidadesIds: selectedAssignedIds,
          }),
        }
      );

      toast.success("Funcionalidades desasignadas correctamente.");
      await loadProfileFunctionalities(selectedProfile);
    } catch (error: any) {
      console.error("Error desasignando funcionalidades:", error);
      toast.error(
        error?.message || "No se pudieron desasignar las funcionalidades."
      );
    } finally {
      setUnassigning(false);
    }
  }

  async function handleSaveFullSet() {
    if (!selectedProfile) {
      toast.error("Primero seleccioná un perfil.");
      return;
    }

    const tk = ensureToken();
    if (!tk) return;

    const allIds = assigned.map((f) => f.idFuncionalidad);

    try {
      setSavingFullSet(true);

      await apiClient<void>(
        `/funcionalidades/modificar/${selectedProfile.idPerfil}`,
        tk,
        {
          method: "PUT",
          body: JSON.stringify({
            funcionalidadesIds: allIds,
          }),
        }
      );

      toast.success("Conjunto de funcionalidades del perfil actualizado.");
      await loadProfileFunctionalities(selectedProfile);
    } catch (error: any) {
      console.error("Error guardando conjunto del perfil:", error);
      toast.error(
        error?.message || "No se pudo guardar el conjunto de funcionalidades."
      );
    } finally {
      setSavingFullSet(false);
    }
  }

  // --------- Filtros locales de listas ---------

  const filteredAvailable = useMemo(
    () =>
      available.filter((f) =>
        f.nombre.toLowerCase().includes(availableFilter.toLowerCase())
      ),
    [available, availableFilter]
  );

  const filteredAssigned = useMemo(
    () =>
      assigned.filter((f) =>
        f.nombre.toLowerCase().includes(assignedFilter.toLowerCase())
      ),
    [assigned, assignedFilter]
  );

  // --------- Render ---------

  return (
    <div className="flex flex-col gap-6">
      {/* Selección de perfil por nombre */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del perfil</CardTitle>
          <p className="text-sm text-muted-foreground">
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
  <div className="space-y-2 w-full lg:w-80">
    <Label>Buscar perfil por nombre</Label>
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Filtrar por nombre de perfil..."
        value={profileSearch}
        onChange={(e) => setProfileSearch(e.target.value)}
        className="pl-8"
      />
    </div>
    <p className="text-xs text-muted-foreground">
      La búsqueda tiene un pequeño retardo para evitar llamadas
      innecesarias al servidor.
    </p>
  </div>

  <div className="flex-1 space-y-2">
    <Label>Perfil seleccionado</Label>
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
      {selectedProfile ? (
        <>
          <div className="font-medium">
            {selectedProfile.nomPerfil}{" "}
            {!selectedProfile.estado && "(inactivo)"}
          </div>
          {selectedProfile.descripcion && (
            <div className="text-muted-foreground">
              {selectedProfile.descripcion}
            </div>
          )}
        </>
      ) : (
        <span className="text-muted-foreground">
          No hay perfil seleccionado.
        </span>
      )}
    </div>
  </div>
</div>

          <div className="mt-4">
            <Label>Perfiles encontrados</Label>
            <div className="mt-2 rounded-md border">
              <div className="h-56 overflow-y-auto">
                {profilesLoading && (
                  <div className="p-3 text-sm text-muted-foreground">
                    Buscando perfiles...
                  </div>
                )}

                {!profilesLoading && profiles.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">
                    No se encontraron perfiles con ese filtro.
                  </div>
                )}

                {!profilesLoading &&
                  profiles.map((perfil) => {
                    const isSelected =
                      selectedProfile &&
                      selectedProfile.idPerfil === perfil.idPerfil;

                    return (
                      <button
                        key={perfil.idPerfil}
                        type="button"
                        onClick={() => handleSelectProfile(perfil)}
                        className={`flex w-full flex-col items-start border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent ${
                          isSelected ? "bg-accent" : ""
                        }`}
                      >
                        <span className="font-medium">{perfil.nomPerfil}</span>
                        {perfil.descripcion && (
                          <span className="text-xs text-muted-foreground">
                            {perfil.descripcion}
                          </span>
                        )}
                        {!perfil.estado && (
                          <span className="mt-1 rounded bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                            Inactivo
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listas de funcionalidades */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Disponibles (activas)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Buscar</Label>
              <Input
                placeholder="Filtrar por nombre..."
                value={availableFilter}
                onChange={(e) => setAvailableFilter(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <div className="h-72 overflow-y-auto">
                {loadingProfileData && (
                  <div className="p-3 text-sm text-muted-foreground">
                    Cargando funcionalidades del perfil...
                  </div>
                )}

                {!loadingProfileData &&
                  !selectedProfile &&
                  filteredAvailable.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">
                      Seleccioná un perfil para ver las funcionalidades
                      disponibles.
                    </div>
                  )}

                {!loadingProfileData &&
                  selectedProfile &&
                  filteredAvailable.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">
                      No hay funcionalidades disponibles para asignar.
                    </div>
                  )}

                {!loadingProfileData &&
                  filteredAvailable.map((func) => (
                    <label
                      key={func.idFuncionalidad}
                      className="flex cursor-pointer items-start gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedAvailableIds.includes(
                          func.idFuncionalidad
                        )}
                        onChange={() => toggleAvailable(func.idFuncionalidad)}
                      />
                      <div>
                        <div className="font-medium">{func.nombre}</div>
                        {func.descripcion && (
                          <div className="text-xs text-muted-foreground">
                            {func.descripcion}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleAssignSelected}
              disabled={
                assigning ||
                !selectedProfile ||
                selectedAvailableIds.length === 0
              }
            >
              {assigning ? "Asignando..." : "Asignar seleccionadas"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asignadas al perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Buscar</Label>
              <Input
                placeholder="Filtrar por nombre..."
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <div className="h-72 overflow-y-auto">
                {loadingProfileData && (
                  <div className="p-3 text-sm text-muted-foreground">
                    Cargando funcionalidades del perfil...
                  </div>
                )}

                {!loadingProfileData &&
                  !selectedProfile &&
                  filteredAssigned.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">
                      Seleccioná un perfil para ver las funcionalidades
                      asignadas.
                    </div>
                  )}

                {!loadingProfileData &&
                  selectedProfile &&
                  filteredAssigned.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">
                      El perfil no tiene funcionalidades asignadas.
                    </div>
                  )}

                {!loadingProfileData &&
                  filteredAssigned.map((func) => (
                    <label
                      key={func.idFuncionalidad}
                      className="flex cursor-pointer items-start gap-2 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedAssignedIds.includes(
                          func.idFuncionalidad
                        )}
                        onChange={() => toggleAssigned(func.idFuncionalidad)}
                      />
                      <div>
                        <div className="font-medium">{func.nombre}</div>
                        {func.descripcion && (
                          <div className="text-xs text-muted-foreground">
                            {func.descripcion}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleUnassignSelected}
                disabled={
                  unassigning ||
                  !selectedProfile ||
                  selectedAssignedIds.length === 0
                }
              >
                {unassigning ? "Desasignando..." : "Desasignar seleccionadas"}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveFullSet}
                disabled={savingFullSet || !selectedProfile}
              >
                {savingFullSet
                  ? "Guardando conjunto..."
                  : "Guardar conjunto del perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
